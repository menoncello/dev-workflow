/**
 * Bun build configuration loader
 * Transforms our build configs to Bun's expected format
 */

import { getBuildConfig } from "./build";

const getBunBuildConfig = (environment: string) => {
  const config = getBuildConfig(environment);

  return {
    entrypoints: ["src/index.ts"],
    outdir: config.outdir,
    target: config.target || "bun",
    format: config.format || "esm",
    minify: config.minify || false,
    sourcemap: config.sourcemap || false,
    external: config.external || [],
    define: config.define || {},
    splitting: config.splitting || false,
    treeShaking: config.treeShaking || false,
    plugins: config.plugins || [],
    drop: config.drop || [],
    pure: config.pure || [],
    deadCodeElimination: config.deadCodeElimination || false,
  };
};

// Export configurations for different environments
export const bunBuildConfigs = {
  development: getBunBuildConfig("development"),
  staging: getBunBuildConfig("staging"),
  production: getBunBuildConfig("production"),
};

export default bunBuildConfigs;
