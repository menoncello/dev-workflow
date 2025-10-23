#!/usr/bin/env bun
/**
 * Test infrastructure setup script
 * Ensures all build artifacts exist for tests
 */

import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const BUILD_DIRS = ["build/dev", "build/staging", "build/prod"];

async function ensureBuildDirectories() {
  console.log("🔧 Setting up test infrastructure...");

  for (const dir of BUILD_DIRS) {
    try {
      await fs.access(dir);
      console.log(`✅ Build directory exists: ${dir}`);
    } catch {
      console.log(`❌ Build directory missing: ${dir}`);
      throw new Error(`Missing build directory: ${dir}`);
    }
  }
}

async function verifyBuildArtifacts() {
  console.log("🔍 Verifying build artifacts...");

  for (const dir of BUILD_DIRS) {
    const indexJs = path.join(dir, "src", "index.js");
    try {
      await fs.access(indexJs);
      const stats = await fs.stat(indexJs);
      console.log(`✅ Build artifact exists: ${indexJs} (${Math.round(stats.size / 1024)}KB)`);
    } catch {
      console.log(`❌ Build artifact missing: ${indexJs}`);
      throw new Error(`Missing build artifact: ${indexJs}`);
    }
  }
}

async function setupTestEnvironment() {
  try {
    await ensureBuildDirectories();
    await verifyBuildArtifacts();
    console.log("✅ Test infrastructure is ready");
  } catch (_error) {
    console.log("🔨 Rebuilding missing artifacts...");

    // Build missing environments
    if (!(await fs.access("build/dev").catch(() => false))) {
      console.log("Building development...");
      execSync("bun run build:dev", { stdio: "inherit" });
    }

    if (!(await fs.access("build/staging").catch(() => false))) {
      console.log("Building staging...");
      execSync("bun run build:staging", { stdio: "inherit" });
    }

    if (!(await fs.access("build/prod").catch(() => false))) {
      console.log("Building production...");
      execSync("bun run build:prod", { stdio: "inherit" });
    }

    // Verify again
    await verifyBuildArtifacts();
    console.log("✅ Test infrastructure is ready after rebuild");
  }
}

// Run if called directly
if (import.meta.main) {
  setupTestEnvironment().catch(console.error);
}

export { setupTestEnvironment };
