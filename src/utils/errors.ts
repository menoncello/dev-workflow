/**
 * Error handling utilities for the dev-plugin system
 */

export class DevPluginError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, any>;

  constructor(message: string, code: string, statusCode = 500, context?: Record<string, any>) {
    super(message);
    this.name = "DevPluginError";
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DevPluginError);
    }
  }
}

export class ValidationError extends DevPluginError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, context);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends DevPluginError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, "NOT_FOUND", 404, { resource, id });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends DevPluginError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, "CONFLICT", 409, context);
    this.name = "ConflictError";
  }
}

export class AgentError extends DevPluginError {
  constructor(message: string, agentId?: string, context?: Record<string, any>) {
    super(message, "AGENT_ERROR", 500, { agentId, ...context });
    this.name = "AgentError";
  }
}

export class WorkflowError extends DevPluginError {
  constructor(
    message: string,
    workflowId?: string,
    stepId?: string,
    context?: Record<string, any>
  ) {
    super(message, "WORKFLOW_ERROR", 500, {
      workflowId,
      stepId,
      ...context,
    });
    this.name = "WorkflowError";
  }
}

export class MCPError extends DevPluginError {
  constructor(message: string, toolId?: string, context?: Record<string, any>) {
    super(message, "MCP_ERROR", 500, { toolId, ...context });
    this.name = "MCPError";
  }
}

/**
 * Error handler middleware for Elysia
 */
/**
 * Redact sensitive data from objects for logging
 */
export function redactSensitiveData(obj: any, visited = new WeakSet()): any {
  if (typeof obj !== "object" || obj === null) return obj;

  // Handle circular references
  if (visited.has(obj)) {
    return "[CIRCULAR_REFERENCE]";
  }
  visited.add(obj);

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      // If array item is an object, redact it
      if (typeof item === "object" && item !== null) {
        return redactSensitiveData(item, visited);
      }
      // For primitives in arrays, check if they look sensitive
      if (typeof item === "string") {
        // Check for obvious sensitive patterns in array strings
        if (item.length > 30 || /^(sk_|pk_|Bearer)/.test(item)) {
          return "[REDACTED]";
        }
      }
      return item;
    });
  }

  const SENSITIVE_KEYS = [
    "password",
    "token",
    "secret",
    "key",
    "apiKey",
    "api_key",
    "authorization",
    "credential",
    "credentials",
    "private",
    "confidential",
    "ssn",
    "socialSecurityNumber",
    "creditCard",
    "creditcard",
    "cc",
    "cvv",
    "passport",
    "driverLicense",
    "bankAccount",
    "routingNumber",
    "accessToken",
    "refreshToken",
    "sessionToken",
    "jwt",
    "bearer",
    "oauth",
    "clientId",
    "clientSecret",
    "databaseUrl",
    "connectionString",
    "webhookSecret",
    "encryptionKey",
    "signingKey",
    "salt",
    "hash",
    "pin",
    "securityCode",
    "totp",
    "mfa",
    "twoFactor",
  ];

  const SENSITIVE_PATTERNS = [
    // High-confidence patterns (exact matches or very close)
    /^(password|token|secret|key|credential)$/i,
    /^(api|auth|private|confidential)$/i,
    /^(ssn|credit|cvv|passport|bank|routing|account)$/i,
    /^(jwt|bearer|oauth|webhook|encryption|signing)$/i,
    /^(access|refresh|session|client|database|connection)$/i,
    // Compound patterns (using .test() for partial matches)
    /^.*auth.*token.*$/i,
    /^.*access.*token.*$/i,
    /^.*refresh.*token.*$/i,
    /^.*session.*token.*$/i,
    /^.*api.*key.*$/i,
    /^.*webhook.*secret.*$/i,
    /^.*encryption.*key.*$/i,
    /^.*signing.*key.*$/i,
    /^.*client.*secret.*$/i,
    /^.*database.*url.*$/i,
    /^.*connection.*string.*$/i,
    // Additional patterns for compound words
    /^.*auth.*$/i,
    /^.*key.*$/i,
    /^.*secret.*$/i,
    /^.*token.*$/i,
  ];

  const SAFE_FIELD_PATTERNS = [
    /userid|username|email/i,
    /user/i,
    /id$/,
    /name$/,
    /type$/,
    /status$/,
    /role$/,
    /level$/,
    /created|updated|timestamp|date|time/i,
    /count|size|length|format|version$/i,
    /config|setting|option|flag|enabled|active|visible|public$/i,
    /description|title|label|category|tag|metadata$/i,
  ];

  const redacted = { ...obj };

  for (const key of Object.keys(redacted)) {
    const lowerKey = key.toLowerCase();

    // Check exact matches for highly sensitive keys
    const isExactSensitiveMatch = SENSITIVE_KEYS.some(
      (sensitive) => lowerKey === sensitive.toLowerCase()
    );

    if (isExactSensitiveMatch) {
      // For container objects like "credentials", process recursively rather than completely redacting
      if (
        typeof redacted[key] === "object" &&
        redacted[key] !== null &&
        !Array.isArray(redacted[key])
      ) {
        redacted[key] = redactSensitiveData(redacted[key], visited);
      } else {
        redacted[key] = "[REDACTED]";
      }
      continue;
    }

    // Check if this is a safe field that should never be redacted itself
    const isSafeField = SAFE_FIELD_PATTERNS.some((safePattern) => safePattern.test(key));

    // Check pattern matches for sensitive data
    if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof redacted[key] === "object" && redacted[key] !== null) {
      // Always recursively process nested objects, even if the parent field is "safe"
      redacted[key] = redactSensitiveData(redacted[key], visited);
    } else if (typeof redacted[key] === "string") {
      // Check for sensitive patterns in string values only if the field itself is sensitive
      if (!isSafeField) {
        redacted[key] = redactSensitiveStringValues(redacted[key], key);
      }
    }
    // Note: null and undefined values in non-sensitive fields are preserved as-is
  }

  return redacted;
}

