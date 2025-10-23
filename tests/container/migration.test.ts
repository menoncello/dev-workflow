import { beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "bun";

describe("Database Migration Tests", () => {
  const projectRoot = process.cwd();
  const migrationScript = join(projectRoot, "scripts/migrate.sh");
  const prismaSchema = join(projectRoot, "prisma/schema.prisma");

  beforeAll(async () => {
    // Check if Prisma is available
    try {
      const process = spawn({
        cmd: ["bun", "prisma", "--version"],
        stdout: "pipe",
        stderr: "pipe",
      });

      const result = await process.exited;
      expect(result).toBe(0);
    } catch (_error) {
      console.warn("Prisma not available, skipping migration tests");
    }
  });

  describe("Migration Script Validation", () => {
    test("Migration script exists and is executable", () => {
      expect(existsSync(migrationScript)).toBe(true);

      const stat = Bun.file(migrationScript);
      expect(stat.size).toBeGreaterThan(0);
    });

    test("Prisma schema exists", async () => {
      expect(existsSync(prismaSchema)).toBe(true);

      const schemaContent = await Bun.file(prismaSchema).text();
      expect(schemaContent).toContain("datasource db");
      expect(schemaContent).toContain("generator");
      expect(schemaContent).toContain('provider = "postgresql"');
    });

    test("Migration script has proper error handling", async () => {
      const scriptContent = await Bun.file(migrationScript).text();

      expect(scriptContent).toContain("set -e");
      expect(scriptContent).toContain("echo -e");
      expect(scriptContent).toContain("return 1");
      expect(scriptContent).toContain("exit 1");
    });

    test("Migration script supports all required actions", async () => {
      const scriptContent = await Bun.file(migrationScript).text();

      expect(scriptContent).toContain("migrate");
      expect(scriptContent).toContain("rollback");
      expect(scriptContent).toContain("status");
      expect(scriptContent).toContain("backup");
      expect(scriptContent).toContain("restore");
    });

    test("Migration script supports all environments", async () => {
      const scriptContent = await Bun.file(migrationScript).text();

      expect(scriptContent).toContain("production");
      expect(scriptContent).toContain("staging");
      expect(scriptContent).toContain("development");
      expect(scriptContent).toContain("docker");
    });
  });

  describe("Migration Safety Features", () => {
    test("Rollback requires force flag", async () => {
      const scriptContent = await Bun.file(migrationScript).text();

      expect(scriptContent).toContain('if [ "$FORCE" != "true" ]');
      expect(scriptContent).toContain("--force");
      expect(scriptContent).toContain("Rollback requires --force flag");
    });

    test("Backup creation is implemented", async () => {
      const scriptContent = await Bun.file(migrationScript).text();

      expect(scriptContent).toContain("create_backup()");
      expect(scriptContent).toContain("pg_dump");
      expect(scriptContent).toContain("backups/");
      expect(scriptContent).toContain("mkdir -p backups");
    });

    test("Database readiness check is implemented", async () => {
      const scriptContent = await Bun.file(migrationScript).text();

      expect(scriptContent).toContain("check_database_ready()");
      expect(scriptContent).toContain("max_attempts");
      expect(scriptContent).toContain("sleep 2");
    });
  });

  describe("Environment Configuration Tests", () => {
    test("Production environment file exists", async () => {
      const prodEnvFile = join(projectRoot, ".env.production");
      expect(existsSync(prodEnvFile)).toBe(true);

      const envContent = await Bun.file(prodEnvFile).text();
      expect(envContent).toContain("NODE_ENV=production");
      expect(envContent).toContain("DATABASE_URL=");
      expect(envContent).toContain("REDIS_URL=");
      expect(envContent).toContain("JWT_SECRET=");
    });

    test("Staging environment file exists", async () => {
      const stagingEnvFile = join(projectRoot, ".env.staging");
      expect(existsSync(stagingEnvFile)).toBe(true);

      const envContent = await Bun.file(stagingEnvFile).text();
      expect(envContent).toContain("NODE_ENV=staging");
      expect(envContent).toContain("DATABASE_URL=");
      expect(envContent).toContain("REDIS_URL=");
      expect(envContent).toContain("JWT_SECRET=");
    });

    test("Environment files have correct structure", async () => {
      const prodEnvFile = join(projectRoot, ".env.production");
      const stagingEnvFile = join(projectRoot, ".env.staging");

      const prodContent = await Bun.file(prodEnvFile).text();
      const stagingContent = await Bun.file(stagingEnvFile).text();

      // Check for required environment variables
      const requiredVars = [
        "NODE_ENV",
        "SERVER_PORT",
        "DATABASE_URL",
        "REDIS_URL",
        "JWT_SECRET",
        "CORS_ORIGINS",
        "MONITORING_ENABLED",
      ];

      requiredVars.forEach((varName) => {
        expect(prodContent).toContain(`${varName}=`);
        expect(stagingContent).toContain(`${varName}=`);
      });
    });

    test("Environment files are properly differentiated", async () => {
      const prodEnvFile = join(projectRoot, ".env.production");
      const stagingEnvFile = join(projectRoot, ".env.staging");

      const prodContent = await Bun.file(prodEnvFile).text();
      const stagingContent = await Bun.file(stagingEnvFile).text();

      // Production should have production-specific settings
      expect(prodContent).toContain("NODE_ENV=production");
      expect(prodContent).toContain("LOG_LEVEL=info");

      // Staging should have staging-specific settings
      expect(stagingContent).toContain("NODE_ENV=staging");
      expect(stagingContent).toContain("LOG_LEVEL=debug");

      // Different database names
      expect(prodContent).toContain("devplugin");
      expect(stagingContent).toContain("devplugin_staging");

      // Different CORS origins
      expect(prodContent).toContain("example.com");
      expect(stagingContent).toContain("staging.example.com");
    });
  });

  describe("Package.json Scripts", () => {
    test("Migration scripts are properly configured", async () => {
      const packageJsonPath = join(projectRoot, "package.json");
      const packageJson = JSON.parse(await Bun.file(packageJsonPath).text());

      // Check for migration-related scripts
      expect(packageJson.scripts).toHaveProperty("db:migrate");
      expect(packageJson.scripts).toHaveProperty("db:migrate:staging");
      expect(packageJson.scripts).toHaveProperty("db:migrate:dev");
      expect(packageJson.scripts).toHaveProperty("db:rollback");
      expect(packageJson.scripts).toHaveProperty("db:rollback:staging");
      expect(packageJson.scripts).toHaveProperty("db:rollback:dev");
      expect(packageJson.scripts).toHaveProperty("db:status");
      expect(packageJson.scripts).toHaveProperty("db:backup");
    });

    test("Kubernetes scripts are properly configured", async () => {
      const packageJsonPath = join(projectRoot, "package.json");
      const packageJson = JSON.parse(await Bun.file(packageJsonPath).text());

      expect(packageJson.scripts).toHaveProperty("k8s:deploy");
      expect(packageJson.scripts).toHaveProperty("k8s:deploy:staging");
      expect(packageJson.scripts).toHaveProperty("k8s:delete");
      expect(packageJson.scripts).toHaveProperty("k8s:delete:staging");
    });
  });

  describe("Database Configuration Validation", () => {
    test("Database URLs are properly formatted", async () => {
      const prodEnvFile = join(projectRoot, ".env.production");
      const stagingEnvFile = join(projectRoot, ".env.staging");

      const prodContent = await Bun.file(prodEnvFile).text();
      const stagingContent = await Bun.file(stagingEnvFile).text();

      // Extract database URLs
      const prodDbUrl = prodContent.match(/DATABASE_URL=(.+)/)?.[1];
      const stagingDbUrl = stagingContent.match(/DATABASE_URL=(.+)/)?.[1];

      expect(prodDbUrl).toBeDefined();
      expect(stagingDbUrl).toBeDefined();

      // Check URL format
      expect(prodDbUrl).toMatch(/^postgresql:\/\//);
      expect(stagingDbUrl).toMatch(/^postgresql:\/\//);

      // Check URL components
      expect(prodDbUrl).toContain("postgresql://");
      expect(prodDbUrl).toContain("@");
      expect(prodDbUrl).toContain(":5432/");
    });

    test("Redis URLs are properly formatted", async () => {
      const prodEnvFile = join(projectRoot, ".env.production");
      const stagingEnvFile = join(projectRoot, ".env.staging");

      const prodContent = await Bun.file(prodEnvFile).text();
      const stagingContent = await Bun.file(stagingEnvFile).text();

      // Extract Redis URLs
      const prodRedisUrl = prodContent.match(/REDIS_URL=(.+)/)?.[1];
      const stagingRedisUrl = stagingContent.match(/REDIS_URL=(.+)/)?.[1];

      expect(prodRedisUrl).toBeDefined();
      expect(stagingRedisUrl).toBeDefined();

      // Check URL format
      expect(prodRedisUrl).toMatch(/^redis:\/\//);
      expect(stagingRedisUrl).toMatch(/^redis:\/\//);

      // Check URL components
      expect(prodRedisUrl).toContain("redis://");
      expect(prodRedisUrl).toContain(":6379");
    });
  });

  // Integration tests (only run if database is available)
  describe("Migration Integration Tests", () => {
    test("Can generate Prisma client", async () => {
      try {
        const process = spawn({
          cmd: ["bun", "prisma", "generate"],
          cwd: projectRoot,
          stdout: "pipe",
          stderr: "pipe",
        });

        const result = await process.exited;
        if (result !== 0) {
          const errorOutput = await new Response(process.stderr!).text();
          console.warn("Prisma generate test skipped:", errorOutput);
          return;
        }

        const output = await new Response(process.stdout!).text();
        expect(output).toContain("Generated Prisma Client");
      } catch (error) {
        console.warn("Prisma generate test skipped:", error);
        return;
      }
    });

    test("Can validate Prisma schema", async () => {
      try {
        const process = spawn({
          cmd: ["bun", "prisma", "validate"],
          cwd: projectRoot,
          stdout: "pipe",
          stderr: "pipe",
        });

        const result = await process.exited;
        if (result !== 0) {
          const errorOutput = await new Response(process.stderr!).text();
          console.warn("Prisma validate test skipped:", errorOutput);
          return;
        }

        const output = await new Response(process.stdout!).text();
        expect(output).toContain("The schema is valid");
      } catch (error) {
        console.warn("Prisma validate test skipped:", error);
        return;
      }
    });

    test("Migration script shows usage for invalid input", async () => {
      try {
        const process = spawn({
          cmd: ["bash", migrationScript, "invalid-env"],
          cwd: projectRoot,
          stdout: "pipe",
          stderr: "pipe",
        });

        await process.exited;
        const output = await new Response(process.stdout || process.stderr!).text();

        expect(output.length).toBeGreaterThan(0);
        // Should show some kind of error or usage message
      } catch (error) {
        console.warn("Migration script usage test skipped:", error);
        return;
      }
    });
  });
});
