/**
 * Application Performance Monitoring (APM) Integration
 *
 * Provides APM functionality for monitoring application health,
 * performance metrics, and error tracking.
 */

import { type PerformanceMetrics, performanceMonitor } from "./performance";

export interface APMConfig {
  enabled: boolean;
  serviceName: string;
  environment: string;
  version: string;
  metricsInterval?: number; // milliseconds
  logLevel?: "debug" | "info" | "warn" | "error";
}

export interface APMMetrics {
  timestamp: Date;
  serviceName: string;
  environment: string;
  version: string;
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
  application: {
    activeRequests: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    requestsPerMinute: number;
  };
  endpoints: Record<
    string,
    {
      requestCount: number;
      averageResponseTime: number;
      errorRate: number;
    }
  >;
}

export class APMManager {
  private config: APMConfig;
  private metricsInterval?: NodeJS.Timeout;
  private isRunning = false;
  private metrics: APMMetrics[] = [];

  constructor(config: APMConfig) {
    this.config = config;
  }

  start(): void {
    if (this.isRunning || !this.config.enabled) {
      return;
    }

    this.isRunning = true;
    console.log(`📊 APM started for ${this.config.serviceName} in ${this.config.environment}`);

    // Collect metrics at regular intervals
    const interval = this.config.metricsInterval || 30000; // 30 seconds default
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, interval);

