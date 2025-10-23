#!/bin/bash

# Database Migration Script for Dev Plugin
# Supports automated migration execution and rollback capabilities

set -e

# Default values
ENVIRONMENT=${1:-production}
ACTION=${2:-migrate}
FORCE=${3:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗃️  Database Migration Script${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Action: ${ACTION}${NC}"
echo ""

# Function to check if database is ready
check_database_ready() {
    local database_url=$1
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Checking database connectivity...${NC}"

    while [ $attempt -le $max_attempts ]; do
        if bun run db:check --database-url="$database_url" 2>/dev/null; then
            echo -e "${GREEN}✅ Database is ready${NC}"
            return 0
        fi

        echo -e "${YELLOW}Attempt ${attempt}/${max_attempts}: Database not ready, waiting...${NC}"
        sleep 2
        ((attempt++))
    done

    echo -e "${RED}❌ Database failed to become ready after ${max_attempts} attempts${NC}"
    return 1
}

# Function to create backup before migration
create_backup() {
    local environment=$1
    local backup_name="dev-plugin-backup-$(date +%Y%m%d-%H%M%S)"

    echo -e "${YELLOW}Creating database backup: ${backup_name}${NC}"

    case $environment in
        "production")
            if command -v pg_dump &> /dev/null; then
                pg_dump "$PRODUCTION_DATABASE_URL" > "backups/${backup_name}.sql"
                echo -e "${GREEN}✅ Backup created: backups/${backup_name}.sql${NC}"
            else
                echo -e "${YELLOW}⚠️  pg_dump not found, skipping backup${NC}"
            fi
            ;;
        "staging")
            if command -v pg_dump &> /dev/null; then
                pg_dump "$STAGING_DATABASE_URL" > "backups/${backup_name}.sql"
                echo -e "${GREEN}✅ Backup created: backups/${backup_name}.sql${NC}"
            else
                echo -e "${YELLOW}⚠️  pg_dump not found, skipping backup${NC}"
            fi
            ;;
        "development")
            if command -v pg_dump &> /dev/null; then
                pg_dump "$DATABASE_URL" > "backups/${backup_name}.sql"
                echo -e "${GREEN}✅ Backup created: backups/${backup_name}.sql${NC}"
            else
                echo -e "${YELLOW}⚠️  pg_dump not found, skipping backup${NC}"
            fi
            ;;
    esac
}

# Function to restore from backup
restore_backup() {
    local backup_file=$1
    local environment=$2

    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Backup file not found: $backup_file${NC}"
        return 1
    fi

    echo -e "${YELLOW}Restoring from backup: $backup_file${NC}"

    case $environment in
        "production")
            psql "$PRODUCTION_DATABASE_URL" < "$backup_file"
            ;;
        "staging")
            psql "$STAGING_DATABASE_URL" < "$backup_file"
            ;;
        "development")
            psql "$DATABASE_URL" < "$backup_file"
            ;;
    esac

    echo -e "${GREEN}✅ Database restored from backup${NC}"
}

# Function to run migrations
run_migrations() {
    local environment=$1
    local database_url=$2

    echo -e "${YELLOW}Running database migrations for ${environment}...${NC}"

    # Check if database is ready
    check_database_ready "$database_url"

    # Generate Prisma client
    echo -e "${YELLOW}Generating Prisma client...${NC}"
    bun run db:generate

    # Push database schema (for development and staging)
    if [ "$environment" = "development" ] || [ "$environment" = "staging" ]; then
        echo -e "${YELLOW}Applying database schema changes...${NC}"
        bun run db:push
    else
        # For production, we expect migrations to be applied manually or through CI/CD
        echo -e "${YELLOW}Running database migrations...${NC}"
        bun run db:migrate
    fi

    echo -e "${GREEN}✅ Migrations completed successfully${NC}"
}

