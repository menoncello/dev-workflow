/**
 * Build utility functions
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { build } from "bun";
import { getBuildConfig, validateBuildConfig } from "../config/build";
import type { BuildConfig, BuildResult } from "../types/build";
import { logger } from "./logger";

export class Builder {
  private config: BuildConfig;
  private environment: string;

  constructor(environment: string) {
    this.environment = environment;
    this.config = getBuildConfig(environment);
    validateBuildConfig(this.config);
  }

  async build(): Promise<BuildResult> {
    const startTime = Date.now();
    logger.info(`Starting ${this.environment} build`, {
      environment: this.environment,
      outdir: this.config.outdir,
      target: this.config.target,
    });

    try {
      // Ensure output directory exists
      await fs.mkdir(this.config.outdir, { recursive: true });

      // Clean previous build
      await this.cleanOutputDirectory();

      // Run the build
      const buildResult = await build({
        entrypoints: [this.config.entrypoint || "src/index.ts"],
        outdir: this.config.outdir,
        target: this.config.target,
        sourcemap: this.config.sourcemap === true ? "inline" : this.config.sourcemap || "none",
        minify: this.config.minify,
        external: this.config.external,
        root: process.cwd(),
        publicPath: "/",
      });

      const duration = Date.now() - startTime;
      const size = await this.calculateTotalSize();

      const result: BuildResult = {
        success: true,
        outputFiles: [], // Will be populated by analyzeOutput
        metafile: undefined, // Bun build output doesn't provide metafile in the same format
        warnings: [],
        errors: [],
        duration,
        size,
      };

      logger.info(`${this.environment} build completed successfully`, {
        duration: `${duration}ms`,
        size: `${(size / 1024 / 1024).toFixed(2)} MB`,
        outputs: Object.keys(buildResult.outputs || {}).length,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`${this.environment} build failed`, error as Error, {
        duration: `${duration}ms`,
      });

      return {
        success: false,
        outputFiles: [],
        warnings: [],
        errors: [
          {
            text: error instanceof Error ? error.message : "Unknown build error",
          },
        ],
        duration,
        size: 0,
      };
    }
  }

  async cleanOutputDirectory(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.outdir);
      await Promise.all(files.map((file) => fs.unlink(path.join(this.config.outdir, file))));
      logger.debug(`Cleaned output directory: ${this.config.outdir}`);
    } catch (_error) {
      // Directory might not exist, which is fine
      logger.debug(`Output directory clean (or doesn't exist): ${this.config.outdir}`);
    }
  }

  private async calculateTotalSize(): Promise<number> {
    try {
      let totalSize = 0;
      const files = await fs.readdir(this.config.outdir);

      for (const file of files) {
        const filePath = path.join(this.config.outdir, file);
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          totalSize += stat.size;
        } else if (stat.isDirectory()) {
          // Recursively calculate size of subdirectories
          totalSize += await this.calculateDirectorySize(filePath);
        }
      }

      return totalSize;
    } catch (error) {
      logger.warn("Failed to calculate build size", error as Error);
      return 0;
    }
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    try {
      let totalSize = 0;
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          totalSize += stat.size;
        } else if (stat.isDirectory()) {
          totalSize += await this.calculateDirectorySize(filePath);
        }
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  getConfig(): BuildConfig {
    return { ...this.config };
  }

  getEnvironment(): string {
    return this.environment;
  }
}

export async function buildForEnvironment(environment: string): Promise<BuildResult> {
  const builder = new Builder(environment);
  return await builder.build();
}

export function createBuilder(environment: string): Builder {
  return new Builder(environment);
}

export async function analyzeBuild(outputDir: string): Promise<{
  totalSize: number;
  fileCount: number;
  largestFiles: Array<{ path: string; size: number }>;
  fileTypes: Record<string, number>;
}> {
  const analysis = {
    totalSize: 0,
    fileCount: 0,
    largestFiles: [] as Array<{ path: string; size: number }>,
    fileTypes: {} as Record<string, number>,
  };

  try {
    const files = await fs.readdir(outputDir);

    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const stat = await fs.stat(filePath);

      if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        analysis.totalSize += stat.size;
        analysis.fileCount++;
        analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
        analysis.largestFiles.push({ path: file, size: stat.size });
      }
    }

    // Sort largest files by size (descending) and take top 10
    analysis.largestFiles.sort((a, b) => b.size - a.size);
    analysis.largestFiles = analysis.largestFiles.slice(0, 10);
  } catch (error) {
    logger.warn("Failed to analyze build", error as Error);
  }

  return analysis;
}
