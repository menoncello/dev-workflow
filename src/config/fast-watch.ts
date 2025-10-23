/**
 * Ultra-fast watch configuration for sub-1s hot reload
 */

// Define proper type for Bun configuration
interface BunConfig {
  watch?: unknown;
  liveReload?: boolean;
  minify?: unknown;
  treeShaking?: boolean;
  splitting?: boolean;
  external?: string[];
  define?: Record<string, string>;
}

const isDevelopment = process.env.NODE_ENV === "development";

export const fastWatchConfig: Partial<BunConfig> = {
  watch: isDevelopment
    ? {
        // Ultra-aggressive exclusions for minimal rebuilds
        ignored: [
          "node_modules/**",
          "build/**",
          "dist/**",
          ".git/**",
          "coverage/**",
          ".next/**",
          "*.log",
          "*.tmp",
          ".env*",
          "**/*.test.ts",
          "**/*.spec.ts",
          "**/test/**",
          "**/tests/**",
          "docs/**",
          "scripts/**",
          ".github/**",
          "prisma/migrations/**",
          "**/*.md",
          "**/*.json",
          "**/*.yml",
          "**/*.yaml",
          "tsconfig.json",
          "bun.lockb",
          ".gitignore",
        ],

        // Very short debounce for immediate feedback
        debounce: 50,

        // Watch only essential source files
        extname: [".ts", ".tsx"],

        // Use polling only if file system events are unreliable
        usePolling: false,

        // Polling interval if enabled
        interval: 50,

        // Skip initial scan for faster startup
        ignoreInitial: true,

        // Don't follow symlinks
        followSymlinks: false,

        // Very shallow directory traversal
        depth: 2,

        // Use efficient file system events
        useFsEvents: true,
      }
    : false,

  // Enable live reload only in development
  liveReload: isDevelopment,

  // Development-specific optimizations
  minify: {
    whitespace: false,
    identifier: false,
    syntax: false,
  },

  // Optimize import handling
  treeShaking: true,
  splitting: false, // Disable splitting in dev for faster rebuilds

  // External dependencies to improve rebuild speed
  external: isDevelopment
    ? [
        // Externalize ALL dependencies for instant rebuilds
        "@prisma/client",
        "prisma",
        "redis",
        "ws",
        "dayjs",
        "cryptr",
        "ajv",
        "ajv-formats",
        "dotenv",
        "@elysiajs/cors",
        "@elysiajs/swagger",
        "@elysiajs/server-timing",
        "@elysiajs/jwt",
        "elysia",
        "node:*",
      ]
    : [],

  // Define environment variables at build time
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    "process.env.DEBUG": JSON.stringify(isDevelopment ? "true" : "false"),
    "globalThis.__DEV__": JSON.stringify(isDevelopment),
    "globalThis.__PROD__": JSON.stringify(!isDevelopment),
    "globalThis.HOT_RELOAD": JSON.stringify(isDevelopment),
  },
};

// Hot reload optimization utilities for sub-1s performance
export const fastHotReloadConfig = {
  // Only watch core source files
  hotReloadPatterns: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/*.spec.ts"],

  // Patterns to trigger full restart (minimal)
  restartPatterns: ["package.json", "bun.lockb"],

  // Files that should never trigger reload
  ignoredFiles: [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/test/**",
    "**/tests/**",
    "coverage/**",
    "build/**",
    "dist/**",
    "node_modules/**",
    "docs/**",
    "scripts/**",
    ".github/**",
    "prisma/**",
    "**/*.md",
    "**/*.json",
  ],

  // Ultra-fast debounce time
  debounceMs: 50,

  // Maximum reload attempts
  maxReloadAttempts: 3,

  // Fast timeout for reload operations
  reloadTimeoutMs: 1000,

  // Skip expensive operations during hot reload
  skipOnReload: ["databaseConnection", "fullBundleRebuild", "typeChecking", "linting"],

  // Enable partial reload for specific modules
  partialReload: {
    enabled: true,
    patterns: ["src/routes/**/*.ts", "src/modules/**/*.ts"],
    excludePatterns: ["src/index.ts", "src/config/**/*.ts"],
  },
};

export default fastWatchConfig;
