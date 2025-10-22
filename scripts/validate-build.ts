#!/usr/bin/env bun

/**
 * Build validation script
 * Validates that builds are working correctly for all environments
 */

import { promises as fs } from "node:fs";
import { analyzeBuild, buildForEnvironment } from "../src/utils/build";
import { logger } from "../src/utils/logger";

interface ValidationResult {
	environment: string;
	success: boolean;
	buildTime: number;
	size: number;
	files: string[];
	errors: string[];
	warnings: string[];
}

interface ValidationReport {
	overall: boolean;
	environments: ValidationResult[];
	totalBuildTime: number;
	summary: {
		successful: number;
		failed: number;
		totalSize: number;
	};
}

async function validateSingleEnvironment(
	environment: string,
): Promise<ValidationResult> {
	logger.info(`Validating build for environment: ${environment}`);

	const startTime = Date.now();
	const result = await buildForEnvironment(environment);
	const buildTime = Date.now() - startTime;

	if (!result.success) {
		return {
			environment,
			success: false,
			buildTime,
			size: 0,
			files: [],
			errors: result.errors.map((e) => e.text),
			warnings: result.warnings.map((w) => w.text),
		};
	}

	// Analyze the build output
	const buildConfigs = (await import("../src/config/build")).buildConfigs;
	const config = buildConfigs[environment];
	const analysis = await analyzeBuild(config.outdir);

	// Get list of built files
	let files: string[] = [];
	try {
		files = await fs.readdir(config.outdir);
	} catch (error) {
		logger.warn(
			`Failed to read build directory: ${config.outdir}`,
			error as Error,
		);
	}

	return {
		environment,
		success: true,
		buildTime,
		size: analysis.totalSize,
		files,
		errors: [],
		warnings: [],
	};
}

function generateReport(results: ValidationResult[]): ValidationReport {
	const successful = results.filter((r) => r.success);
	const failed = results.filter((r) => !r.success);
	const totalSize = successful.reduce((sum, r) => sum + r.size, 0);
	const totalBuildTime = results.reduce((sum, r) => sum + r.buildTime, 0);

	return {
		overall: failed.length === 0,
		environments: results,
		totalBuildTime,
		summary: {
			successful: successful.length,
			failed: failed.length,
			totalSize,
		},
	};
}

function printReport(report: ValidationReport): void {
	console.log("\n🔍 Build Validation Report");
	console.log("========================");
	console.log(
		`Overall Status: ${report.overall ? "✅ PASSED" : "❌ FAILED"}`,
	);
	console.log(
		`Total Build Time: ${(report.totalBuildTime / 1000).toFixed(2)}s`,
	);
	console.log(
		`Successful Builds: ${report.summary.successful}/${report.environments.length}`,
	);
	console.log(
		`Total Build Size: ${(report.summary.totalSize / 1024 / 1024).toFixed(2)} MB`,
	);

	if (report.summary.failed > 0) {
		console.log("\n❌ Failed Builds:");
		report.environments
			.filter((r) => !r.success)
			.forEach((r) => {
				console.log(`  ${r.environment}:`);
				r.errors.forEach((error) => {
					console.log(`    - ${error}`);
				});
			});
	}

	console.log("\n📊 Environment Details:");
	report.environments.forEach((r) => {
		const status = r.success ? "✅" : "❌";
		const size = r.success
			? `${(r.size / 1024 / 1024).toFixed(2)} MB`
			: "N/A";
		const time = `${r.buildTime}ms`;
		const files = r.success ? r.files.length : 0;

		console.log(`  ${status} ${r.environment}:`);
		console.log(`    Size: ${size}`);
		console.log(`    Time: ${time}`);
		console.log(`    Files: ${files}`);

		if (r.warnings.length > 0) {
			console.log(`    Warnings: ${r.warnings.length}`);
			r.warnings.slice(0, 3).forEach((warning) => {
				console.log(`      - ${warning}`);
			});
		}
	});

	// Recommendations
	console.log("\n💡 Recommendations:");

	if (report.overall) {
		console.log("  ✅ All builds are working correctly!");

		// Performance recommendations
		const prodResult = report.environments.find(
			(r) => r.environment === "production",
		);
		if (prodResult && prodResult.success) {
			if (prodResult.size > 5 * 1024 * 1024) {
				// > 5MB
				console.log("  📦 Consider optimizing production build size");
			}
			if (prodResult.buildTime > 30000) {
				// > 30s
				console.log("  ⚡ Consider optimizing build time");
			}
		}
	} else {
		console.log(
			"  ❌ Some builds are failing. Please check the errors above.",
		);
	}

	// Check for consistency
	const sizes = report.environments
		.filter((r) => r.success)
		.map((r) => r.size);

	if (sizes.length > 1) {
		const maxSize = Math.max(...sizes);
		const minSize = Math.min(...sizes);
		const sizeDifference = maxSize - minSize;
		const sizeDifferencePercent = (sizeDifference / minSize) * 100;

		if (sizeDifferencePercent > 50) {
			console.log(
				"  📏 Large size variation between environments detected",
			);
		}
	}
}

async function main(): Promise<void> {
	const environments = ["development", "staging", "production"];

	logger.info("Starting comprehensive build validation");

	const results: ValidationResult[] = [];

	for (const environment of environments) {
		const result = await validateSingleEnvironment(environment);
		results.push(result);
	}

	const report = generateReport(results);
	printReport(report);

	// Exit with appropriate code
	process.exit(report.overall ? 0 : 1);
}

// Run the script
if (import.meta.main) {
	main();
}
