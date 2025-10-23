/**
 * Lazy route loading utilities
 */

import type Elysia from "elysia";
import { isFeatureEnabled } from "../config/feature-flags";

interface RouteModule {
  default: (app: Elysia) => Elysia;
}

// Cache for loaded modules
const moduleCache = new Map<string, RouteModule>();

const lazyLoadRoute = async (routePath: string): Promise<RouteModule> => {
  // Check cache first
  if (moduleCache.has(routePath)) {
    return moduleCache.get(routePath)!;
  }

  try {
    // Dynamic import for lazy loading
    const module = await import(routePath);
    moduleCache.set(routePath, module);
    return module;
  } catch (error) {
    console.error(`Failed to load route module: ${routePath}`, error);
    throw new Error(`Route loading failed: ${routePath}`);
  }
};

export const createLazyRouteLoader = (routePath: string) => {
  return async (app: Elysia): Promise<Elysia> => {
    if (!isFeatureEnabled("lazyLoading")) {
      // Eager loading for backward compatibility
      const module = await lazyLoadRoute(routePath);
      return module.default(app);
    }

    // Lazy loading - load only when first accessed
    let module: RouteModule | null = null;
    let isLoading = false;

    return app.derive(async () => {
      if (!module && !isLoading) {
        isLoading = true;
        try {
          module = await lazyLoadRoute(routePath);
          console.log(`🔗 Loaded route module: ${routePath}`);
        } catch (error) {
          console.error(`❌ Failed to load route: ${routePath}`, error);
          throw error;
        } finally {
          isLoading = false;
        }
      }

      // Wait for loading to complete
      if (isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      return {};
    });
  };
};

// Preload critical routes
export const preloadCriticalRoutes = async () => {
  const criticalRoutes = ["#routes/api/v1/system", "#routes/api/v1/agents"];

  if (isFeatureEnabled("auth")) {
    criticalRoutes.push("#modules/auth/routes");
  }

  console.log("🚀 Preloading critical routes...");

  const preloadPromises = criticalRoutes.map(async (route) => {
    try {
      await lazyLoadRoute(route);
      console.log(`✅ Preloaded: ${route}`);
    } catch (_error) {
      console.warn(`⚠️ Failed to preload: ${route}`);
    }
  });

  await Promise.allSettled(preloadPromises);
  console.log("✅ Route preloading complete");
};

export { lazyLoadRoute };
