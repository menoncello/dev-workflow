/**
 * Feature flags for conditional loading
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

export const features = {
  // Core features (always enabled)
  cors: process.env.ENABLE_CORS !== "false",

  // Development features
  swagger: isDevelopment && process.env.ENABLE_SWAGGER !== "false",
  serverTiming: isDevelopment && process.env.ENABLE_SERVER_TIMING !== "false",
  hotReload: isDevelopment,

  // Production optimizations
  compression: isProduction,
  caching: isProduction,

  // Optional features
  metrics: process.env.ENABLE_METRICS === "true",
  logging: process.env.ENABLE_LOGGING !== "false",

  // Database features
  database: process.env.ENABLE_DATABASE !== "false",
  auth: process.env.ENABLE_AUTH !== "false",

  // Performance features
  lazyLoading: process.env.ENABLE_LAZY_LOADING !== "false",
  codeSplitting: process.env.ENABLE_CODE_SPLITTING === "true",
} as const;

export type FeatureName = keyof typeof features;

export const isFeatureEnabled = (feature: FeatureName): boolean => {
  return features[feature];
};

// Performance optimization: skip expensive operations in test mode
export const isPerformanceCritical = (): boolean => {
  return isTest || process.env.PERFORMANCE_MODE === "critical";
};
