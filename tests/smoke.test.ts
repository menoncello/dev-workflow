/**
 * Smoke tests for basic project functionality
 */

import { describe, expect, it } from "bun:test";

describe("Project Foundation Smoke Tests", () => {
  it("should have basic TypeScript compilation", () => {
    // This test passes if the file can be imported and executed
    expect(true).toBe(true);
  });

  it("should import core utilities", async () => {
    const { logger } = await import("../src/utils/logger");
    const { generateRandomString, generateUUID } = await import("../src/utils/crypto");

    expect(logger).toBeDefined();
    expect(generateRandomString).toBeDefined();
    expect(generateUUID).toBeDefined();
  });

  it("should generate valid UUIDs", async () => {
    const { generateUUID } = await import("../src/utils/crypto");
    const uuid = generateUUID();

    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("should hash passwords consistently", async () => {
    const { hashPassword, verifyPassword } = await import("../src/utils/crypto");
    const password = "testPassword123";

    const { hash, salt } = hashPassword(password);
    expect(hash).toHaveLength(64);
    expect(salt).toHaveLength(32);

    const isValid = verifyPassword(password, hash, salt);
    expect(isValid).toBe(true);

    const isInvalid = verifyPassword("wrongPassword", hash, salt);
    expect(isInvalid).toBe(false);
  });

  it("should log messages without errors", async () => {
    const { logger } = await import("../src/utils/logger");

    expect(() => {
      logger.info("Test info message");
      logger.debug("Test debug message");
      logger.warn("Test warning message");
      logger.error("Test error message");
    }).not.toThrow();
  });
});
