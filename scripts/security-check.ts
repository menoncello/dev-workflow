#!/usr/bin/env bun

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

interface SecurityIssue {
  type: "critical" | "high" | "medium" | "low";
  description: string;
  recommendation: string;
}

class SecurityChecker {
  private issues: SecurityIssue[] = [];

  async runAllChecks(): Promise<void> {
    console.log("🔒 Running Security Checks");
    console.log("=============================\n");

    await this.checkDependencyVulnerabilities();
    await this.checkEnvironmentVariables();
    await this.checkCodeSecurity();
    await this.checkSecretsExposure();
    await this.checkApiSecurity();
    await this.checkDatabaseSecurity();

    this.printSummary();
    this.setExitCode();
  }

  private async checkDependencyVulnerabilities(): Promise<void> {
    console.log("📦 Checking dependency vulnerabilities...");

    try {
      // Run npm audit
      const auditOutput = execSync("npm audit --json", { encoding: "utf8" });
      const auditResult = JSON.parse(auditOutput);

      if (auditResult.vulnerabilities) {
        Object.entries(auditResult.vulnerabilities).forEach(([pkg, vuln]: [string, any]) => {
          if (vuln.severity === "critical" || vuln.severity === "high") {
            this.issues.push({
              type: vuln.severity === "critical" ? "critical" : "high",
              description: `Security vulnerability in ${pkg}: ${vuln.title}`,
              recommendation: `Update ${pkg} to ${vuln.fixAvailable?.version || "latest version"}`,
            });
          }
        });
      }

      console.log("✅ Dependency check completed");
    } catch (error: any) {
      // npm audit exits with non-zero code when vulnerabilities are found
      if (error.stdout) {
        try {
          const auditResult = JSON.parse(error.stdout);
          if (auditResult.vulnerabilities) {
            Object.entries(auditResult.vulnerabilities).forEach(([pkg, vuln]: [string, any]) => {
              if (vuln.severity === "critical" || vuln.severity === "high") {
                this.issues.push({
                  type: vuln.severity === "critical" ? "critical" : "high",
                  description: `Security vulnerability in ${pkg}: ${vuln.title}`,
                  recommendation: `Update ${pkg} to ${vuln.fixAvailable?.version || "latest version"}`,
                });
              }
            });
          }
        } catch {
          this.issues.push({
            type: "high",
            description: "Failed to parse npm audit results",
            recommendation: "Run npm audit manually to check for vulnerabilities",
          });
        }
      }
      console.log(
        "⚠️ npm audit found vulnerabilities (this is expected if issues are reported above)"
      );
    }
  }

  private async checkEnvironmentVariables(): Promise<void> {
    console.log("🌍 Checking environment variables...");

    const requiredEnvVars = ["JWT_SECRET", "ENCRYPTION_SECRET"];
    const _sensitiveEnvVars = [...requiredEnvVars, "DATABASE_URL", "API_SECRET"];

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      if (!value) {
        this.issues.push({
          type: "critical",
          description: `Missing required environment variable: ${envVar}`,
          recommendation: `Set ${envVar} in your environment`,
        });
      } else if (value.length < 16) {
        this.issues.push({
          type: "high",
          description: `Environment variable ${envVar} is too short (${value.length} characters)`,
          recommendation: `Use a longer, more secure value for ${envVar} (at least 16 characters)`,
        });
      } else if (value.includes("example") || value.includes("test") || value.includes("default")) {
        this.issues.push({
          type: "high",
          description: `Environment variable ${envVar} appears to be using default/example value`,
          recommendation: `Replace ${envVar} with a secure, unique value`,
        });
      }
    }

    // Check for hardcoded secrets in .env files
    const envFiles = [".env", ".env.local", ".env.example"];
    for (const envFile of envFiles) {
      if (existsSync(envFile)) {
        const content = readFileSync(envFile, "utf8");
        const lines = content.split("\n");

        lines.forEach((line, lineIndex) => {
          if (line.includes("password") || line.includes("secret") || line.includes("key")) {
            const value = line.split("=")[1];
            if (value && !value.includes('"') && !value.includes("${")) {
              this.issues.push({
                type: "medium",
                description: `Potential hardcoded secret in ${envFile}:${lineIndex + 1}`,
                recommendation: "Use environment variable substitution for sensitive values",
              });
            }
          }
        });
      }
    }

