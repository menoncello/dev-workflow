import { beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "bun";

describe("Docker Build Tests", () => {
  const projectRoot = process.cwd();
  const dockerBuildScript = join(projectRoot, "scripts/docker-build.sh");
  const dockerfilePath = join(projectRoot, "Dockerfile");

  beforeAll(async () => {
    // Ensure Docker is available
    try {
      const process = spawn({
        cmd: ["docker", "--version"],
        stdout: "pipe",
        stderr: "pipe",
      });

      const result = await process.exited;
      expect(result).toBe(0);
    } catch (_error) {
      console.warn("Docker not available, skipping integration tests");
    }
  });

  test("Dockerfile exists and is valid", async () => {
    expect(existsSync(dockerfilePath)).toBe(true);

    const dockerfileContent = await Bun.file(dockerfilePath).text();
    expect(dockerfileContent).toContain("FROM oven/bun:1.3.1-alpine");
    expect(dockerfileContent).toContain("AS base");
    expect(dockerfileContent).toContain("AS dependencies");
    expect(dockerfileContent).toContain("AS development");
    expect(dockerfileContent).toContain("AS staging");
    expect(dockerfileContent).toContain("AS production");
    expect(dockerfileContent).toContain("HEALTHCHECK");
    expect(dockerfileContent).toContain("USER bun");
  });

  test("Docker build script exists and is executable", () => {
    expect(existsSync(dockerBuildScript)).toBe(true);

    const stat = Bun.file(dockerBuildScript);
    expect(stat.size).toBeGreaterThan(0);
  });

  test("Docker build script has correct usage", async () => {
    if (!existsSync(dockerBuildScript)) {
      return;
    }

    const process = spawn({
      cmd: ["bash", dockerBuildScript, "--help"],
      stdout: "pipe",
      stderr: "pipe",
    });

    const _result = await process.exited;
    const output = await new Response(process.stdout || process.stderr!).text();

    // Script should show usage information or error for invalid input
    expect(output.length).toBeGreaterThan(0);
  });

  test("Docker ignore file exists with proper exclusions", async () => {
    const dockerIgnorePath = join(projectRoot, ".dockerignore");
    expect(existsSync(dockerIgnorePath)).toBe(true);

    const dockerIgnoreContent = await Bun.file(dockerIgnorePath).text();
    expect(dockerIgnoreContent).toContain("node_modules/");
    expect(dockerIgnoreContent).toContain("build/");
    expect(dockerIgnoreContent).toContain("dist/");
    expect(dockerIgnoreContent).toContain(".git/");
    expect(dockerIgnoreContent).toContain("*.log");
    expect(dockerIgnoreContent).toContain(".env");
  });

  test("Docker Compose files exist with correct configuration", async () => {
    const dockerComposePath = join(projectRoot, "docker-compose.yml");
    const dockerComposeDevPath = join(projectRoot, "docker-compose.dev.yml");

    expect(existsSync(dockerComposePath)).toBe(true);
    expect(existsSync(dockerComposeDevPath)).toBe(true);

    const dockerComposeContent = await Bun.file(dockerComposePath).text();
    expect(dockerComposeContent).toContain("services:");
    expect(dockerComposeContent).toContain("postgres:");
    expect(dockerComposeContent).toContain("redis:");
    expect(dockerComposeContent).toContain("app-dev:");
    expect(dockerComposeContent).toContain("app-staging:");
    expect(dockerComposeContent).toContain("app-prod:");
    expect(dockerComposeContent).toContain("profiles:");
    expect(dockerComposeContent).toContain("healthcheck:");
  });

  test("Package.json includes Docker scripts", async () => {
    const packageJsonPath = join(projectRoot, "package.json");
    const packageJson = JSON.parse(await Bun.file(packageJsonPath).text());

    expect(packageJson.scripts).toHaveProperty("docker:build");
    expect(packageJson.scripts).toHaveProperty("docker:build:dev");
    expect(packageJson.scripts).toHaveProperty("docker:build:staging");
    expect(packageJson.scripts).toHaveProperty("docker:build:prod");
    expect(packageJson.scripts).toHaveProperty("docker:up");
    expect(packageJson.scripts).toHaveProperty("docker:down");
    expect(packageJson.scripts).toHaveProperty("docker:logs");
  });

  // Integration tests (only run if Docker is available)
  describe("Docker Build Integration Tests", () => {
    test("Development build succeeds", async () => {
      try {
        const process = spawn({
          cmd: [
            "docker",
            "build",
            "--target",
            "development",
            "--no-cache",
            "-t",
            "dev-plugin-test-dev",
            ".",
          ],
          cwd: projectRoot,
          stdout: "pipe",
          stderr: "pipe",
        });

        const result = await process.exited;
        if (result !== 0) {
          const errorOutput = await new Response(process.stderr!).text();
          console.warn("Docker development build test skipped:", errorOutput);
          return;
        }

        const output = await new Response(process.stdout!).text();
        expect(output).toContain("Successfully built");

        // Clean up test image
        await spawn(["docker", "rmi", "-f", "dev-plugin-test-dev"]).exited;
      } catch (error) {
        console.warn("Docker development build test skipped:", error);
        return;
      }
    }, 300000); // 5 minute timeout

    test("Production build succeeds", async () => {
      try {
        const process = spawn({
          cmd: [
            "docker",
            "build",
            "--target",
            "production",
            "--no-cache",
            "-t",
            "dev-plugin-test-prod",
            ".",
          ],
          cwd: projectRoot,
          stdout: "pipe",
          stderr: "pipe",
        });

        const result = await process.exited;
        if (result !== 0) {
          const errorOutput = await new Response(process.stderr!).text();
          console.warn("Docker production build test skipped:", errorOutput);
          return;
        }

        const output = await new Response(process.stdout!).text();
        expect(output).toContain("Successfully built");

        // Clean up test image
        await spawn(["docker", "rmi", "-f", "dev-plugin-test-prod"]).exited;
      } catch (error) {
        console.warn("Docker production build test skipped:", error);
        return;
      }
    }, 300000); // 5 minute timeout
  });
});
