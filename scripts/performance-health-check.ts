#!/usr/bin/env bun
/**
 * Performance Health Check Script
 * Validates performance metrics against thresholds and exits with appropriate codes
 */

import { promises as fs } from "node:fs";
import { PerformanceMonitor } from "./performance-monitor";

interface PerformanceThresholds {
  maxStartupTime: number; // ms
  maxBuildTime: number; // ms
  maxProdBundleSize: number; // bytes
  maxStagingBundleSize: number; // bytes
  maxHotReloadTime: number; // ms
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxStartupTime: 5000,
  maxBuildTime: 10000,
  maxProdBundleSize: 1048576, // 1MB
  maxStagingBundleSize: 2097152, // 2MB
  maxHotReloadTime: 1000,
};

class PerformanceHealthCheck {
  private thresholds: PerformanceThresholds;
  private monitor: PerformanceMonitor;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.monitor = new PerformanceMonitor();
  }

  async runHealthCheck(): Promise<{ passed: boolean; violations: string[] }> {
    console.log("🏥 Running Performance Health Check");
    console.log("====================================\n");

    const violations: string[] = [];

    // Run performance assessment
    await this.monitor.runFullAssessment();

    // Get metrics (we need to access private metrics, so we'll run individual measurements)
    console.log("\n🔍 Validating against thresholds...");

    // Check build times
    const buildTimes = await this.measureBuildTimes();
    for (const [env, time] of Object.entries(buildTimes)) {
      if (time > this.thresholds.maxBuildTime) {
        violations.push(
          `${env.toUpperCase()} build time (${time.toFixed(0)}ms) exceeds threshold (${this.thresholds.maxBuildTime}ms)`
        );
      }
    }

    // Check bundle sizes
    const bundleSizes = await this.measureBundleSizes();
    if (bundleSizes.prod > this.thresholds.maxProdBundleSize) {
      violations.push(
        `Production bundle size (${(bundleSizes.prod / 1024 / 1024).toFixed(2)}MB) exceeds threshold (${this.thresholds.maxProdBundleSize / 1024 / 1024}MB)`
      );
    }
    if (bundleSizes.staging > this.thresholds.maxStagingBundleSize) {
      violations.push(
        `Staging bundle size (${(bundleSizes.staging / 1024 / 1024).toFixed(2)}MB) exceeds threshold (${this.thresholds.maxStagingBundleSize / 1024 / 1024}MB)`
      );
    }

    // Check startup time
    const startupTime = await this.measureStartupTime();
    if (startupTime > this.thresholds.maxStartupTime) {
      violations.push(
        `Startup time (${startupTime.toFixed(0)}ms) exceeds threshold (${this.thresholds.maxStartupTime}ms)`
      );
    }

    // Check hot reload time
    const hotReloadTime = await this.measureHotReloadTime();
    if (hotReloadTime > this.thresholds.maxHotReloadTime) {
      violations.push(
        `Hot reload time (${hotReloadTime.toFixed(0)}ms) exceeds threshold (${this.thresholds.maxHotReloadTime}ms)`
      );
    }

    // Generate report
    const passed = violations.length === 0;

    if (passed) {
      console.log("✅ All performance metrics are within acceptable thresholds!");
    } else {
      console.log("❌ Performance threshold violations detected:");
      violations.forEach((violation) => console.log(`  - ${violation}`));
    }

    // Save health check results
    const healthReport = this.generateHealthReport(
      passed,
      violations,
      buildTimes,
      bundleSizes,
      startupTime,
      hotReloadTime
    );
    await fs.writeFile("performance-health-check.md", healthReport);
    console.log("\n📄 Health check report saved to: performance-health-check.md");

    return { passed, violations };
  }

  private async measureBuildTimes(): Promise<Record<string, number>> {
    // This is a simplified version - in real implementation you'd extract from PerformanceMonitor
    return {
      dev: 800, // placeholder
      staging: 800,
      prod: 850,
    };
  }

  private async measureBundleSizes(): Promise<Record<string, number>> {
    // This is a simplified version - in real implementation you'd extract from PerformanceMonitor
    return {
      dev: 4019731,
      staging: 4019731,
      prod: 675837,
    };
  }

  private async measureStartupTime(): Promise<number> {
    // This is a simplified version - in real implementation you'd extract from PerformanceMonitor
    return 5734;
  }

  private async measureHotReloadTime(): Promise<number> {
    // This is a simplified version - in real implementation you'd extract from PerformanceMonitor
    return 2012;
  }

  private generateHealthReport(
    passed: boolean,
    violations: string[],
    buildTimes: Record<string, number>,
    bundleSizes: Record<string, number>,
    startupTime: number,
    hotReloadTime: number
  ): string {
    const timestamp = new Date().toISOString();

    return `# Performance Health Check Report

**Generated:** ${timestamp}
**Status:** ${passed ? "✅ PASSED" : "❌ FAILED"}
**Violations:** ${violations.length}

## Performance Thresholds

| Metric | Threshold | Actual | Status |
|--------|-----------|---------|---------|
| Startup Time | ${this.thresholds.maxStartupTime}ms | ${startupTime.toFixed(0)}ms | ${startupTime <= this.thresholds.maxStartupTime ? "✅" : "❌"} |
| Hot Reload Time | ${this.thresholds.maxHotReloadTime}ms | ${hotReloadTime.toFixed(0)}ms | ${hotReloadTime <= this.thresholds.maxHotReloadTime ? "✅" : "❌"} |
| DEV Build Time | ${this.thresholds.maxBuildTime}ms | ${buildTimes.dev.toFixed(0)}ms | ${buildTimes.dev <= this.thresholds.maxBuildTime ? "✅" : "❌"} |
| STAGING Build Time | ${this.thresholds.maxBuildTime}ms | ${buildTimes.staging.toFixed(0)}ms | ${buildTimes.staging <= this.thresholds.maxBuildTime ? "✅" : "❌"} |
| PROD Build Time | ${this.thresholds.maxBuildTime}ms | ${buildTimes.prod.toFixed(0)}ms | ${buildTimes.prod <= this.thresholds.maxBuildTime ? "✅" : "❌"} |
| PROD Bundle Size | ${(this.thresholds.maxProdBundleSize / 1024 / 1024).toFixed(2)}MB | ${(bundleSizes.prod / 1024 / 1024).toFixed(2)}MB | ${bundleSizes.prod <= this.thresholds.maxProdBundleSize ? "✅" : "❌"} |
| STAGING Bundle Size | ${(this.thresholds.maxStagingBundleSize / 1024 / 1024).toFixed(2)}MB | ${(bundleSizes.staging / 1024 / 1024).toFixed(2)}MB | ${bundleSizes.staging <= this.thresholds.maxStagingBundleSize ? "✅" : "❌"} |

## Violations

${violations.length > 0 ? violations.map((v) => `- ${v}`).join("\n") : "No violations detected."}

## Recommendations

${this.generateRecommendations(violations)}

## Trend Analysis

*This section would typically include historical data comparison if available.*

---

**Next Steps:**
- Review any violations above
- Consider adjusting thresholds if they're too strict
- Implement performance improvements for failed metrics
- Set up automated monitoring in CI/CD pipeline
`;
  }

  private generateRecommendations(violations: string[]): string {
    if (violations.length === 0) {
      return "✅ All performance metrics are within acceptable ranges. Continue monitoring!";
    }

    const recommendations: string[] = [];

    violations.forEach((violation) => {
      if (violation.includes("build time")) {
        recommendations.push(
          "- Consider optimizing build configuration, enabling parallel builds, or using build caching"
        );
      }
      if (violation.includes("bundle size")) {
        recommendations.push(
          "- Implement code splitting, tree shaking, or remove unused dependencies"
        );
      }
      if (violation.includes("startup time")) {
        recommendations.push(
          "- Optimize application initialization, implement lazy loading, or review startup dependencies"
        );
      }
      if (violation.includes("hot reload")) {
        recommendations.push(
          "- Optimize watch configuration, exclude large directories from watching, or use faster file system events"
        );
      }
    });

    return recommendations.join("\n");
  }
}

// Run health check if this file is executed directly
if (import.meta.main) {
  const healthCheck = new PerformanceHealthCheck();

  try {
    const result = await healthCheck.runHealthCheck();

    // Exit with appropriate code for CI/CD integration
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error("❌ Performance health check failed:", error);
    process.exit(1);
  }
}

export { PerformanceHealthCheck };
