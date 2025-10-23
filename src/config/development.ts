/**
 * Development environment configuration
 */

import { config } from "dotenv";

// Load environment variables
config();

export const developmentConfig = {
  server: {
    port: Number.parseInt(process.env.SERVER_PORT || "3000", 10),
    host: process.env.SERVER_HOST || "localhost",
    env: process.env.NODE_ENV || "development",
  },

  database: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://devuser:devpass@localhost:5432/devplugin?schema=public",
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || "dev-secret-key",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "dev-refresh-secret",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    password: process.env.REDIS_PASSWORD || undefined,
  },

  logging: {
    level: process.env.LOG_LEVEL || "debug",
    enableConsole: true,
    enableFile: false,
  },

  features: {
    swagger: process.env.ENABLE_SWAGGER === "true",
    cors: process.env.ENABLE_CORS !== "false",
    metrics: process.env.ENABLE_METRICS === "true",
  },

  agents: {
    maxConcurrent: Number.parseInt(process.env.MAX_CONCURRENT_AGENTS || "10", 10),
    timeout: Number.parseInt(process.env.AGENT_TIMEOUT || "300000", 10),
    memoryLimit: Number.parseInt(process.env.AGENT_MEMORY_LIMIT || "512", 10),
  },

  mcp: {
    timeout: Number.parseInt(process.env.MCP_TIMEOUT || "30000", 10),
    retryAttempts: Number.parseInt(process.env.MCP_RETRY_ATTEMPTS || "3", 10),
    cacheTTL: Number.parseInt(process.env.MCP_CACHE_TTL || "3600", 10),
  },

  external: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },
} as const;

export default developmentConfig;
