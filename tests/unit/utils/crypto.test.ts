/**
 * Unit tests for the crypto utility
 */

import { describe, expect, it } from "bun:test";
import {
  generateApiKey,
  generateRandomString,
  generateSalt,
  generateUUID,
  hashPassword,
  sha256,
  sha256WithSalt,
  verifyPassword,
  xorDecrypt,
  xorEncrypt,
} from "../../../src/utils/crypto";

describe("Crypto Utils", () => {
  describe("generateRandomString", () => {
    it("should generate a random string of default length", () => {
      const str = generateRandomString();
      expect(str).toHaveLength(64); // 32 bytes * 2 (hex)
      expect(/^[a-f0-9]+$/.test(str)).toBe(true);
    });

    it("should generate a random string of specified length", () => {
      const str = generateRandomString(16);
      expect(str).toHaveLength(32); // 16 bytes * 2 (hex)
    });
  });

  describe("generateUUID", () => {
    it("should generate a valid UUID v4", () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("should generate unique UUIDs", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe("sha256", () => {
    it("should generate consistent SHA-256 hash", () => {
      const data = "test data";
      const hash1 = sha256(data);
      const hash2 = sha256(data);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it("should generate different hashes for different data", () => {
      const hash1 = sha256("data1");
      const hash2 = sha256("data2");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("sha256WithSalt", () => {
    it("should generate different hashes with different salts", () => {
      const data = "password";
      const salt1 = "salt1";
      const salt2 = "salt2";
      const hash1 = sha256WithSalt(data, salt1);
      const hash2 = sha256WithSalt(data, salt2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("generateSalt", () => {
    it("should generate a salt of default length", () => {
      const salt = generateSalt();
      expect(salt).toHaveLength(32); // 16 bytes * 2 (hex)
    });

    it("should generate unique salts", () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });

  describe("hashPassword", () => {
    it("should hash a password with salt", () => {
      const password = "mypassword";
      const { hash, salt } = hashPassword(password);
      expect(hash).toHaveLength(64);
      expect(salt).toHaveLength(32);
    });

    it("should generate different hashes for the same password", () => {
      const password = "mypassword";
      const { hash: hash1 } = hashPassword(password);
      const { hash: hash2 } = hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", () => {
      const password = "mypassword";
      const { hash, salt } = hashPassword(password);
      expect(verifyPassword(password, hash, salt)).toBe(true);
    });

    it("should reject incorrect password", () => {
      const password = "mypassword";
      const wrongPassword = "wrongpassword";
      const { hash, salt } = hashPassword(password);
      expect(verifyPassword(wrongPassword, hash, salt)).toBe(false);
    });
  });

  describe("generateApiKey", () => {
    it("should generate an API key with default prefix", () => {
      const apiKey = generateApiKey();
      expect(apiKey).toMatch(/^dp_[a-f0-9]{48}$/);
    });

    it("should generate an API key with custom prefix", () => {
      const apiKey = generateApiKey("test");
      expect(apiKey).toMatch(/^test_[a-f0-9]{48}$/);
    });

    it("should generate unique API keys", () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe("xor encryption", () => {
    it("should encrypt and decrypt text correctly", () => {
      const text = "Hello, World!";
      const key = "secretkey";
      const encrypted = xorEncrypt(text, key);
      const decrypted = xorDecrypt(encrypted, key);
      expect(decrypted).toBe(text);
    });

    it("should produce different encrypted text for different keys", () => {
      const text = "Hello, World!";
      const key1 = "key1";
      const key2 = "key2";
      const encrypted1 = xorEncrypt(text, key1);
      const encrypted2 = xorEncrypt(text, key2);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should fail to decrypt with wrong key", () => {
      const text = "Hello, World!";
      const key1 = "key1";
      const key2 = "key2";
      const encrypted = xorEncrypt(text, key1);
      const decrypted = xorDecrypt(encrypted, key2);
      expect(decrypted).not.toBe(text);
    });
  });
});
