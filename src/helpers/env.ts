import { t } from "elysia";
import ajv from "#helpers/ajv";
import { GlobalResponseError } from "./errors";

const EnvModel = t.Object({
  NODE_ENV: t.Optional(
    t.Union([
      t.Literal("development"),
      t.Literal("staging"),
      t.Literal("production"),
      t.Literal("test"),
    ])
  ),
  SERVER_PORT: t.Number(),
  DATABASE_URL: t.String(),
  JWT_SECRET: t.String(), // Fixed from JWT_SECRETS to JWT_SECRET
  JWT_EXPIRES_IN: t.Optional(t.String()), // Fixed from JWT_EXPIRED to JWT_EXPIRES_IN
});

const validate = ajv.compile(EnvModel);

// Create environment with defaults for testing
const envWithDefaults = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : "development",
  SERVER_PORT: process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 3000,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test",
  JWT_SECRET: process.env.JWT_SECRET || "test-jwt-secret-key-for-testing-only",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
};

const isValidEnv = validate(envWithDefaults);

if (isValidEnv === false && process.env.NODE_ENV !== "test") {
  throw new GlobalResponseError(500, "Internal", {
    server: "Invalid environment variables",
  });
}

type Env = typeof EnvModel.static;

const env = envWithDefaults as Env;

export default env;
