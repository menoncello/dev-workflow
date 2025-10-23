import { Elysia } from "elysia";
import { isFeatureEnabled, isPerformanceCritical } from "./config/feature-flags";
import { apmManager, apmPlugin } from "./utils/apm";
import { performancePlugin } from "./utils/performance";

// Defer expensive imports for faster startup
const lazyImports = {
  cors: () => import("@elysiajs/cors"),
  serverTiming: () => import("@elysiajs/server-timing"),
  swagger: () => import("@elysiajs/swagger"),
  env: () => import("#helpers/env"),
  preloadCriticalRoutes: () => import("./utils/lazy-routes"),
};

// Performance mode: skip timing for faster startup
if (!isPerformanceCritical()) {
  console.time("⌛ Startup Time");
}

// Create base app with conditional features (async for lazy loading)
const createApp = async () => {
  const app = new Elysia();

  // Add performance monitoring first
  app.use(performancePlugin as any);

  // Add APM monitoring
  app.use(apmPlugin as any);

  // Lazy load and conditionally add features
  if (isFeatureEnabled("cors")) {
    const { cors } = await lazyImports.cors();
    app.use(
      cors({
        origin: process.env.CORS_ORIGINS?.split(",") || [
          "http://localhost:3000",
          "http://localhost:5173",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      })
    );
  }

  if (isFeatureEnabled("swagger")) {
    const { swagger } = await lazyImports.swagger();
    app.use(
      swagger({
        documentation: {
          info: {
            title: "Dev Plugin API",
            version: "1.0.0",
          },
        },
      })
    );
  }

  if (isFeatureEnabled("serverTiming")) {
    const { serverTiming } = await lazyImports.serverTiming();
    app.use(serverTiming());
  }

  // Add APM metrics endpoint
  app.get("/api/v1/metrics", async ({ set }) => {
    const format =
      new URLSearchParams(new URL(set.headers?.["x-request-url"] || "").search).get("format") ||
      "json";

    try {
      const metrics = await apmManager.exportMetrics(format as "json" | "prometheus");
      set.headers["Content-Type"] = format === "json" ? "application/json" : "text/plain";
      return metrics;
    } catch (_error) {
      set.status = 500;
      return { error: "Failed to export metrics" };
    }
  });

  // Add APM health check endpoint
  app.get("/api/v1/health/detailed", async ({ set }) => {
    const health = apmManager.generateHealthCheck();

    if (health.healthy) {
      set.status = 200;
    } else {
      set.status = 503; // Service Unavailable
    }

    return health;
  });

  // Basic health endpoint (for load testing)
  app.get("/api/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // Root endpoint
  app.get("/", () => ({
    message: "Dev Plugin API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  }));

  // System status endpoint (for load testing)
  app.get("/api/v1/system/status", () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: "1.0.0",
  }));

  return app;
};

// Use lazy initialization to avoid top-level await
let _app: Elysia | null = null;
let _appPromise: Promise<Elysia> | null = null;

export const getApp = async (): Promise<Elysia> => {
  if (!_app) {
    if (!_appPromise) {
      _appPromise = createApp();
    }
    _app = await _appPromise;
  }
  return _app;
};

export const app = new Proxy({} as Elysia, {
  get(_target, prop) {
    if (!_app) {
      throw new Error("App not initialized. Call getApp() first.");
    }
    return _app[prop as keyof Elysia];
  },
  has(_target, prop) {
    return _app ? prop in _app : false;
  },
});

// Optimized route loading
const loadRoutes = async (app: Elysia) => {
  const groupApp = app.group("/api", (app) => {
    // Critical routes - load immediately
    if (isFeatureEnabled("lazyLoading")) {
      // Use lazy loading for better startup performance
      const lazyLoad = async (routePath: string) => {
        try {
          const module = await import(routePath);
          return module.default;
        } catch (error) {
          console.error(`Failed to load route: ${routePath}`, error);
          return (app: Elysia) => app; // Return no-op if loading fails
        }
      };

      // Load critical routes first
      Promise.all([
        lazyLoad("#routes/api/v1/system").then((route) => app.use(route)),
        lazyLoad("#routes/api/v1/agents").then((route) => app.use(route)),
      ]).catch(console.error);

      // Load remaining routes asynchronously
      if (isFeatureEnabled("auth")) {
        import("#modules/auth/routes")
          .then((module) => app.use(module.default))
          .catch(console.error);
      }
      import("#modules/me/routes").then((module) => app.use(module.default)).catch(console.error);
      import("#modules/user/routes").then((module) => app.use(module.default)).catch(console.error);
      import("#routes/api/v1/workflows")
        .then((module) => app.use(module.default))
        .catch(console.error);
      import("#routes/api/v1/tools").then((module) => app.use(module.default)).catch(console.error);
    } else {
      // Eager loading for backward compatibility
      import("#modules/user/routes").then((module) => app.use(module.default));
      if (isFeatureEnabled("auth")) {
        import("#modules/auth/routes").then((module) => app.use(module.default));
      }
      import("#modules/me/routes").then((module) => app.use(module.default));
      import("#routes/api/v1/agents").then((module) => app.use(module.default));
      import("#routes/api/v1/workflows").then((module) => app.use(module.default));
      import("#routes/api/v1/tools").then((module) => app.use(module.default));
      import("#routes/api/v1/system").then((module) => app.use(module.default));
    }

    return app.onError(({ error, ...ctx }) => {
      if (!isPerformanceCritical()) {
        console.log({ ctx, error: error.message });
      }
    });
  });

  return groupApp;
};

// Initialize routes
const initializeApp = async () => {
  const app = await getApp();

  if (isFeatureEnabled("lazyLoading")) {
    const lazyRoutesModule = await lazyImports.preloadCriticalRoutes();
    await lazyRoutesModule.preloadCriticalRoutes();
  }

  return loadRoutes(app);
};

// Initialize app in background for non-blocking startup
if (!isPerformanceCritical()) {
  initializeApp().catch(console.error);
} else {
  // In performance-critical mode, load routes synchronously
  // This is mainly for tests where we need predictable behavior
  const loadSync = async () => {
    const app = await getApp();
    const routes = [
      "#modules/user/routes",
      "#modules/auth/routes",
      "#modules/me/routes",
      "#routes/api/v1/agents",
      "#routes/api/v1/workflows",
      "#routes/api/v1/tools",
      "#routes/api/v1/system",
    ];

    for (const route of routes) {
      try {
        const module = await import(route);
        app.use(module.default);
      } catch (_error) {
        // Ignore missing routes in test mode
      }
    }

    app.onError(() => {
      // No-op error handler for test mode
    });
  };

  await loadSync();
}

// Start server only if this file is run directly
if (import.meta.main) {
  // Initialize app and start server
  const startServer = async () => {
    const app = await getApp();
    const { default: env } = await lazyImports.env();

    // Initialize routes if not already done
    if (!isPerformanceCritical()) {
      await initializeApp();
    }

    app.listen(env.SERVER_PORT, (server) => {
      if (!isPerformanceCritical()) {
        console.timeEnd("⌛ Startup Time");
      }
      console.log(`🌱 NODE_ENV: ${env.NODE_ENV || "development"}`);
      console.log(`🍙 Bun Version: ${Bun.version}`);
      console.log(`🦊 Elysia.js Version: ${require("elysia/package.json").version}`);
      console.log(`🗃️  Prisma Version: ${require("@prisma/client/package.json").version}`);
      console.log(`🚀 Server is running at ${server.url}`);
      console.log("--------------------------------------------------");
    });
  };

  startServer().catch(console.error);
}