# Function to rollback migrations
rollback_migrations() {
    local environment=$1
    local database_url=$2

    if [ "$FORCE" != "true" ]; then
        echo -e "${RED}❌ Rollback requires --force flag for safety${NC}"
        echo -e "${YELLOW}Usage: $0 $ENVIRONMENT rollback --force${NC}"
        return 1
    fi

    echo -e "${RED}🚨 Rolling back database migrations for ${environment}...${NC}"

    # Create backup before rollback
    create_backup "$environment"

    # Reset database (this is a destructive operation)
    echo -e "${YELLOW}Resetting database to previous state...${NC}"
    bun run db:reset --force

    echo -e "${GREEN}✅ Database rollback completed${NC}"
}

# Function to migrate from Docker
migrate_from_docker() {
    local environment=$1
    local compose_project="dev-plugin-${environment}"

    echo -e "${YELLOW}Running migrations via Docker Compose...${NC}"

    # Start database service only
    docker-compose --project-name "$compose_project" up -d postgres

    # Wait for database to be ready
    sleep 10

    # Run migrations in a temporary container
    docker-compose --project-name "$compose_project" run --rm \
        -e DATABASE_URL="postgresql://$(docker-compose --project-name "$compose_project" exec -T postgres printenv POSTGRES_USER):$(docker-compose --project-name "$compose_project" exec -T postgres printenv POSTGRES_PASSWORD)@postgres:5432/$(docker-compose --project-name "$compose_project" exec -T postgres printenv POSTGRES_DB)" \
        app \
        bun run db:migrate

    echo -e "${GREEN}✅ Docker migrations completed${NC}"
}

# Main execution logic
case $ACTION in
    "migrate"|"up")
        echo -e "${BLUE}🚀 Starting migration process...${NC}"

        # Create backups directory if it doesn't exist
        mkdir -p backups

        case $ENVIRONMENT in
            "production")
                create_backup "$ENVIRONMENT"
                run_migrations "$ENVIRONMENT" "$PRODUCTION_DATABASE_URL"
                ;;
            "staging")
                create_backup "$ENVIRONMENT"
                run_migrations "$ENVIRONMENT" "$STAGING_DATABASE_URL"
                ;;
            "development"|"dev")
                run_migrations "$ENVIRONMENT" "$DATABASE_URL"
                ;;
            "docker")
                migrate_from_docker "$ENVIRONMENT"
                ;;
            *)
                echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
                echo -e "${YELLOW}Valid environments: production, staging, development, docker${NC}"
                exit 1
                ;;
        esac
        ;;

    "rollback"|"down")
        echo -e "${RED}⚠️  Starting rollback process...${NC}"

        case $ENVIRONMENT in
            "production")
                rollback_migrations "$ENVIRONMENT" "$PRODUCTION_DATABASE_URL"
                ;;
            "staging")
                rollback_migrations "$ENVIRONMENT" "$STAGING_DATABASE_URL"
                ;;
            "development"|"dev")
                rollback_migrations "$ENVIRONMENT" "$DATABASE_URL"
                ;;
            *)
                echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
                exit 1
                ;;
        esac
        ;;

    "status")
        echo -e "${BLUE}📊 Migration status check...${NC}"

        case $ENVIRONMENT in
            "production")
                bun run db:status --database-url="$PRODUCTION_DATABASE_URL"
                ;;
            "staging")
                bun run db:status --database-url="$STAGING_DATABASE_URL"
                ;;
            "development"|"dev")
                bun run db:status
                ;;
        esac
        ;;

    "backup")
        echo -e "${YELLOW}📦 Creating database backup...${NC}"
        create_backup "$ENVIRONMENT"
        ;;

    "restore")
        if [ -z "$3" ]; then
            echo -e "${RED}❌ Backup file required for restore${NC}"
            echo -e "${YELLOW}Usage: $0 $ENVIRONMENT restore <backup-file>${NC}"
            exit 1
        fi
        restore_backup "$3" "$ENVIRONMENT"
        ;;

    *)
        echo -e "${RED}❌ Invalid action: $ACTION${NC}"
        echo -e "${YELLOW}Valid actions: migrate, rollback, status, backup, restore${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Migration script completed successfully!${NC}"