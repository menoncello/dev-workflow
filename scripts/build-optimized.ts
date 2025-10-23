#!/usr/bin/env bun
/**
 * Optimized build script with enhanced configuration
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { build } from "bun";
import { buildConfigs } from "../src/config/build";

interface BuildResult {
  success: boolean;
  size: number;
  errors: string[];
  outputPath: string;
}

async function buildForEnvironment(environment: string): Promise<BuildResult> {
  console.log(`🔨 Building for ${environment.toUpperCase()}...`);

  const config = buildConfigs[environment];
  if (!config) {
    throw new Error(`Unknown build environment: ${environment}`);
  }

  const startTime = Date.now();
  const _errors: string[] = [];

  try {
    // Ensure output directory exists
    await fs.mkdir(config.outdir, { recursive: true });

    // Enhanced build configuration for staging/production optimization
    const buildConfig = {
      entrypoints: ["src/index.ts"],
      outdir: config.outdir,
      target: config.target || "bun",
      format: config.format || "esm",
      minify: config.minify || false,
      sourcemap: config.sourcemap || false,
      external: config.external || [],
      define: {
        ...config.define,
        // Additional optimizations
        "process.env.NODE_ENV": JSON.stringify(environment),
        "globalThis.ENVIRONMENT": JSON.stringify(environment),
      },
      splitting: config.splitting || false,
      treeShaking: config.treeShaking || false,
      drop: config.drop || [],
      pure: config.pure || [],
      deadCodeElimination: config.deadCodeElimination || false,
      plugins: config.plugins || [],
    };

    // Add aggressive optimizations for staging and production
    if (environment === "staging" || environment === "production") {
      // Externalize ALL framework dependencies for maximum size reduction
      buildConfig.external = [
        ...buildConfig.external,
        // Framework dependencies
        "@elysiajs/cors",
        "@elysiajs/swagger",
        "@elysiajs/server-timing",
        "@elysiajs/jwt",
        "elysia",
        // Database and utilities
        "@prisma/client",
        "prisma",
        "redis",
        "ws",
        "dayjs",
        "cryptr",
        "ajv",
        "ajv-formats",
        "dotenv",
        // Node modules
        "node:*",
      ];

      // Enable more aggressive optimizations
      buildConfig.treeShaking = true;
      buildConfig.splitting = true;
      buildConfig.deadCodeElimination = true;

      if (environment === "production") {
        // Ultra-aggressive production optimizations
        buildConfig.minify = true;

        buildConfig.drop = [
          ...(buildConfig.drop || []),
          // Remove ALL console methods
          "console.log",
          "console.info",
          "console.warn",
          "console.debug",
          "console.error",
          "console.time",
          "console.timeEnd",
          "console.trace",
          "console.assert",
          "console.table",
          "console.group",
          "console.groupEnd",
          "console.groupCollapsed",
        ];

        buildConfig.pure = [
          // Pure functions that can be removed if unused
          "process.env.NODE_ENV",
          "process.env.DEBUG",
        ];

        // Additional production defines
        buildConfig.define = {
          ...buildConfig.define,
          "process.env.NODE_ENV": '"production"',
        };
      }
    }

    // Ultra-aggressive production optimization
    if (environment === "production") {
      // Override entrypoint to minimize initial bundle
      buildConfig.entrypoints = ["src/index.ts"];

      // Force maximum splitting
      buildConfig.splitting = true;

      // Ultra-aggressive minification
      buildConfig.minify = true;

      // Remove all development code
      buildConfig.define = {
        ...buildConfig.define,
        "process.env.NODE_ENV": '"production"',
      };
    }

    // Build with Bun
    const _result = await build(buildConfig);

    const buildTime = Date.now() - startTime;
    console.log(`✅ ${environment.toUpperCase()} build completed in ${buildTime}ms`);

    // Calculate bundle size
    const outputPath = path.join(config.outdir, "src", "index.js");
    let size = 0;

    try {
      const stats = await fs.stat(outputPath);
      size = stats.size;
    } catch {
      // Try alternative path
      try {
        const altPath = path.join(config.outdir, "index.js");
        const stats = await fs.stat(altPath);
        size = stats.size;
      } catch {
        console.warn(`⚠️ Could not determine output bundle size for ${environment}`);
      }
    }

    return {
      success: true,
      size,
      errors: [],
      outputPath,
    };
  } catch (error) {
    console.error(`❌ ${environment.toUpperCase()} build failed:`, error);
    return {
      success: false,
      size: 0,
      errors: [error instanceof Error ? error.message : String(error)],
      outputPath: config.outdir,
    };
  }
}

async function buildAll() {
  console.log("🚀 Starting optimized build process");
  console.log("====================================\n");

  const environments = ["development", "staging", "production"] as const;
  const results: Record<string, BuildResult> = {};

  for (const env of environments) {
    results[env] = await buildForEnvironment(env);
  }

  // Summary
  console.log("\n📊 Build Summary");
  console.log("==================");

  for (const [env, result] of Object.entries(results)) {
    const status = result.success ? "✅" : "❌";
    const sizeStr = result.size > 0 ? `${(result.size / 1024 / 1024).toFixed(2)}MB` : "Unknown";
    console.log(`${status} ${env.toUpperCase()}: ${sizeStr}`);

    if (result.errors.length > 0) {
      result.errors.forEach((error) => console.log(`   Error: ${error}`));
    }
  }

  // Performance analysis
  console.log("\n📈 Performance Analysis");
  console.log("========================");

  if (results.production.size > 0) {
    const prodSizeMB = results.production.size / 1024 / 1024;
    if (prodSizeMB < 1) {
      console.log(`✅ Production bundle: EXCELLENT (${prodSizeMB.toFixed(2)}MB < 1MB)`);
    } else {
      console.log(`⚠️ Production bundle: NEEDS OPTIMIZATION (${prodSizeMB.toFixed(2)}MB > 1MB)`);
    }
  }

  if (results.staging.size > 0) {
    const stagingSizeMB = results.staging.size / 1024 / 1024;
    if (stagingSizeMB < 2) {
      console.log(`✅ Staging bundle: GOOD (${stagingSizeMB.toFixed(2)}MB < 2MB)`);
    } else {
      console.log(`⚠️ Staging bundle: NEEDS OPTIMIZATION (${stagingSizeMB.toFixed(2)}MB > 2MB)`);
    }
  }

  // Exit with appropriate code
  const allSuccessful = Object.values(results).every((result) => result.success);
  if (!allSuccessful) {
    console.log("\n❌ Some builds failed");
    process.exit(1);
  } else {
    console.log("\n✅ All builds completed successfully");
  }
}

// Run build if called directly
if (import.meta.main) {
  const environment = process.argv[2];

  if (environment && ["development", "staging", "production"].includes(environment)) {
    const result = await buildForEnvironment(environment);
    if (!result.success) {
      process.exit(1);
    }
  } else {
    await buildAll();
  }
}

export { buildForEnvironment };
