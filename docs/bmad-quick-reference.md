# BMAD Quick Reference Guide

## Story Development Workflow

### 1. Story Creation
```bash
/bmad:bmm:agents:sm
*create-story              # Create new story from epic
```

### 2. Story Implementation
```bash
/bmad:bmm:agents:dev
*develop                  # Implement story (quality gates enforced automatically)
```

### 3. Quality Validation
```bash
/bmad:bmm:agents:tea
*test-review              # Review test quality (if needed)

/bmad:bmm:agents:dev
*review                   # Senior developer review
```

### 4. Story Completion
```bash
/bmad:bmm:agents:dev
*story-approved            # Mark story complete and advance queue
```

## Quality Gates (MANDATORY)

This project enforces zero-tolerance quality standards:

- **TypeScript**: 0 compilation errors (bun run typecheck)
- **Biome**: 0 linting errors (bun run lint:check)
- **Tests**: 100% pass rate (bun test)
- **Security**: 0 vulnerabilities (npm audit)
- **Formatting**: 100% Biome compliance (bun run format:check)

**No exceptions allowed**: Never use biome-disable, @ts-ignore, or @ts-expect-error

## Technology Stack

- **Runtime**: Bun (latest)
- **Framework**: Elysia (latest)
- **Database**: Prisma + PostgreSQL
- **Testing**: Bun Test (built-in)
- **Quality**: Biome (linting + formatting)
- **Authentication**: JWT + OAuth
- **Real-time**: WebSocket + Redis

## Development Commands

```bash
# Development
bun run dev                 # Start with hot-reload
bun run dev:debug          # Start with debugging
bun run dev:hot             # Start with hot module replacement

# Quality Gates
bun run typecheck          # TypeScript compilation check
bun run lint:check         # Biome linting validation
bun run format:check       # Biome formatting check
bun test                   # Run all tests
bun run test:coverage      # Test coverage report

# Build
bun run build:dev          # Development build
bun run build:staging      # Staging build
bun run build:prod         # Production build

# Database
bun run db:generate        # Generate Prisma client
bun run db:migrate         # Run database migrations
bun run db:studio          # Open Prisma Studio
```

## Tips

- **Quality First**: All quality gates are mandatory - no exceptions
- **Fix Issues**: When quality gates fail, fix the underlying code (never disable rules)
- **Test Coverage**: Write tests that cover all acceptance criteria
- **Code Examples**: All examples in stories must compile and pass quality gates
- **Security First**: Always run security audit before deployment