# Multi-stage Dockerfile for Dev Plugin
# Supports development, staging, and production builds with optimized layer caching

# Base stage - Common dependencies
FROM oven/bun:1.1.33-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package.json bun.lockb ./

# Dependencies stage - Cache node modules
FROM base AS dependencies
RUN bun install

# Development stage
FROM base AS development
RUN bun install
COPY . .

# Generate Prisma client for development
RUN bun run db:generate

# Expose port and set environment
ENV NODE_ENV=development
ENV SERVER_PORT=3000
EXPOSE 3000

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun --print "fetch('http://localhost:3000/api/health').then(r=>r.json()).then(j=>process.exit(j.status==='ok'?0:1))" || exit 1

# Development startup command
CMD ["bun", "run", "dev"]

# Build stage - Shared for staging and production
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN bun run db:generate

# Build arguments for versioning
ARG BUILD_VERSION=1.0.0
ARG BUILD_ENV=production
ARG BUILD_TIMESTAMP

# Set build info
ENV APP_VERSION=${BUILD_VERSION}
ENV APP_BUILD_ENV=${BUILD_ENV}
# Build timestamp will be set at build time

# Staging build
FROM build AS staging-build
RUN bun run build:staging

# Production build
FROM build AS production-build
RUN bun run build:prod

# Production runtime stage
FROM base AS production
# Use existing bun user/group or create if needed
RUN addgroup --system --gid 1001 bun 2>/dev/null || true \
    && adduser --system --uid 1001 bun 2>/dev/null || adduser --system --uid 1001 --ingroup bun bun || true

# Copy optimized production build
COPY --from=production-build --chown=bun:bun /app/build ./build
COPY --from=production-build --chown=bun:bun /app/node_modules ./node_modules
COPY --from=production-build --chown=bun:bun /app/package.json ./package.json
COPY --from=production-build --chown=bun:bun /app/prisma ./prisma

# Production environment
ENV NODE_ENV=production
ENV SERVER_PORT=3000
EXPOSE 3000

# Switch to non-root user
USER bun

# Health check for production (more thorough)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun --print "fetch('http://localhost:3000/api/v1/health/detailed').then(r=>r.json()).then(j=>process.exit(j.healthy?0:1))" || exit 1

# Production startup command
CMD ["bun", "run", "start"]

# Staging runtime stage (similar to production but with staging-specific config)
FROM base AS staging
# Use existing bun user/group or create if needed
RUN addgroup --system --gid 1001 bun 2>/dev/null || true \
    && adduser --system --uid 1001 bun 2>/dev/null || adduser --system --uid 1001 --ingroup bun bun || true

# Copy staging build
COPY --from=staging-build --chown=bun:bun /app/build ./build
COPY --from=staging-build --chown=bun:bun /app/node_modules ./node_modules
COPY --from=staging-build --chown=bun:bun /app/package.json ./package.json
COPY --from=staging-build --chown=bun:bun /app/prisma ./prisma

# Staging environment
ENV NODE_ENV=staging
ENV SERVER_PORT=3000
EXPOSE 3000

# Switch to non-root user
USER bun

# Health check for staging
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun --print "fetch('http://localhost:3000/api/v1/health/detailed').then(r=>r.json()).then(j=>process.exit(j.healthy?0:1))" || exit 1

# Staging startup command
CMD ["bun", "run", "start:staging"]