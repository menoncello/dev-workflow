/**
 * Build configuration for different environments
 */

import type { BuildConfig } from "../types/build";

export const buildConfigs: Record<string, BuildConfig> = {
	development: {
		outdir: "build/dev",
		target: "bun",
		sourcemap: true,
		minify: false,
		external: ["node_modules/*"],
		platform: "bun",
		format: "esm",
		define: {
			"process.env.NODE_ENV": '"development"',
			"process.env.DEBUG": "true",
		},
		plugins: [],
	},

	staging: {
		outdir: "build/staging",
		target: "bun",
		sourcemap: true,
		minify: false,
		external: [],
		platform: "bun",
		format: "esm",
		define: {
			"process.env.NODE_ENV": '"staging"',
			"process.env.DEBUG": "false",
		},
		plugins: [],
	},

	production: {
		outdir: "build/prod",
		target: "bun",
		sourcemap: false,
		minify: true,
		external: ["node_modules/*"],
		platform: "bun",
		format: "esm",
		define: {
			"process.env.NODE_ENV": '"production"',
			"process.env.DEBUG": "false",
		},
		plugins: [],
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

	if (
		config.minify === true &&
		config.sourcemap === false &&
		config.platform === "bun"
	) {
		// This is a valid production configuration
	}
}

export default buildConfigs;
