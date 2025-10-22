#!/usr/bin/env bun

/**
 * Build optimization script for production deployments
 */

import { analyzeBuild, buildForEnvironment } from "../src/utils/build";
import { logger } from "../src/utils/logger";

const BUILD_ENVIRONMENTS = ["development", "staging", "production"] as const;
type BuildEnvironment = (typeof BUILD_ENVIRONMENTS)[number];

interface BuildOptions {
	environment: BuildEnvironment;
	analyze: boolean;
	clean: boolean;
	verbose: boolean;
}

function parseArguments(): BuildOptions {
	const args = process.argv.slice(2);
	const options: BuildOptions = {
		environment: "production",
		analyze: false,
		clean: true,
		verbose: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		switch (arg) {
			case "--env":
			case "-e":
				options.environment = args[++i] as BuildEnvironment;
				break;
			case "--analyze":
			case "-a":
				options.analyze = true;
				break;
			case "--no-clean":
				options.clean = false;
				break;
			case "--verbose":
			case "-v":
				options.verbose = true;
				break;
			case "--help":
			case "-h":
				showHelp();
				process.exit(0);
				break;
			default:
				if (BUILD_ENVIRONMENTS.includes(arg as BuildEnvironment)) {
					options.environment = arg as BuildEnvironment;
				} else {
					console.error(`Unknown argument: ${arg}`);
					showHelp();
					process.exit(1);
				}
		}
	}

	return options;
}

function showHelp(): void {
	console.log(`
Build Optimization Script

USAGE:
  bun run scripts/build-optimize.ts [environment] [options]

ENVIRONMENTS:
  development     Build for development with source maps
  staging         Build for staging with minification
  production      Build for production with full optimization (default)

OPTIONS:
  -e, --env <env>     Set build environment
  -a, --analyze       Analyze build output after completion
  --no-clean          Skip cleaning output directory before build
  -v, --verbose       Enable verbose logging
  -h, --help          Show this help message

EXAMPLES:
  bun run scripts/build-optimize.ts                # Production build
  bun run scripts/build-optimize.ts staging       # Staging build with analysis
  bun run scripts/build-optimize.ts --env dev     # Development build
  bun run scripts/build-optimize.ts --analyze     # Production build with analysis
`);
}

async function main(): Promise<void> {
	const options = parseArguments();

	if (options.verbose) {
		// Configure verbose logging
		process.env.LOG_LEVEL = "debug";
	}

	logger.info("Starting build optimization process", {
		environment: options.environment,
		analyze: options.analyze,
		clean: options.clean,
	});

	try {
		// Run the build
		const startTime = Date.now();
		const result = await buildForEnvironment(options.environment);
		const buildTime = Date.now() - startTime;

		if (!result.success) {
			logger.error("Build failed", undefined, {
				errors: result.errors,
				duration: `${buildTime}ms`,
			});
			process.exit(1);
		}

		logger.info("Build completed successfully", {
			environment: options.environment,
			duration: `${buildTime}ms`,
			size: `${(result.size / 1024 / 1024).toFixed(2)} MB`,
		});

		// Analyze build if requested
		if (options.analyze) {
			logger.info("Analyzing build output...");
			const config = (await import("../src/config/build")).buildConfigs[
				options.environment
			];
			const analysis = await analyzeBuild(config.outdir);

			console.log("\n📊 Build Analysis Report");
			console.log("======================");
			console.log(`Environment: ${options.environment}`);
			console.log(
				`Total Size: ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB`,
			);
			console.log(`File Count: ${analysis.fileCount}`);

			console.log("\n📁 File Types:");
			Object.entries(analysis.fileTypes)
				.sort(([, a], [, b]) => b - a)
				.forEach(([ext, count]) => {
					console.log(`  ${ext || "no extension"}: ${count} files`);
				});

			if (analysis.largestFiles.length > 0) {
				console.log("\n📈 Largest Files:");
				analysis.largestFiles.slice(0, 5).forEach((file, index) => {
					const sizeKB = (file.size / 1024).toFixed(2);
					console.log(`  ${index + 1}. ${file.path}: ${sizeKB} KB`);
				});
			}

			// Performance recommendations
			console.log("\n💡 Recommendations:");
			if (analysis.totalSize > 10 * 1024 * 1024) {
				// > 10MB
				console.log(
					"  ⚠️  Build size is quite large. Consider code splitting.",
				);
			}
			if (analysis.fileTypes[".js"] > 10) {
				console.log("  📦 Consider chunking large JavaScript files.");
			}
			if (!analysis.fileTypes[".map"]) {
				console.log(
					"  🔍 Source maps are disabled. This is good for production.",
				);
			}
		}

		logger.info("Build optimization process completed");
	} catch (error) {
		logger.error("Build optimization process failed", error as Error);
		process.exit(1);
	}
}

// Run the script
if (import.meta.main) {
	main();
}
