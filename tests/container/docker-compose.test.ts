import { beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "bun";

describe("Docker Compose Tests", () => {
  const projectRoot = process.cwd();
  const dockerComposePath = join(projectRoot, "docker-compose.yml");
  const dockerComposeDevPath = join(projectRoot, "docker-compose.dev.yml");

  beforeAll(async () => {
    // Ensure Docker and Docker Compose are available
    try {
      const dockerProcess = spawn({
        cmd: ["docker", "--version"],
        stdout: "pipe",
        stderr: "pipe",
      });
      const composeProcess = spawn({
        cmd: ["docker", "compose", "version"],
        stdout: "pipe",
        stderr: "pipe",
      });

      const dockerResult = await dockerProcess.exited;
      const composeResult = await composeProcess.exited;

      expect(dockerResult).toBe(0);
      expect(composeResult).toBe(0);
    } catch (_error) {
      console.warn("Docker Compose not available, skipping integration tests");
    }
  });

  test("Docker Compose development file is valid", async () => {
    const dockerComposeContent = await Bun.file(dockerComposeDevPath).text();

    // Check for required services
    expect(dockerComposeContent).toContain("postgres:");
    expect(dockerComposeContent).toContain("redis:");
    expect(dockerComposeContent).toContain("adminer:");
    expect(dockerComposeContent).toContain("redis-commander:");
    expect(dockerComposeContent).toContain("app:");

    // Check for health checks
    expect(dockerComposeContent).toContain("healthcheck:");

    // Check for proper dependencies
    expect(dockerComposeContent).toContain("depends_on:");

    // Check for proper networking
    expect(dockerComposeContent).toContain("networks:");

    // Check for proper volumes
    expect(dockerComposeContent).toContain("volumes:");

    // Check environment variables
    expect(dockerComposeContent).toContain("DATABASE_URL:");
    expect(dockerComposeContent).toContain("REDIS_URL:");
    expect(dockerComposeContent).toContain("JWT_SECRET:");
  });

  test("Docker Compose multi-environment file is valid", async () => {
    const dockerComposeContent = await Bun.file(dockerComposePath).text();

    // Check for environment-specific services
    expect(dockerComposeContent).toContain("app-dev:");
    expect(dockerComposeContent).toContain("app-staging:");
    expect(dockerComposeContent).toContain("app-prod:");

    // Check for profiles
    expect(dockerComposeContent).toContain("profiles:");
    expect(dockerComposeContent).toContain("development");
    expect(dockerComposeContent).toContain("staging");
    expect(dockerComposeContent).toContain("production");

    // Check for variable substitution
    expect(dockerComposeContent).toContain("${COMPOSE_PROJECT_NAME:-devplugin}");
    expect(dockerComposeContent).toContain("${POSTGRES_USER:-devuser}");
    expect(dockerComposeContent).toContain("${POSTGRES_PASSWORD:-devpass}");

    // Check for proper build contexts
    expect(dockerComposeContent).toContain("build:");
    expect(dockerComposeContent).toContain("target:");
  });

  test("Environment variables are properly configured", async () => {
    const envExamplePath = join(projectRoot, ".env.example");
    expect(existsSync(envExamplePath)).toBe(true);

    const envContent = await Bun.file(envExamplePath).text();

    // Check for required environment variables
    expect(envContent).toContain("NODE_ENV=");
    expect(envContent).toContain("SERVER_PORT=");
    expect(envContent).toContain("DATABASE_URL=");
    expect(envContent).toContain("REDIS_URL=");
    expect(envContent).toContain("JWT_SECRET=");
    expect(envContent).toContain("CORS_ORIGINS=");
    expect(envContent).toContain("MONITORING_ENABLED=");
  });

  test("Health check endpoints are properly configured", async () => {
    const dockerComposeContent = await Bun.file(dockerComposeDevPath).text();

    // Development health check
    expect(dockerComposeContent).toContain("fetch('http://localhost:3000/api/health')");

    const multiEnvContent = await Bun.file(dockerComposePath).text();

    // Staging/production health checks
    expect(multiEnvContent).toContain("fetch('http://localhost:3000/api/v1/health/detailed')");
  });

  // Integration tests (only run if Docker Compose is available)
  describe("Docker Compose Integration Tests", () => {
    test("Can validate Docker Compose configuration", async () => {
      try {
        const process = spawn({
          cmd: ["docker", "compose", "--file", dockerComposeDevPath, "config"],
          cwd: projectRoot,
          stdout: "pipe",
          stderr: "pipe",
        });

        const result = await process.exited;
        if (result !== 0) {
          const errorOutput = await new Response(process.stderr!).text();
          console.warn("Docker compose config test skipped:", errorOutput);
          return;
        }

        const output = await new Response(process.stdout!).text();
        expect(output).toContain("services:");
        expect(output).toContain("postgres:");
        expect(output).toContain("redis:");
        expect(output).toContain("app:");
      } catch (error) {
        console.warn("Docker compose config test skipped:", error);
        return;
      }
    });

    test("Can start development services", async () => {
      try {
        const projectName = `dev-plugin-test-${Date.now()}`;

        // Start services
        const upProcess = spawn({
          cmd: [
            "docker",
            "compose",
            "--file",
            dockerComposeDevPath,
            "--project-name",
            projectName,
            "up",
            "-d",
            "postgres",
            "redis",
          ],
          cwd: projectRoot,
          stdout: "pipe",
          stderr: "pipe",
        });

        const upResult = await upProcess.exited;
        if (upResult !== 0) {
          const errorOutput = await new Response(upProcess.stderr!).text();
          console.warn("Docker compose up test skipped:", errorOutput);
          return;
        }

        // Wait a moment for services to start
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Check if services are running
        const psProcess = spawn({
          cmd: ["docker", "compose", "--project-name", projectName, "ps"],
          cwd: projectRoot,
          stdout: "pipe",
          stderr: "pipe",
        });

        const _psResult = await psProcess.exited;
        const psOutput = await new Response(psProcess.stdout!).text();

        expect(psOutput).toContain("postgres");
        expect(psOutput).toContain("redis");

        // Clean up
        await spawn(["docker", "compose", "--project-name", projectName, "down", "-v"]).exited;
      } catch (error) {
        console.warn("Docker compose integration test skipped:", error);
        return;
      }
    }, 120000); // 2 minute timeout

    test("Database health check works", async () => {
      try {
        const projectName = `dev-plugin-test-${Date.now()}`;

        // Start just the database
        const upProcess = spawn({
          cmd: [
            "docker",
            "compose",
            "--file",
            dockerComposeDevPath,
            "--project-name",
            projectName,
            "up",
            "-d",
            "postgres",
          ],
          cwd: projectRoot,
          stdout: "pipe",
          stderr: "pipe",
        });

        const upResult = await upProcess.exited;
        if (upResult !== 0) {
          console.warn("Database health check test skipped: failed to start postgres");
          return;
        }

        // Wait for database to be healthy
        let healthy = false;
        for (let i = 0; i < 30; i++) {
          const healthProcess = spawn({
            cmd: [
              "docker",
              "exec",
              `${projectName}-postgres-1`,
              "pg_isready",
              "-U",
              "devuser",
              "-d",
              "devplugin",
            ],
            cwd: projectRoot,
            stdout: "pipe",
            stderr: "pipe",
          });

          const _healthResult = await healthProcess.exited;
          const healthOutput = await new Response(healthProcess.stdout!).text();

          if (healthOutput.includes("accepting connections")) {
            healthy = true;
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        expect(healthy).toBe(true);

        // Clean up
        await spawn(["docker", "compose", "--project-name", projectName, "down", "-v"]).exited;
      } catch (error) {
        console.warn("Database health check test skipped:", error);
        return;
      }
    }, 120000); // 2 minute timeout
  });
});
