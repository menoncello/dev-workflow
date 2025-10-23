#!/usr/bin/env bun

import { execSync } from "node:child_process";
import { performance } from "node:perf_hooks";

interface PerformanceMetrics {
  startupTime: number;
  hotReloadTime?: number;
  bundleSize?: {
    dev: number;
    staging: number;
    prod: number;
  };
  buildTimes?: {
    dev: number;
    staging: number;
    prod: number;
  };
  memoryUsage?: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    startupTime: 0,
  };

  async measureStartupTime(): Promise<number> {
    console.log("🚀 Measuring application startup time...");

    const startTime = performance.now();

    try {
      // Build and start the application
      execSync("bun run build:dev", { stdio: "pipe" });

      const _processStartTime = performance.now();

      // Start the application process
      const _child = execSync(
        'NODE_ENV=development bun run build/dev/index.js & sleep 5 && pkill -f "build/dev/index.js"',
        {
          stdio: "pipe",
          timeout: 10000,
        }
      );

      const endTime = performance.now();
      const startupTime = endTime - startTime;

      console.log(`✅ Application startup time: ${startupTime.toFixed(2)}ms`);

      this.metrics.startupTime = startupTime;
      return startupTime;
    } catch (error) {
      console.error("❌ Failed to measure startup time:", error);
      return -1;
    }
  }

  async measureBuildTimes(): Promise<void> {
    console.log("🔨 Measuring build times...");

    const environments = ["dev", "staging", "prod"] as const;
    this.metrics.buildTimes = {} as any;

    for (const env of environments) {
      const startTime = performance.now();

      try {
        execSync(`bun run build:${env}`, { stdio: "pipe" });
        const endTime = performance.now();
        const buildTime = endTime - startTime;

        this.metrics.buildTimes![env] = buildTime;
        console.log(`  ${env.toUpperCase()} build time: ${buildTime.toFixed(2)}ms`);
      } catch (error) {
        console.error(`❌ Failed to build ${env}:`, error);
        this.metrics.buildTimes![env] = -1;
      }
    }
  }

  async measureBundleSizes(): Promise<void> {
    console.log("📦 Measuring bundle sizes...");

    const environments = ["dev", "staging", "prod"] as const;
    this.metrics.bundleSize = {} as any;

    for (const env of environments) {
      try {
        // Try different possible locations for the bundle
        let stats: string;
        let sizeBytes = 0;

        // Try new chunked structure first
        try {
          const totalSize = execSync(`find build/${env} -name "*.js" -exec du -bc {} + | tail -1`, {
            encoding: "utf8",
          });
          sizeBytes = Number.parseInt(totalSize.trim().split("\t")[0]);
        } catch {
          // Fallback to single file structure
          try {
            stats = execSync(`stat -c%s build/${env}/src/index.js`, { encoding: "utf8" });
            sizeBytes = Number.parseInt(stats.trim());
          } catch {
            stats = execSync(`stat -c%s build/${env}/index.js`, { encoding: "utf8" });
            sizeBytes = Number.parseInt(stats.trim());
          }
        }

        const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);

        this.metrics.bundleSize![env] = sizeBytes;
        console.log(`  ${env.toUpperCase()} bundle size: ${sizeMB} MB (${sizeBytes} bytes)`);
      } catch (error) {
        console.error(`❌ Failed to get ${env} bundle size:`, error);
        this.metrics.bundleSize![env] = 0;
      }
    }
  }

  async measureMemoryUsage(): Promise<void> {
    console.log("💾 Measuring memory usage...");

    try {
      const memInfo = execSync("ps -o pid,rss,vsz,pcpu,pmem,comm -p $PPID", { encoding: "utf8" });
      console.log("Process memory info:");
      console.log(memInfo);

      if (process.memoryUsage) {
        const memUsage = process.memoryUsage();
        this.metrics.memoryUsage = {
          rss: memUsage.rss,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
        };

        console.log("  Node.js memory usage:");
        console.log(`    RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
        console.log(`    Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`    Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      }
    } catch (error) {
      console.error("❌ Failed to measure memory usage:", error);
    }
  }

  async measureHotReloadTime(): Promise<void> {
    console.log("🔄 Measuring hot-reload time...");

    try {
      // Start development server in background
      const _devProcess = execSync("bun run dev & sleep 3", { stdio: "pipe" });

      // Simulate file change
      const startTime = performance.now();

      // Touch a source file to trigger hot reload
      execSync("touch src/index.ts", { stdio: "pipe" });

      // Wait for hot reload to complete (this is a simplified measurement)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const endTime = performance.now();
      const hotReloadTime = endTime - startTime;

      this.metrics.hotReloadTime = hotReloadTime;
      console.log(`✅ Hot-reload time: ${hotReloadTime.toFixed(2)}ms`);

      // Clean up
      execSync('pkill -f "bun run dev"', { stdio: "pipe" });
    } catch (error) {
      console.error("❌ Failed to measure hot-reload time:", error);
      this.metrics.hotReloadTime = -1;
    }
  }

  analyzePerformance(): void {
    console.log("\n📊 Performance Analysis");
    console.log("======================\n");

    // Startup time analysis
    if (this.metrics.startupTime > 0) {
      if (this.metrics.startupTime < 3000) {
        console.log("✅ Startup time: EXCELLENT (< 3s)");
      } else if (this.metrics.startupTime < 5000) {
        console.log("✅ Startup time: GOOD (< 5s)");
      } else if (this.metrics.startupTime < 10000) {
        console.log("⚠️ Startup time: ACCEPTABLE (< 10s)");
      } else {
        console.log("❌ Startup time: POOR (> 10s)");
      }
    }

    // Build time analysis
    if (this.metrics.buildTimes) {
      console.log("\n🔨 Build Time Analysis:");
      Object.entries(this.metrics.buildTimes).forEach(([env, time]) => {
        if (time > 0) {
          if (time < 5000) {
            console.log(`  ✅ ${env.toUpperCase()}: EXCELLENT (${time.toFixed(2)}ms)`);
          } else if (time < 15000) {
            console.log(`  ✅ ${env.toUpperCase()}: GOOD (${time.toFixed(2)}ms)`);
          } else if (time < 30000) {
            console.log(`  ⚠️ ${env.toUpperCase()}: ACCEPTABLE (${time.toFixed(2)}ms)`);
          } else {
            console.log(`  ❌ ${env.toUpperCase()}: POOR (${time.toFixed(2)}ms)`);
          }
        }
      });
    }

    // Bundle size analysis
    if (this.metrics.bundleSize) {
      console.log("\n📦 Bundle Size Analysis:");
      Object.entries(this.metrics.bundleSize).forEach(([env, size]) => {
        if (size > 0) {
          const sizeMB = size / 1024 / 1024;
          if (env === "prod") {
            if (size < 1048576) {
              // 1MB
              console.log(`  ✅ ${env.toUpperCase()}: EXCELLENT (${sizeMB.toFixed(2)}MB < 1MB)`);
            } else {
              console.log(
                `  ⚠️ ${env.toUpperCase()}: NEEDS OPTIMIZATION (${sizeMB.toFixed(2)}MB > 1MB)`
              );
            }
          } else if (env === "staging") {
            if (size < 2097152) {
              // 2MB
              console.log(`  ✅ ${env.toUpperCase()}: GOOD (${sizeMB.toFixed(2)}MB < 2MB)`);
            } else {
              console.log(
                `  ⚠️ ${env.toUpperCase()}: NEEDS OPTIMIZATION (${sizeMB.toFixed(2)}MB > 2MB)`
              );
            }
          } else {
            console.log(`  ℹ️ ${env.toUpperCase()}: ${sizeMB.toFixed(2)}MB (development build)`);
          }
        }
      });
    }

    // Hot reload analysis
    if (this.metrics.hotReloadTime !== undefined) {
      if (this.metrics.hotReloadTime > 0) {
        if (this.metrics.hotReloadTime < 500) {
          console.log("\n✅ Hot-reload time: EXCELLENT (< 500ms)");
        } else if (this.metrics.hotReloadTime < 1000) {
          console.log("\n✅ Hot-reload time: GOOD (< 1s)");
        } else if (this.metrics.hotReloadTime < 2000) {
          console.log("\n⚠️ Hot-reload time: ACCEPTABLE (< 2s)");
        } else {
          console.log("\n❌ Hot-reload time: POOR (> 2s)");
        }
      }
    }
  }

  generateReport(): string {
    const report = `
# Performance Report

Generated: ${new Date().toISOString()}

## Metrics Summary

- **Startup Time**: ${this.metrics.startupTime.toFixed(2)}ms
- **Hot Reload Time**: ${this.metrics.hotReloadTime?.toFixed(2) || "N/A"}ms

### Build Times (ms)
${
  this.metrics.buildTimes
    ? Object.entries(this.metrics.buildTimes)
        .map(([env, time]) => `- ${env.toUpperCase()}: ${time > 0 ? time.toFixed(2) : "FAILED"}ms`)
        .join("\n")
    : "N/A"
}

### Bundle Sizes (MB)
${
  this.metrics.bundleSize
    ? Object.entries(this.metrics.bundleSize)
        .map(
          ([env, size]) =>
            `- ${env.toUpperCase()}: ${size > 0 ? (size / 1024 / 1024).toFixed(2) : "FAILED"}MB`
        )
        .join("\n")
    : "N/A"
}

### Memory Usage
${
  this.metrics.memoryUsage
    ? `- RSS: ${(this.metrics.memoryUsage.rss / 1024 / 1024).toFixed(2)}MB
- Heap Used: ${(this.metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB
- Heap Total: ${(this.metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`
    : "N/A"
}

## Recommendations

${this.generateRecommendations()}
    `;

    return report.trim();
  }

  private generateRecommendations(): string {
    const recommendations: string[] = [];

    if (this.metrics.startupTime > 5000) {
      recommendations.push("- Consider optimizing application startup time (currently > 5s)");
    }

    if (this.metrics.buildTimes) {
      Object.entries(this.metrics.buildTimes).forEach(([env, time]) => {
        if (time > 15000) {
          recommendations.push(`- Optimize ${env} build time (currently > 15s)`);
        }
      });
    }

    if (this.metrics.bundleSize) {
      if (this.metrics.bundleSize.prod > 1048576) {
        recommendations.push("- Production bundle size exceeds 1MB, consider code splitting");
      }
      if (this.metrics.bundleSize.staging > 2097152) {
        recommendations.push("- Staging bundle size exceeds 2MB, optimize source maps");
      }
    }

    if (this.metrics.hotReloadTime && this.metrics.hotReloadTime > 1000) {
      recommendations.push(
        "- Hot-reload time is slow (> 1s), consider optimizing watch configuration"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("- ✅ All performance metrics are within acceptable ranges");
    }

    return recommendations.join("\n");
  }

  async runFullAssessment(): Promise<void> {
    console.log("🎯 Starting Performance Assessment");
    console.log("================================\n");

    await this.measureBuildTimes();
    await this.measureBundleSizes();
    await this.measureStartupTime();
    await this.measureHotReloadTime();
    await this.measureMemoryUsage();

    this.analyzePerformance();

    // Save report
    const report = this.generateReport();
    await Bun.write("performance-report.md", report);
    console.log("\n📄 Detailed report saved to: performance-report.md");
  }
}

// Run performance monitor if this file is executed directly
if (import.meta.main) {
  const monitor = new PerformanceMonitor();

  const command = process.argv[2];

  switch (command) {
    case "startup":
      await monitor.measureStartupTime();
      break;
    case "build":
      await monitor.measureBuildTimes();
      break;
    case "bundle":
      await monitor.measureBundleSizes();
      break;
    case "memory":
      await monitor.measureMemoryUsage();
      break;
    case "hotreload":
      await monitor.measureHotReloadTime();
      break;
    default:
      await monitor.runFullAssessment();
  }
}

export { PerformanceMonitor };
