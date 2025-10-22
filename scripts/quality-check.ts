#!/usr/bin/env bun
/**
 * Automated code quality checker for dev-plugin project
 * Provides comprehensive analysis of codebase quality metrics
 */

import { promises as fs } from "node:fs";
import path from "path";
import { execSync } from "child_process";
import type { BuildResult } from "../src/types/build";
import { buildForEnvironment, analyzeBuild } from "../src/utils/build";
import { logger } from "../src/utils/logger";

interface QualityMetrics {
	typescript: {
		compilationErrors: number;
		typeErrors: number;
		warnings: number;
	};
	linting: {
		errors: number;
		warnings: number;
		suggestions: number;
	};
	build: {
		developmentBuildTime: number;
		productionBuildTime: number;
		buildSizeReduction: number;
		buildErrors: string[];
	};
	tests: {
		totalTests: number;
		passingTests: number;
		failingTests: number;
		coverage: {
			lines: number;
			functions: number;
			branches: number;
			statements: number;
		} | null;
	};
	security: {
		vulnerabilities: number;
		dependenciesOutdated: number;
		secretsFound: boolean;
	};
	performance: {
		largeFiles: Array<{ path: string; size: number }>;
		duplicatedCode: number;
		complexityIssues: number;
	};
}

interface QualityReport {
	overall: {
		score: number; // 0-100
		grade: "A" | "B" | "C" | "D" | "F";
		status: "excellent" | "good" | "fair" | "poor" | "critical";
	};
	metrics: QualityMetrics;
	recommendations: string[];
	summary: string;
}

class QualityChecker {
	private projectRoot: string;
	private metrics: QualityMetrics;

	constructor(projectRoot: string = process.cwd()) {
		this.projectRoot = projectRoot;
		this.metrics = this.initializeMetrics();
	}

	private initializeMetrics(): QualityMetrics {
		return {
			typescript: { compilationErrors: 0, typeErrors: 0, warnings: 0 },
			linting: { errors: 0, warnings: 0, suggestions: 0 },
			build: {
				developmentBuildTime: 0,
				productionBuildTime: 0,
				buildSizeReduction: 0,
				buildErrors: [],
			},
			tests: { totalTests: 0, passingTests: 0, failingTests: 0, coverage: null },
			security: { vulnerabilities: 0, dependenciesOutdated: 0, secretsFound: false },
			performance: { largeFiles: [], duplicatedCode: 0, complexityIssues: 0 },
		};
	}

	async runFullCheck(): Promise<QualityReport> {
		console.log("🔍 Running comprehensive quality check...\n");

		await Promise.all([
			this.checkTypeScript(),
			this.checkLinting(),
			this.checkBuilds(),
			this.checkTests(),
			this.checkSecurity(),
			this.checkPerformance(),
		]);

		return this.generateReport();
	}

	private async checkTypeScript(): Promise<void> {
		console.log("📝 Checking TypeScript compilation...");

		try {
			const output = execSync("bun tsc --noEmit", {
				encoding: "utf8",
				cwd: this.projectRoot,
			});

			this.metrics.typescript.compilationErrors = 0;
			this.metrics.typescript.typeErrors = 0;
			console.log("✅ TypeScript compilation successful");
		} catch (error: any) {
			const output = error.stdout || error.stderr || "";
			const lines = output.split("\n");

			this.metrics.typescript.compilationErrors = lines.filter((line: string) =>
				line.includes("error TS")
			).length;
			this.metrics.typescript.typeErrors = lines.filter((line: string) =>
				line.includes("error TS")
			).length;

			if (this.metrics.typescript.compilationErrors > 0) {
				console.log(
					`❌ TypeScript errors found: ${this.metrics.typescript.compilationErrors}`
				);
			}
		}
	}

