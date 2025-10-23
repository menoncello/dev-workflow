/**
 * Optimized watch configuration for better hot reload performance
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

export const watchConfig: Partial<BunConfig> = {
  watch: isDevelopment
    ? {
        // Exclude directories that cause unnecessary rebuilds
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
        ],

        // Debounce filesystem events to reduce rebuild frequency
        debounce: 100,

        // Only watch specific file types
        extname: [".ts", ".tsx", ".js", ".jsx", ".json"],

        // Use polling if file system events are unreliable
        usePolling: false,

        // Polling interval if enabled
        interval: 100,

        // Ignore initial scan for faster startup
        ignoreInitial: true,

        // Follow symlinks
        followSymlinks: false,

        // Maximum depth of directory traversal
        depth: 3,
      }
    : false,

  // Enable live reload only in development
  liveReload: isDevelopment,

  // Optimize for development builds
  minify: {
    // Only minify in production
    whitespace: !isDevelopment,
    identifier: !isDevelopment,
    syntax: !isDevelopment,
  },

  // Optimize import handling
  treeShaking: true,
  splitting: !isDevelopment,

  // External dependencies to improve rebuild speed
  external: isDevelopment
    ? [
        // Development-specific externals
        "@prisma/client",
        "prisma",
        "redis",
        "ws",
        "dayjs",
        "cryptr",
        "ajv",
      ]
    : [],

  // Define environment variables at build time
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    "process.env.DEBUG": JSON.stringify(isDevelopment ? "true" : "false"),
    "globalThis.__DEV__": JSON.stringify(isDevelopment),
    "globalThis.__PROD__": JSON.stringify(!isDevelopment),
  },
};

// Hot reload optimization utilities
export const hotReloadConfig = {
  // Patterns to trigger hot reload
  hotReloadPatterns: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.js", "src/**/*.jsx"],

  // Patterns to trigger full restart
  restartPatterns: ["package.json", "bun.lockb", "prisma/schema.prisma", ".env*"],

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
  ],

  // Debounce time for hot reload (ms)
  debounceMs: 150,

  // Maximum reload attempts before showing error
  maxReloadAttempts: 5,

  // Timeout for reload operations
  reloadTimeoutMs: 3000,
};

export default watchConfig;
