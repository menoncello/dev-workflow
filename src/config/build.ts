/**
 * Build configuration for different environments
 */

import type { BuildConfig } from "../types/build";

// Common externals to reduce bundle size
const commonExternals = [
  "node_modules/*",
  "@prisma/client",
  "prisma",
  "redis",
  "ws",
  "dayjs",
  "cryptr",
  "ajv",
  "ajv-formats",
  "dotenv",
];

// Development-specific externals (for faster builds)
const devExternals = [...commonExternals, "@biomejs/biome", "bun-types"];

// Production externals (minimal for optimal bundle size)
const prodExternals = ["node_modules/*", "@prisma/client"];

export const buildConfigs: Record<string, BuildConfig> = {
  development: {
    outdir: "build/dev",
    target: "bun",
    sourcemap: "external",
    minify: false,
    external: devExternals,
    platform: "bun",
    format: "esm",
    define: {
      "process.env.NODE_ENV": '"development"',
      "process.env.DEBUG": "true",
      "globalThis.__DEV__": "true",
      "globalThis.__PROD__": "false",
    },
    plugins: [],
    // Development optimizations
    splitting: false,
    treeShaking: true,
    drop: ["console.time", "console.timeEnd"],
  },

  staging: {
    outdir: "build/staging",
    target: "bun",
    sourcemap: "inline", // Keep inline for debugging but optimize
    minify: true, // Simplified minify option
    external: commonExternals,
    platform: "bun",
    format: "esm",
    define: {
      "process.env.NODE_ENV": '"staging"',
      "process.env.DEBUG": "false",
      "globalThis.__DEV__": "false",
      "globalThis.__PROD__": "false",
    },
    plugins: [],
    // Staging optimizations
    splitting: true,
    treeShaking: true,
    drop: ["console.time", "console.timeEnd"],
    // Remove some dev-only code
    pure: ["console.debug"],
  },

  production: {
    outdir: "build/prod",
    target: "bun",
    sourcemap: false, // No sourcemaps in production
    minify: true, // Simplified minify option
    external: prodExternals,
    platform: "bun",
    format: "esm",
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.DEBUG": "false",
      "globalThis.__DEV__": "false",
      "globalThis.__PROD__": "true",
    },
    plugins: [],
    // Production optimizations
    splitting: true,
    treeShaking: true,
    drop: ["console.time", "console.timeEnd", "console.log", "console.info", "console.debug"],
    pure: ["console.assert", "console.trace"],
    // Dead code elimination
    deadCodeElimination: true,
  },
};

export function getBuildConfig(environment: string): BuildConfig {
  const config = buildConfigs[environment];
  if (!config) {
    throw new Error(`Unknown build environment: ${environment}`);
  }
  return config;
}

export function validateBuildConfig(config: BuildConfig): void {
  if (!config.outdir) {
    throw new Error("Build config must specify outdir");
  }

  if (!config.target) {
    throw new Error("Build config must specify target");
  }

  if (config.minify === true && config.sourcemap === false && config.platform === "bun") {
    // This is a valid production configuration
  }
}

export default buildConfigs;