	private async checkLinting(): Promise<void> {
		console.log("🔧 Checking code linting...");

		try {
			const output = execSync("bunx biome lint --json", {
				encoding: "utf8",
				cwd: this.projectRoot,
			});

			const result = JSON.parse(output);
			if (result.diagnostics && Array.isArray(result.diagnostics)) {
				this.metrics.linting.errors = result.diagnostics.filter(
					(d: any) => d.severity === "error"
				).length;
				this.metrics.linting.warnings = result.diagnostics.filter(
					(d: any) => d.severity === "warning"
				).length;
				this.metrics.linting.suggestions = result.diagnostics.filter(
					(d: any) => d.severity === "info" || d.severity === "hint"
				).length;
			}

			console.log(
				`✅ Linting check complete: ${this.metrics.linting.errors} errors, ${this.metrics.linting.warnings} warnings`
			);
		} catch (error: any) {
			// Biome returns non-zero exit code when there are issues
			const output = error.stdout || "";
			try {
				const result = JSON.parse(output);
				if (result.diagnostics && Array.isArray(result.diagnostics)) {
					this.metrics.linting.errors = result.diagnostics.filter(
						(d: any) => d.severity === "error"
					).length;
					this.metrics.linting.warnings = result.diagnostics.filter(
						(d: any) => d.severity === "warning"
					).length;
					this.metrics.linting.suggestions = result.diagnostics.filter(
						(d: any) => d.severity === "info" || d.severity === "hint"
					).length;
				}
			} catch {
				// Fallback if JSON parsing fails
				this.metrics.linting.errors = 1;
			}

			console.log(
				`⚠️  Linting issues found: ${this.metrics.linting.errors} errors, ${this.metrics.linting.warnings} warnings`
			);
		}
	}

	private async checkBuilds(): Promise<void> {
		console.log("🏗️  Checking build process...");

		const startTime = Date.now();
		try {
			const devResult = await buildForEnvironment("development");
			this.metrics.build.developmentBuildTime = devResult.duration;

			const prodStartTime = Date.now();
			const prodResult = await buildForEnvironment("production");
			this.metrics.build.productionBuildTime = Date.now() - prodStartTime;

			if (devResult.success && prodResult.success) {
				this.metrics.build.buildSizeReduction = Math.round(
					((devResult.size - prodResult.size) / devResult.size) * 100
				);
				console.log(
					`✅ Build successful: ${this.metrics.build.buildSizeReduction}% size reduction`
				);
			} else {
				if (!devResult.success) {
					this.metrics.build.buildErrors.push("Development build failed");
				}
				if (!prodResult.success) {
					this.metrics.build.buildErrors.push("Production build failed");
				}
				console.log("❌ Build process had errors");
			}
		} catch (error) {
			this.metrics.build.buildErrors.push(error instanceof Error ? error.message : "Unknown build error");
			console.log("❌ Build process failed");
		}
	}

	private async checkTests(): Promise<void> {
		console.log("🧪 Running tests...");

		try {
			const output = execSync("bun test --reporter=json", {
				encoding: "utf8",
				cwd: this.projectRoot,
			});

			const result = JSON.parse(output);
			if (result.results && Array.isArray(result.results)) {
				for (const testFile of result.results) {
					if (testFile.status) {
						this.metrics.tests.totalTests += testFile.status.ok || 0;
						this.metrics.tests.passingTests += testFile.status.passed || 0;
						this.metrics.tests.failingTests += testFile.status.failed || 0;
					}
				}
			}

			// Try to get coverage if available
			try {
				const coverageOutput = execSync("bun test --coverage", {
					encoding: "utf8",
					cwd: this.projectRoot,
				});
				// Parse coverage output (simplified)
				console.log("✅ Coverage report generated");
			} catch {
				console.log("ℹ️  Coverage not available");
			}

			console.log(
				`✅ Tests complete: ${this.metrics.tests.passingTests}/${this.metrics.tests.totalTests} passing`
			);
		} catch (error: any) {
			const output = error.stdout || error.stderr || "";
			// Parse test output for basic metrics
			const passMatch = output.match(/(\d+) pass/);
			const failMatch = output.match(/(\d+) fail/);

			if (passMatch) {
				this.metrics.tests.passingTests = parseInt(passMatch[1]);
			}
			if (failMatch) {
				this.metrics.tests.failingTests = parseInt(failMatch[1]);
			}
			this.metrics.tests.totalTests =
				this.metrics.tests.passingTests + this.metrics.tests.failingTests;

			console.log(
				`⚠️  Tests had issues: ${this.metrics.tests.failingTests} failing tests`
			);
		}
	}

