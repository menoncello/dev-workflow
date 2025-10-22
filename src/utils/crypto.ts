/**
 * Cryptographic utilities for the dev-plugin system
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Generate a cryptographically secure random string
 */
export function generateRandomString(length = 32): string {
	return randomBytes(length).toString("hex");
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
	const bytes = randomBytes(16);
	bytes[6] = (bytes[6]! & 0x0f) | 0x40; // Version 4
	bytes[8] = (bytes[8]! & 0x3f) | 0x80; // Variant 10

	return [
		bytes.subarray(0, 4).toString("hex"),
		bytes.subarray(4, 6).toString("hex"),
		bytes.subarray(6, 8).toString("hex"),
		bytes.subarray(8, 10).toString("hex"),
		bytes.subarray(10, 16).toString("hex"),
	].join("-");
}

/**
 * Hash a string using SHA-256
 */
export function sha256(data: string): string {
	return createHash("sha256").update(data).digest("hex");
}

/**
 * Hash a string with salt using SHA-256
 */
export function sha256WithSalt(data: string, salt: string): string {
	return createHash("sha256")
		.update(salt + data)
		.digest("hex");
}

/**
 * Generate a salt for hashing
 */
export function generateSalt(length = 16): string {
	return randomBytes(length).toString("hex");
}

/**
 * Hash a password using a simple salt + SHA-256 approach
 * In production, consider using Argon2 or bcrypt
 */
export function hashPassword(password: string): { hash: string; salt: string } {
	const salt = generateSalt();
	const hash = sha256WithSalt(password, salt);
	return { hash, salt };
}

/**
 * Verify a password against its hash and salt
 */
export function verifyPassword(
	password: string,
	hash: string,
	salt: string,
): boolean {
	const expectedHash = sha256WithSalt(password, salt);
	return timingSafeEqual(
		new Uint8Array(Buffer.from(hash)),
		new Uint8Array(Buffer.from(expectedHash)),
	);
}

/**
 * Generate an API key
 */
export function generateApiKey(prefix = "dp"): string {
	const randomPart = generateRandomString(24);
	return `${prefix}_${randomPart}`;
}

/**
 * Simple XOR encryption for non-sensitive data
 * NOT for cryptographic security, just obfuscation
 */
export function xorEncrypt(text: string, key: string): string {
	const keyBytes = Buffer.from(key, "utf8");
	const textBytes = Buffer.from(text, "utf8");
	const encrypted = Buffer.alloc(textBytes.length);

	for (let i = 0; i < textBytes.length; i++) {
		encrypted[i] = textBytes[i]! ^ keyBytes[i % keyBytes.length]!;
	}

	return encrypted.toString("base64");
}

/**
 * Simple XOR decryption for non-sensitive data
 * NOT for cryptographic security, just obfuscation
 */
export function xorDecrypt(encryptedText: string, key: string): string {
	const keyBytes = Buffer.from(key, "utf8");
	const encrypted = Buffer.from(encryptedText, "base64");
	const decrypted = Buffer.alloc(encrypted.length);

	for (let i = 0; i < encrypted.length; i++) {
		decrypted[i] = encrypted[i]! ^ keyBytes[i % keyBytes.length]!;
	}

	return decrypted.toString("utf8");
}