/**
 * Redact sensitive patterns from string values
 */
function redactSensitiveStringValues(value: string, fieldName: string): string {
  if (typeof value !== "string") return value;

  // Don't redact if this is a safe field
  const SAFE_FIELD_PATTERNS = [
    /userid|username|email/i,
    /user/i,
    /id$/,
    /name$/,
    /type$/,
    /status$/,
    /role$/,
    /level$/,
    /created|updated|timestamp|date|time/i,
    /count|size|length|format|version$/i,
    /config|setting|option|flag|enabled|active|visible|public$/i,
    /description|title|label|category|tag|metadata$/i,
  ];

  if (SAFE_FIELD_PATTERNS.some((safePattern) => safePattern.test(fieldName))) {
    return value;
  }

  // Redact common sensitive patterns in string values
  let redacted = value;

  // Database URLs and connection strings - highest priority
  if (redacted.includes("://") && redacted.includes("@")) {
    redacted = redacted.replace(/\/\/[^:]+:[^@]+@/g, "//[REDACTED]:[REDACTED]@");
    // Don't return early - continue with other redactions
  }

  // API Keys and tokens
  redacted = redacted.replace(/(sk_|pk_|Bearer\s+)[a-zA-Z0-9_-]{15,}/g, "$1[REDACTED]");
  redacted = redacted.replace(/[a-zA-Z0-9_-]{35,}/g, "[REDACTED]"); // Very long alphanumeric strings

  // Connection parameters
  redacted = redacted.replace(/(password|secret|key|token)=([^&\s]+)/gi, "$1=[REDACTED]");

  // JWT tokens
  redacted = redacted.replace(
    /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    "[JWT_REDACTED]"
  );

  // Credit card numbers (basic pattern)
  redacted = redacted.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[CARD_REDACTED]");

  // SSN patterns
  redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_REDACTED]");

  // Email addresses (only in non-email fields)
  if (!fieldName.toLowerCase().includes("email")) {
    redacted = redacted.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      "[EMAIL_REDACTED]"
    );
  }

  return redacted;
}

/**
 * Sanitize database error messages to prevent exposing sensitive information
 */
export function sanitizeDatabaseError(errorMessage: string): string {
  // Remove potential sensitive information from database errors
  const sanitized = errorMessage
    .replace(/password=[^&\s]*/gi, "password=[REDACTED]")
    .replace(/secret=[^&\s]*/gi, "secret=[REDACTED]")
    .replace(/key=[^&\s]*/gi, "key=[REDACTED]")
    .replace(/user=[^&\s]*/gi, "user=[REDACTED]")
    .replace(/\/\/[^:]+:[^@]+@/g, "//[REDACTED]:[REDACTED]@")
    .replace(/for user=\w+/gi, "for user=[REDACTED]");

  return sanitized;
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string") return false;

  // Basic API key validation
  const validFormats = [
    /^[a-zA-Z0-9]{20,}$/, // Alphanumeric, at least 20 chars
    /^sk_[a-zA-Z0-9_]{24,}$/, // Stripe format (allow underscores)
    /^pk_[a-zA-Z0-9_]{24,}$/, // Stripe public key (allow underscores)
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/, // UUID format
  ];

  return validFormats.some((format) => format.test(apiKey));
}

export function handleError(error: Error): {
  error: string;
  code: string;
  statusCode: number;
  context?: any;
} {
  if (error instanceof DevPluginError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      context: redactSensitiveData(error.context),
    };
  }

  // Handle Prisma errors
  if (error.name === "PrismaClientKnownRequestError") {
    return {
      error: "Database operation failed",
      code: "DATABASE_ERROR",
      statusCode: 500,
      context: {
        originalError: sanitizeDatabaseError(error.message),
      },
    };
  }

  // Handle JWT errors
  if (error.name === "JWTError") {
    return {
      error: "Authentication failed",
      code: "AUTH_ERROR",
      statusCode: 401,
    };
  }

  // Generic error
  return {
    error: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
    code: "INTERNAL_ERROR",
    statusCode: 500,
    context:
      process.env.NODE_ENV !== "production"
        ? {
            originalError: redactSensitiveData(error.stack),
          }
        : undefined,
  };
}