    console.log("✅ Environment variables check completed");
  }

  private async checkCodeSecurity(): Promise<void> {
    console.log("🔍 Checking code security patterns...");

    try {
      // Check for common security anti-patterns in source code
      const sourceFiles = execSync('find src -name "*.ts" -o -name "*.js"', { encoding: "utf8" })
        .split("\n")
        .filter(Boolean);

      for (const file of sourceFiles) {
        const content = readFileSync(file, "utf8");

        // Check for hardcoded secrets
        const secretPatterns = [
          /password\s*=\s*['"`][^'"`]{3,}['"`]/gi,
          /secret\s*=\s*['"`][^'"`]{3,}['"`]/gi,
          /api[_-]?key\s*=\s*['"`][^'"`]{3,}['"`]/gi,
          /token\s*=\s*['"`][^'"`]{10,}['"`]/gi,
        ];

        secretPatterns.forEach((pattern, _index) => {
          const matches = content.match(pattern);
          if (matches) {
            this.issues.push({
              type: "high",
              description: `Potential hardcoded secret found in ${file}`,
              recommendation:
                "Move secrets to environment variables and use proper secret management",
            });
          }
        });

        // Check for eval usage
        if (content.includes("eval(")) {
          this.issues.push({
            type: "high",
            description: `Use of eval() detected in ${file}`,
            recommendation: "Remove eval() usage and use safer alternatives",
          });
        }

        // Check for SQL injection risks
        if (
          content.includes("SELECT * WHERE") &&
          !content.includes("parameterized") &&
          !content.includes("prepared")
        ) {
          this.issues.push({
            type: "medium",
            description: `Potential SQL injection risk in ${file}`,
            recommendation: "Use parameterized queries or prepared statements",
          });
        }
      }

      console.log("✅ Code security check completed");
    } catch (error) {
      console.log("⚠️ Code security check failed:", error);
    }
  }

  private async checkSecretsExposure(): Promise<void> {
    console.log("🔐 Checking for secrets exposure...");

    try {
      // Check for secrets in logs or documentation
      const logFiles = execSync('find . -name "*.log" -o -name "*.md" | head -10', {
        encoding: "utf8",
      })
        .split("\n")
        .filter(Boolean);

      for (const file of logFiles) {
        if (existsSync(file)) {
          const content = readFileSync(file, "utf8");

          // Check for common secret patterns
          const secretPatterns = [
            /sk_[a-zA-Z0-9]{24,}/g, // Stripe keys
            /pk_[a-zA-Z0-9]{24,}/g, // Stripe public keys
            /AIza[0-9A-Za-z_-]{35}/g, // Google API keys
            /ghp_[a-zA-Z0-9]{36}/g, // GitHub personal access tokens
            /xoxb-[0-9]{13}-[0-9]{13}-[a-zA-Z0-9]{24}/g, // Slack bot tokens
          ];

          secretPatterns.forEach((pattern) => {
            const matches = content.match(pattern);
            if (matches) {
              this.issues.push({
                type: "critical",
                description: `Potential secret found in ${file}`,
                recommendation:
                  "Remove secrets from logs/documentation and rotate them immediately",
              });
            }
          });
        }
      }

      console.log("✅ Secrets exposure check completed");
    } catch (error) {
      console.log("⚠️ Secrets exposure check failed:", error);
    }
  }

  private async checkApiSecurity(): Promise<void> {
    console.log("🌐 Checking API security...");

    // Check for security headers in main application file
    const mainFile = "src/index.ts";
    if (existsSync(mainFile)) {
      const content = readFileSync(mainFile, "utf8");

      const securityHeaders = [
        "x-content-type-options",
        "x-frame-options",
        "x-xss-protection",
        "strict-transport-security",
      ];

      securityHeaders.forEach((header) => {
        if (!content.includes(header)) {
          this.issues.push({
            type: "medium",
            description: `Missing security header: ${header}`,
            recommendation: `Add ${header} header to API responses`,
          });
        }
      });

      // Check for CORS configuration
      if (!content.includes("cors")) {
        this.issues.push({
          type: "medium",
          description: "No CORS configuration found",
          recommendation: "Configure CORS properly for your API",
        });
      }
    }

    console.log("✅ API security check completed");
  }

  private async checkDatabaseSecurity(): Promise<void> {
    console.log("🗄️ Checking database security...");

    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      // Check for SSL usage
      if (!dbUrl.includes("sslmode=require") && !dbUrl.includes("ssl=true")) {
        this.issues.push({
          type: "high",
          description: "Database connection not using SSL/TLS",
          recommendation: "Enable SSL/TLS for database connections",
        });
      }

      // Check for connection string exposure
      if (dbUrl.includes("password=") || dbUrl.includes("secret=")) {
        this.issues.push({
          type: "critical",
          description: "Database connection string may contain credentials in plain text",
          recommendation:
            "Use environment variables and connection pooling for database credentials",
        });
      }
    }

    console.log("✅ Database security check completed");
  }

  private printSummary(): void {
    console.log("\n📊 Security Check Summary");
    console.log("=========================\n");

    const criticalIssues = this.issues.filter((i) => i.type === "critical");
    const highIssues = this.issues.filter((i) => i.type === "high");
    const mediumIssues = this.issues.filter((i) => i.type === "medium");
    const lowIssues = this.issues.filter((i) => i.type === "low");

    console.log(`🚨 Critical Issues: ${criticalIssues.length}`);
    console.log(`⚠️ High Issues: ${highIssues.length}`);
    console.log(`📋 Medium Issues: ${mediumIssues.length}`);
    console.log(`ℹ️ Low Issues: ${lowIssues.length}`);
    console.log(`Total Issues: ${this.issues.length}\n`);

    if (this.issues.length > 0) {
      console.log("🔍 Issues Found:");
      console.log("================");

      this.issues.forEach((issue, _index) => {
        const icon = {
          critical: "🚨",
          high: "⚠️",
          medium: "📋",
          low: "ℹ️",
        }[issue.type];

        console.log(`\n${icon} ${issue.description}`);
        console.log(`   💡 Recommendation: ${issue.recommendation}`);
      });
    } else {
      console.log("✅ No security issues found!");
    }
  }

  private setExitCode(): void {
    const criticalIssues = this.issues.filter((i) => i.type === "critical");
    const highIssues = this.issues.filter((i) => i.type === "high");

    if (criticalIssues.length > 0) {
      console.log("\n❌ CRITICAL security issues found. Please fix them before proceeding.");
      process.exit(1);
    } else if (highIssues.length > 0) {
      console.log(
        "\n⚠️ HIGH priority security issues found. Consider fixing them before production deployment."
      );
      process.exit(1);
    } else if (this.issues.length > 0) {
      console.log("\n✅ Security check completed with minor issues.");
      process.exit(0);
    } else {
      console.log("\n🎉 All security checks passed!");
      process.exit(0);
    }
  }
}

// Run security checks if this file is executed directly
if (import.meta.main) {
  const checker = new SecurityChecker();
  checker.runAllChecks().catch(console.error);
}

export { SecurityChecker };
