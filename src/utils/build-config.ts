/**
 * Build configuration utilities - re-exported from build config
 */

import {
  getBuildConfig as getBuildConfigInternal,
  validateBuildConfig as validateBuildConfigInternal,
} from "../config/build";
import type { BuildConfig } from "../types/build";

export function getBuildConfig(environment: string): BuildConfig {
  return getBuildConfigInternal(environment);
}

export function validateBuildConfig(config: BuildConfig): { valid: boolean; errors: string[] } {
  try {
    validateBuildConfigInternal(config);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, errors: [error.message] };
    }
    return { valid: false, errors: ["Unknown validation error"] };
  }
}
