/**
 * Unit tests for the logger utility
 */

import { describe, expect, it } from "bun:test";
import { Logger, logger } from "../../../src/utils/logger";

describe("Logger", () => {
	it("should create a logger with default context", () => {
		const testLogger = new Logger({ service: "test" });
		expect(testLogger).toBeDefined();
	});

	it("should have log methods available", () => {
		expect(typeof logger.debug).toBe("function");
		expect(typeof logger.info).toBe("function");
		expect(typeof logger.warn).toBe("function");
		expect(typeof logger.error).toBe("function");
	});

	it("should create child logger with additional context", () => {
		const childLogger = logger.child({ requestId: "123" });
		expect(childLogger).toBeDefined();
		expect(typeof childLogger.info).toBe("function");
	});

	it("should handle logging without throwing errors", () => {
		expect(() => {
			logger.debug("Test debug message", { key: "value" });
			logger.info("Test info message");
			logger.warn("Test warning message");
			logger.error("Test error message");
		}).not.toThrow();
	});

	it("should generate trace IDs", () => {
		// Test the trace ID generation method directly
		const testLogger = new Logger();
		const traceId1 = (testLogger as any).generateTraceId();
		const traceId2 = (testLogger as any).generateTraceId();

		expect(traceId1).toBeDefined();
		expect(traceId2).toBeDefined();
		expect(traceId1).not.toBe(traceId2);
		expect(typeof traceId1).toBe("string");
		expect(traceId1.length).toBeGreaterThan(0);
	});
});