	private async checkSecurity(): Promise<void> {
		console.log("🔒 Checking security...");

		try {
			// Check for vulnerabilities using bun audit
			const auditOutput = execSync("bun audit", {
				encoding: "utf8",
				cwd: this.projectRoot,
			});

			// Parse audit output for vulnerabilities
			const vulnMatches = auditOutput.match(/(\d+) vulnerabilities?/);
			if (vulnMatches) {
				this.metrics.security.vulnerabilities = parseInt(vulnMatches[1]);
			}

			// Check for basic secrets patterns
			const srcFiles = await this.getSourceFiles();
			const secretPatterns = [
				/password\s*=\s*['"][^'\"]+['\"]/,
				/api_key\s*=\s*['"][^'\"]+['\"]/,
				/secret_key\s*=\s*['"][^'\"]+['\"]/,
			];

			for (const file of srcFiles) {
				const content = await fs.readFile(file, "utf8");
				for (const pattern of secretPatterns) {
					if (pattern.test(content)) {
						this.metrics.security.secretsFound = true;
						break;
					}
				}
				if (this.metrics.security.secretsFound) break;
			}

			console.log(
				`✅ Security check complete: ${this.metrics.security.vulnerabilities} vulnerabilities, secrets: ${this.metrics.security.secretsFound ? "found" : "none"}`
			);
		} catch (error) {
			console.log("⚠️  Security check had issues");
		}
	}

	private async checkPerformance(): Promise<void> {
		console.log("⚡ Checking performance metrics...");

		try {
			const srcFiles = await this.getSourceFiles();
			const MAX_FILE_SIZE = 100 * 1024; // 100KB

			for (const file of srcFiles) {
				const stat = await fs.stat(file);
				if (stat.isFile() && stat.size > MAX_FILE_SIZE) {
					this.metrics.performance.largeFiles.push({
						path: path.relative(this.projectRoot, file),
						size: stat.size,
					});
				}
			}

			console.log(
				`✅ Performance check complete: ${this.metrics.performance.largeFiles.length} large files found`
			);
		} catch (error) {
			console.log("⚠️  Performance check had issues");
		}
	}

	private async getSourceFiles(): Promise<string[]> {
		const srcDir = path.join(this.projectRoot, "src");
		const files: string[] = [];

		async function walkDir(dir: string): Promise<void> {
			const entries = await fs.readdir(dir, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					await walkDir(fullPath);
				} else if (entry.isFile() && entry.name.endsWith(".ts")) {
					files.push(fullPath);
				}
			}
		}

		try {
			await walkDir(srcDir);
		} catch {
			// Directory might not exist
		}

		return files;
	}

	private generateReport(): QualityReport {
		const score = this.calculateScore();
		const grade = this.calculateGrade(score);
		const status = this.calculateStatus(score);

		const recommendations = this.generateRecommendations();
		const summary = this.generateSummary(status, score);

		return {
			overall: { score, grade, status },
			metrics: this.metrics,
			recommendations,
			summary,
		};
	}

	private calculateScore(): number {
		let score = 100;

		// TypeScript issues
		score -= this.metrics.typescript.compilationErrors * 5;
		score -= this.metrics.typescript.typeErrors * 3;

		// Linting issues
		score -= this.metrics.linting.errors * 2;
		score -= this.metrics.linting.warnings * 0.5;

		// Build issues
		score -= this.metrics.build.buildErrors.length * 10;

		// Test issues
		if (this.metrics.tests.totalTests > 0) {
			const testPassRate = this.metrics.tests.passingTests / this.metrics.tests.totalTests;
			score -= (1 - testPassRate) * 20;
		}

		// Security issues
		score -= this.metrics.security.vulnerabilities * 5;
		if (this.metrics.security.secretsFound) score -= 15;

		// Performance issues
		score -= this.metrics.performance.largeFiles.length * 2;

		return Math.max(0, Math.min(100, Math.round(score)));
	}

	private calculateGrade(score: number): "A" | "B" | "C" | "D" | "F" {
		if (score >= 90) return "A";
		if (score >= 80) return "B";
		if (score >= 70) return "C";
		if (score >= 60) return "D";
		return "F";
	}

	private calculateStatus(score: number): "excellent" | "good" | "fair" | "poor" | "critical" {
		if (score >= 90) return "excellent";
		if (score >= 80) return "good";
		if (score >= 70) return "fair";
		if (score >= 60) return "poor";
		return "critical";
	}

	private generateRecommendations(): string[] {
		const recommendations: string[] = [];

		if (this.metrics.typescript.compilationErrors > 0) {
			recommendations.push("Fix TypeScript compilation errors");
		}

		if (this.metrics.linting.errors > 0) {
			recommendations.push("Address linting errors with 'bun run lint'");
		}

		if (this.metrics.build.buildErrors.length > 0) {
			recommendations.push("Fix build process errors");
		}

		if (this.metrics.tests.failingTests > 0) {
			recommendations.push("Fix failing tests");
		}

		if (this.metrics.security.vulnerabilities > 0) {
			recommendations.push("Update dependencies to fix security vulnerabilities");
		}

		if (this.metrics.security.secretsFound) {
			recommendations.push("Remove hardcoded secrets and use environment variables");
		}

		if (this.metrics.performance.largeFiles.length > 0) {
			recommendations.push("Consider splitting large files or using code splitting");
		}

		return recommendations;
	}

	private generateSummary(status: string, score: number): string {
		const statusEmoji = {
			excellent: "🏆",
			good: "✅",
			fair: "⚠️",
			poor: "❌",
			critical: "🚨",
		};

		const emoji = statusEmoji[status as keyof typeof statusEmoji];

		return `${emoji} Code Quality ${status.charAt(0).toUpperCase() + status.slice(1)} (Score: ${score}/100)`;
	}

	printReport(report: QualityReport): void {
		console.log("\n" + "=".repeat(60));
		console.log(report.summary);
		console.log("=".repeat(60));

		console.log("\n📊 Quality Metrics:");
		console.log(`  TypeScript: ${report.metrics.typescript.compilationErrors} errors`);
		console.log(`  Linting: ${report.metrics.linting.errors} errors, ${report.metrics.linting.warnings} warnings`);
		console.log(`  Build: ${report.metrics.build.buildErrors.length} errors, ${report.metrics.build.buildSizeReduction}% size reduction`);
		console.log(`  Tests: ${report.metrics.tests.passingTests}/${report.metrics.tests.totalTests} passing`);
		console.log(`  Security: ${report.metrics.security.vulnerabilities} vulnerabilities`);
		console.log(`  Performance: ${report.metrics.performance.largeFiles.length} large files`);

		if (report.recommendations.length > 0) {
			console.log("\n💡 Recommendations:");
			report.recommendations.forEach((rec, i) => {
				console.log(`  ${i + 1}. ${rec}`);
			});
		}

		const gradeColor = {
			A: "🟢",
			B: "🟡",
			C: "🟠",
			D: "🔴",
			F: "🚨",
		};

		console.log(`\nOverall Grade: ${gradeColor[report.overall.grade]} ${report.overall.grade}`);
	}
}

// CLI interface
async function main() {
	const args = process.argv.slice(2);
	const showDetails = args.includes("--verbose") || args.includes("-v");

	const checker = new QualityChecker();
	const report = await checker.runFullCheck();

	checker.printReport(report);

	// Exit with appropriate code based on quality score
	process.exit(report.overall.score >= 70 ? 0 : 1);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error("Quality check failed:", error);
		process.exit(1);
	});
}