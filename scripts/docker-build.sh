#!/bin/bash

# Docker Build Script for Dev Plugin
# Supports multi-stage builds with proper tagging and versioning

set -e

# Default values
ENVIRONMENT=${1:-production}
VERSION=${2:-$(git describe --tags --always --dirty 2>/dev/null || echo "latest")}
REGISTRY=${DOCKER_REGISTRY:-"localhost:5000"}
IMAGE_NAME="dev-plugin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Building Docker image for ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}Version: ${VERSION}${NC}"
echo -e "${YELLOW}Registry: ${REGISTRY}${NC}"
echo ""

# Function to build Docker image
build_image() {
    local target=$1
    local tag_suffix=$2

    echo -e "${GREEN}Building ${target} stage...${NC}"

    docker build \
        --target ${target} \
        --build-arg BUILD_VERSION=${VERSION} \
        --build-arg BUILD_ENV=${ENVIRONMENT} \
        --build-arg BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
        --tag ${REGISTRY}/${IMAGE_NAME}:${VERSION}${tag_suffix} \
        --tag ${REGISTRY}/${IMAGE_NAME}:latest${tag_suffix} \
        .

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully built ${target} image${NC}"
    else
        echo -e "${RED}❌ Failed to build ${target} image${NC}"
        exit 1
    fi
}

# Function to run security scan
run_security_scan() {
    local image_tag=$1
    echo -e "${GREEN}🔒 Running security scan on ${image_tag}${NC}"

    if command -v trivy &> /dev/null; then
        trivy image --exit-code 1 --severity HIGH,CRITICAL ${REGISTRY}/${IMAGE_NAME}:${image_tag}
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Security scan passed${NC}"
        else
            echo -e "${RED}❌ Security scan found vulnerabilities${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Trivy not found, skipping security scan${NC}"
    fi
}

# Main build logic
case $ENVIRONMENT in
    "development"|"dev")
        echo -e "${YELLOW}Building for development environment${NC}"
        build_image "development" "-dev"
        run_security_scan "${VERSION}-dev"
        ;;
    "staging")
        echo -e "${YELLOW}Building for staging environment${NC}"
        build_image "staging" "-staging"
        run_security_scan "${VERSION}-staging"
        ;;
    "production"|"prod")
        echo -e "${YELLOW}Building for production environment${NC}"
        build_image "production" ""
        run_security_scan "${VERSION}"
        ;;
    "all")
        echo -e "${YELLOW}Building all environments${NC}"
        build_image "development" "-dev"
        build_image "staging" "-staging"
        build_image "production" ""

        echo -e "${GREEN}🔒 Running security scans on all images${NC}"
        run_security_scan "${VERSION}-dev"
        run_security_scan "${VERSION}-staging"
        run_security_scan "${VERSION}"
        ;;
    *)
        echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
        echo -e "${YELLOW}Valid environments: development|dev, staging, production|prod, all${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Docker build completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Built images:${NC}"
if [ "$ENVIRONMENT" = "all" ] || [ "$ENVIRONMENT" = "development" ] || [ "$ENVIRONMENT" = "dev" ]; then
    echo "  - ${REGISTRY}/${IMAGE_NAME}:${VERSION}-dev"
    echo "  - ${REGISTRY}/${IMAGE_NAME}:latest-dev"
fi
if [ "$ENVIRONMENT" = "all" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo "  - ${REGISTRY}/${IMAGE_NAME}:${VERSION}-staging"
    echo "  - ${REGISTRY}/${IMAGE_NAME}:latest-staging"
fi
if [ "$ENVIRONMENT" = "all" ] || [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "prod" ]; then
    echo "  - ${REGISTRY}/${IMAGE_NAME}:${VERSION}"
    echo "  - ${REGISTRY}/${IMAGE_NAME}:latest"
fi

echo ""
echo -e "${YELLOW}To run the container:${NC}"
if [ "$ENVIRONMENT" = "development" ] || [ "$ENVIRONMENT" = "dev" ]; then
    echo "  docker run -p 3000:3000 ${REGISTRY}/${IMAGE_NAME}:${VERSION}-dev"
elif [ "$ENVIRONMENT" = "staging" ]; then
    echo "  docker run -p 3000:3000 ${REGISTRY}/${IMAGE_NAME}:${VERSION}-staging"
elif [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "prod" ]; then
    echo "  docker run -p 3000:3000 ${REGISTRY}/${IMAGE_NAME}:${VERSION}"
fi