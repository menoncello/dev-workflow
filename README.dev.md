# Development Guide

This guide helps you set up and work with the dev-plugin project in development mode.

## Quick Start

### Prerequisites

- **Bun** 1.1+ - JavaScript runtime and package manager
- **Docker** & **Docker Compose** - For local development services
- **PostgreSQL** 16+ - Database (can run via Docker)
- **Redis** 7+ - Cache (can run via Docker)

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd dev-plugin
   bun install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development services:**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose -f docker-compose.dev.yml up -d

   # Run database migrations (when ready)
   bun run db:migrate
   ```

4. **Start the development server:**
   ```bash
   bun run dev
   ```

   The server will be available at `http://localhost:3000`

5. **Access development tools:**
   - **API Documentation**: `http://localhost:3000/swagger`
   - **Database Admin**: `http://localhost:8080` (Adminer)
   - **Redis Commander**: `http://localhost:8081`

## Development Scripts

### Core Development
- `bun run dev` - Start development server with hot reload
- `bun run dev:debug` - Start with Node.js inspector for debugging
- `bun run dev:hot` - Start with hot module replacement

### Building and Quality
- `bun run build` - Production build with minification
- `bun run build:dev` - Development build with source maps
- `bun run typecheck` - TypeScript type checking
- `bun run lint` - Run Biome linter and fix issues
- `bun run format` - Format code with Biome

### Testing
- `bun test` - Run all tests
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Run tests with coverage report

### Database
- `bun run db:generate` - Generate Prisma client
- `bun run db:migrate` - Run database migrations
- `bun run db:push` - Push schema to database
- `bun run db:studio` - Open Prisma Studio

### Utilities
- `bun run clean` - Clean build artifacts and cache
- `bun run pre-commit` - Run pre-commit checks (typecheck, lint, format, test)

## Debugging

### VS Code Debugging

The project includes VS Code debugging configurations:

1. **Debug Dev Server**: Launch the development server with Node.js inspector
2. **Debug Tests**: Run tests in debug mode
3. **Run Current Test File**: Debug the currently open test file

Set breakpoints in your code and use the Run and Debug panel (F5) in VS Code.

### Browser Debugging

The development server includes source maps, so you can:

1. Open browser DevTools (F12)
2. Go to Sources tab
3. Find your TypeScript files under `src://`
4. Set breakpoints and debug directly in TypeScript

## Environment Variables

Key environment variables for development:

```bash
# Server
SERVER_PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://devuser:devpass@localhost:5432/devplugin?schema=public"

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Development Features
LOG_LEVEL=debug
ENABLE_SWAGGER=true
ENABLE_CORS=true
```

See `.env.example` for all available options.

## Code Quality

This project uses:

- **Biome** - For linting, formatting, and import sorting
- **TypeScript** - With strict type checking enabled
- **ESLint rules** - Never disabled with inline comments

### Pre-commit Hooks

The `pre-commit` script runs:
1. TypeScript type checking
2. Linting checks
3. Code formatting verification
4. All tests

All checks must pass before committing code.

## Project Structure

```
src/
├── config/           # Environment configuration
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── services/         # Business logic services
├── routes/           # API route handlers
│   └── api/v1/       # RESTful API endpoints
├── modules/          # Feature modules (existing)
├── plugins/          # Elysia plugins (existing)
├── middleware/       # Request middleware (existing)
└── index.ts          # Application entry point
```

## Hot Reload

The development server automatically reloads when you:

- Modify TypeScript files in `src/`
- Change environment variables
- Update configuration files

The server maintains state during hot reload where possible.

## Common Issues

### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.dev.yml ps postgres

# Restart database
docker-compose -f docker-compose.dev.yml restart postgres
```

### Type Errors After Hot Reload
Sometimes hot reload can cause type caching issues. Run:
```bash
bun run clean
bun run dev
```

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new features
3. Ensure all pre-commit checks pass
4. Use meaningful commit messages
5. Update documentation when needed

## Getting Help

- Check the **API Documentation** at `http://localhost:3000/swagger`
- Review **error logs** in the development server output
- Use **debugger breakpoints** to inspect code execution
- Consult the **project documentation** in the `docs/` folder