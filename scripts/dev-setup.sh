#!/bin/bash

# Development Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Setting up dev-plugin development environment..."

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun is installed: $(bun --version)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Install Docker for PostgreSQL and Redis support."
    echo "   Visit: https://docs.docker.com/get-docker/"
else
    echo "✅ Docker is installed: $(docker --version)"
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please review and update if needed."
else
    echo "✅ .env file already exists"
fi

# Check if Docker services are running
if command -v docker-compose &> /dev/null; then
    echo "🐳 Checking Docker services..."
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        echo "✅ Some Docker services are already running"
    else
        echo "🚀 Starting Docker services (PostgreSQL, Redis, Adminer)..."
        docker-compose -f docker-compose.dev.yml up -d
        echo "✅ Docker services started"
        echo "   - PostgreSQL: localhost:5432"
        echo "   - Redis: localhost:6379"
        echo "   - Adminer: http://localhost:8080"
        echo "   - Redis Commander: http://localhost:8081"
    fi
fi

# Run type checking
echo "🔍 Running TypeScript type checking..."
if bun run typecheck; then
    echo "✅ TypeScript type checking passed"
else
    echo "❌ TypeScript type checking failed"
    exit 1
fi

# Run linting
echo "🧹 Running code quality checks..."
if bun run lint:check; then
    echo "✅ Code quality checks passed"
else
    echo "❌ Code quality checks failed"
    exit 1
fi

# Run tests
echo "🧪 Running tests..."
if bun test; then
    echo "✅ All tests passed"
else
    echo "❌ Some tests failed"
    exit 1
fi

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review .env file and update as needed"
echo "  2. Start development server: bun run dev"
echo "  3. Open API docs: http://localhost:3000/swagger"
echo "  4. Check README.dev.md for detailed development guide"
echo ""
echo "Useful commands:"
echo "  bun run dev          - Start development server"
echo "  bun run dev:debug    - Start with debugging enabled"
echo "  bun test             - Run tests"
echo "  bun run typecheck    - Type checking only"
echo "  bun run lint         - Fix code style issues"
echo "  bun run pre-commit   - Run all quality checks"