import { performance } from "node:perf_hooks";

// Performance monitoring utilities for APM integration

export interface PerformanceMetrics {
  requestId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: Date;
}

export interface LoadTestResult {
  testId: string;
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  timestamp: Date;
  testDuration: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private activeRequests = new Map<string, number>();

  startRequest(requestId: string): void {
    this.activeRequests.set(requestId, performance.now());
  }

  endRequest(data: Omit<PerformanceMetrics, "duration" | "timestamp">): void {
    const startTime = this.activeRequests.get(data.requestId);
    if (!startTime) return;

    const duration = performance.now() - startTime;
    this.activeRequests.delete(data.requestId);

    const metric: PerformanceMetrics = {
      ...data,
      duration,
      timestamp: new Date(),
      memoryUsage: process.memoryUsage(),
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getMetricsForEndpoint(endpoint: string): PerformanceMetrics[] {
    return this.metrics.filter((m) => m.endpoint === endpoint);
  }

  getAverageResponseTime(endpoint?: string): number {
    const relevantMetrics = endpoint ? this.getMetricsForEndpoint(endpoint) : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / relevantMetrics.length;
  }

  getRequestsPerMinute(): number {
    if (this.metrics.length === 0) return 0;

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentMetrics = this.metrics.filter((m) => m.timestamp.getTime() > oneMinuteAgo);
    return recentMetrics.length;
  }

  getErrorRate(endpoint?: string): number {
    const relevantMetrics = endpoint ? this.getMetricsForEndpoint(endpoint) : this.metrics;

    if (relevantMetrics.length === 0) return 0;

    const errorCount = relevantMetrics.filter((m) => m.statusCode >= 400).length;
    return (errorCount / relevantMetrics.length) * 100;
  }

  generatePerformanceReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      totalRequests: this.metrics.length,
      averageResponseTime: this.getAverageResponseTime(),
      requestsPerMinute: this.getRequestsPerMinute(),
      errorRate: this.getErrorRate(),
      memoryUsage: process.memoryUsage(),
      endpointBreakdown: this.getEndpointBreakdown(),
    };

    return JSON.stringify(report, null, 2);
  }

  private getEndpointBreakdown(): Record<string, any> {
    const endpoints = [...new Set(this.metrics.map((m) => m.endpoint))];
    return endpoints.reduce(
      (acc, endpoint) => {
        const endpointMetrics = this.getMetricsForEndpoint(endpoint);
        acc[endpoint] = {
          requestCount: endpointMetrics.length,
          averageResponseTime: this.getAverageResponseTime(endpoint),
          errorRate: this.getErrorRate(endpoint),
        };
        return acc;
      },
      {} as Record<string, any>
    );
  }
}

// Load testing utilities
export class LoadTester {
  private results: LoadTestResult[] = [];

  async runLoadTest(options: {
    endpoint: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    concurrentRequests?: number;
    totalRequests?: number;
    duration?: number; // seconds
    body?: any;
  }): Promise<LoadTestResult> {
    const {
      endpoint,
      method = "GET",
      concurrentRequests = 10,
      totalRequests = 100,
      duration = 30,
      body = null,
    } = options;

    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();

    let successfulRequests = 0;
    let failedRequests = 0;
    const responseTimes: number[] = [];

    console.log(`🚀 Starting load test: ${testId}`);
    console.log(`Target: ${method} ${endpoint}`);
    console.log(
      `Concurrency: ${concurrentRequests}, Total: ${totalRequests}, Duration: ${duration}s`
    );

    const promises = [];

    // Run concurrent requests
    for (let i = 0; i < totalRequests; i++) {
      const requestPromise = this.makeRequest(endpoint, method, body);
      promises.push(requestPromise);

      // Batch requests to control concurrency
      if (promises.length >= concurrentRequests) {
        const batchResults = await Promise.allSettled(promises);
        this.processBatchResults(
          batchResults,
          responseTimes,
          () => successfulRequests++,
          () => failedRequests++
        );
        promises.length = 0;
      }
    }

    // Process remaining requests
    if (promises.length > 0) {
      const batchResults = await Promise.allSettled(promises);
      this.processBatchResults(
        batchResults,
        responseTimes,
        () => successfulRequests++,
        () => failedRequests++
      );
    }

    const endTime = performance.now();
    const testDuration = (endTime - startTime) / 1000; // Convert to seconds

    const result: LoadTestResult = {
      testId,
      endpoint,
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      requestsPerSecond: totalRequests / testDuration,
      errorRate: (failedRequests / totalRequests) * 100,
      timestamp: new Date(),
      testDuration,
    };

    this.results.push(result);

    console.log(`✅ Load test completed: ${testId}`);
    console.log(`Success Rate: ${((successfulRequests / totalRequests) * 100).toFixed(2)}%`);
    console.log(`Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
    console.log(`Requests/sec: ${result.requestsPerSecond.toFixed(2)}`);

    return result;
  }

  private async makeRequest(endpoint: string, method: string, body: any): Promise<number> {
    const startTime = performance.now();

    try {
      const _response = await fetch(`http://localhost:3000${endpoint}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      const endTime = performance.now();
      return endTime - startTime;
    } catch (_error) {
      const endTime = performance.now();
      return endTime - startTime;
    }
  }

  private processBatchResults(
    results: PromiseSettledResult<number>[],
    responseTimes: number[],
    onSuccess: () => void,
    onFailure: () => void
  ): void {
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        responseTimes.push(result.value);
        onSuccess();
      } else {
        onFailure();
      }
    });
  }

  getLoadTestResults(): LoadTestResult[] {
    return [...this.results];
  }

  generateLoadTestReport(): string {
    const latestResults = this.results.slice(-10); // Last 10 tests

    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalTests: this.results.length,
        recentTests: latestResults.map((r) => ({
          testId: r.testId,
          endpoint: r.endpoint,
          requestsPerSecond: r.requestsPerSecond,
          errorRate: r.errorRate,
          averageResponseTime: r.averageResponseTime,
        })),
      },
      null,
      2
    );
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();
export const loadTester = new LoadTester();

// Elysia plugin for performance monitoring
export const performancePlugin = () => ({
  beforeHandle({ set }: { set: any }) {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    performanceMonitor.startRequest(requestId);

    // Store requestId for later use
    set.headers = set.headers || {};
    set.headers["x-request-id"] = requestId;

    return { requestId };
  },

  afterHandle({
    request,
    set,
    requestId,
  }: {
    request: Request;
    set: any;
    requestId: string;
  }) {
    performanceMonitor.endRequest({
      requestId,
      endpoint: new URL(request.url).pathname,
      method: request.method,
      statusCode: set.status || 200,
      memoryUsage: process.memoryUsage(),
    });
  },
});