    // Initial metrics collection
    this.collectMetrics();
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    console.log("📊 APM stopped");
  }

  private collectMetrics(): void {
    const perfMetrics = performanceMonitor.getMetrics();
    const metrics: APMMetrics = {
      timestamp: new Date(),
      serviceName: this.config.serviceName,
      environment: this.config.environment,
      version: this.config.version,
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      application: {
        activeRequests: perfMetrics.length,
        totalRequests: perfMetrics.length,
        errorRate: performanceMonitor.getErrorRate(),
        averageResponseTime: performanceMonitor.getAverageResponseTime(),
        requestsPerMinute: performanceMonitor.getRequestsPerMinute(),
      },
      endpoints: this.getEndpointMetrics(perfMetrics),
    };

    this.metrics.push(metrics);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    this.logMetrics(metrics);
  }

  private getEndpointMetrics(perfMetrics: PerformanceMetrics[]): Record<string, any> {
    const endpoints = [...new Set(perfMetrics.map((m) => m.endpoint))];
    return endpoints.reduce(
      (acc, endpoint) => {
        const endpointMetrics = perfMetrics.filter((m) => m.endpoint === endpoint);
        acc[endpoint] = {
          requestCount: endpointMetrics.length,
          averageResponseTime: this.calculateAverageResponseTime(endpointMetrics),
          errorRate: this.calculateErrorRate(endpointMetrics),
        };
        return acc;
      },
      {} as Record<string, any>
    );
  }

  private calculateAverageResponseTime(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  private calculateErrorRate(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;
    const errorCount = metrics.filter((m) => m.statusCode >= 400).length;
    return (errorCount / metrics.length) * 100;
  }

  private logMetrics(metrics: APMMetrics): void {
    if (this.config.logLevel === "debug") {
      console.log(`📊 APM Metrics - ${metrics.timestamp.toISOString()}`);
      console.log(`├─ Memory: ${Math.round(metrics.system.memoryUsage.heapUsed / 1024 / 1024)}MB`);
      console.log(`├─ Active Requests: ${metrics.application.activeRequests}`);
      console.log(`├─ Error Rate: ${metrics.application.errorRate.toFixed(2)}%`);
      console.log(`├─ Avg Response Time: ${metrics.application.averageResponseTime.toFixed(2)}ms`);
      console.log(`├─ Requests/min: ${metrics.application.requestsPerMinute}`);
      console.log(`└─ Endpoints: ${Object.keys(metrics.endpoints).length}`);
    }
  }

  getMetrics(): APMMetrics[] {
    return [...this.metrics];
  }

  getLatestMetrics(): APMMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  generateHealthCheck(): {
    healthy: boolean;
    checks: Record<string, boolean>;
    metrics: APMMetrics | null;
  } {
    const metrics = this.getLatestMetrics();

    const checks = {
      memoryUsage: metrics ? metrics.system.memoryUsage.heapUsed < 512 * 1024 * 1024 : true, // < 512MB
      errorRate: metrics ? metrics.application.errorRate < 5 : true, // < 5%
      responseTime: metrics ? metrics.application.averageResponseTime < 1000 : true, // < 1000ms
      uptime: metrics ? metrics.system.uptime > 10 : true, // > 10 seconds
    };

    const healthy = Object.values(checks).every((check) => check);

    return {
      healthy,
      checks,
      metrics,
    };
  }

  async exportMetrics(format: "json" | "prometheus" = "json"): Promise<string> {
    const metrics = this.getLatestMetrics();
    if (!metrics) {
      return format === "json" ? "null" : "";
    }

    if (format === "json") {
      return JSON.stringify(metrics, null, 2);
    }

    // Prometheus format
    return this.formatPrometheusMetrics(metrics);
  }

  private formatPrometheusMetrics(metrics: APMMetrics): string {
    const labels = `service="${metrics.serviceName}",environment="${metrics.environment}",version="${metrics.version}"`;

    let output = "";

    // System metrics
    output += "# HELP system_memory_bytes Memory usage in bytes\n";
    output += "# TYPE system_memory_bytes gauge\n";
    output += `system_memory_bytes{${labels},type="heap_used"} ${metrics.system.memoryUsage.heapUsed}\n`;
    output += `system_memory_bytes{${labels},type="heap_total"} ${metrics.system.memoryUsage.heapTotal}\n`;
    output += `system_memory_bytes{${labels},type="rss"} ${metrics.system.memoryUsage.rss}\n`;

    // Application metrics
    output += "# HELP app_active_requests Current number of active requests\n";
    output += "# TYPE app_active_requests gauge\n";
    output += `app_active_requests{${labels}} ${metrics.application.activeRequests}\n`;

    output += "# HELP app_error_rate Error rate percentage\n";
    output += "# TYPE app_error_rate gauge\n";
    output += `app_error_rate{${labels}} ${metrics.application.errorRate}\n`;

    output += "# HELP app_average_response_time Average response time in milliseconds\n";
    output += "# TYPE app_average_response_time gauge\n";
    output += `app_average_response_time{${labels}} ${metrics.application.averageResponseTime}\n`;

    output += "# HELP app_requests_per_minute Requests per minute\n";
    output += "# TYPE app_requests_per_minute gauge\n";
    output += `app_requests_per_minute{${labels}} ${metrics.application.requestsPerMinute}\n`;

    return output;
  }
}

// Default APM configuration
export const defaultAPMConfig: APMConfig = {
  enabled: process.env.APM_ENABLED !== "false",
  serviceName: "dev-plugin",
  environment: process.env.NODE_ENV || "development",
  version: process.env.npm_package_version || "1.0.0",
  metricsInterval: 30000, // 30 seconds
  logLevel: (process.env.APM_LOG_LEVEL as any) || "info",
};

// Global APM instance
export const apmManager = new APMManager(defaultAPMConfig);

// Initialize APM if enabled
if (defaultAPMConfig.enabled) {
  apmManager.start();
}

// Elysia plugin for APM
export const apmPlugin = () => ({
  beforeHandle({ set }: { set: any }) {
    const health = apmManager.generateHealthCheck();

    // Add APM headers
    set.headers = set.headers || {};
    set.headers["x-apm-service"] = defaultAPMConfig.serviceName;
    set.headers["x-apm-environment"] = defaultAPMConfig.environment;
    set.headers["x-apm-healthy"] = health.healthy.toString();
  },
});
