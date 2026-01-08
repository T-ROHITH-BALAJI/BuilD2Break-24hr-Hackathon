#!/bin/bash

# Build Phase 2 - Production Build Script
# This script prepares the application for production deployment

set -e  # Exit on error

echo "========================================="
echo "Job Portal - Build Phase 2"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check prerequisites
echo "Step 1: Checking prerequisites..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_success "Node.js is installed: $(node --version)"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm is installed: $(npm --version)"

if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL client not found - database checks will be skipped"
else
    print_success "PostgreSQL client is available"
fi

echo ""

# Check for .env file in backend
echo "Step 2: Checking environment configuration..."
if [ ! -f "backend/.env" ]; then
    print_error "backend/.env file not found!"
    print_info "Please copy backend/.env.example to backend/.env and configure it"
    exit 1
fi
print_success "Backend .env file exists"

# Validate critical environment variables
source backend/.env 2>/dev/null || true
if [ -z "$JWT_SECRET" ]; then
    print_error "JWT_SECRET is not set in .env"
    exit 1
fi
if [ ${#JWT_SECRET} -lt 32 ]; then
    print_error "JWT_SECRET is too short (minimum 32 characters required)"
    exit 1
fi
print_success "Environment variables validated"

echo ""

# Security audit
echo "Step 3: Running security audits..."
echo "Backend security audit..."
cd backend
npm audit --production || print_warning "Backend has some vulnerabilities - review with 'npm audit'"
cd ..

echo "Frontend security audit..."
cd Frontend
npm audit --production || print_warning "Frontend has some vulnerabilities - review with 'npm audit'"
cd ..

print_success "Security audits completed"
echo ""

# Install dependencies
echo "Step 4: Installing dependencies..."
echo "Installing backend dependencies..."
cd backend
npm ci --production=false
cd ..
print_success "Backend dependencies installed"

echo "Installing frontend dependencies..."
cd Frontend
npm ci --production=false
cd ..
print_success "Frontend dependencies installed"

echo ""

# Lint frontend
echo "Step 5: Linting code..."
cd Frontend
npm run lint || print_warning "Frontend linting found issues"
cd ..
print_success "Linting completed"

echo ""

# Build frontend
echo "Step 6: Building frontend for production..."
cd Frontend
NODE_ENV=production npm run build
cd ..
print_success "Frontend build completed - output in Frontend/dist/"

echo ""

# Database migration check
echo "Step 7: Checking database migrations..."
if [ -f "backend/.env" ]; then
    print_info "Make sure to run all migrations before deploying:"
    print_info "  - schema.sql"
    print_info "  - backend/migration_*.sql"
fi

echo ""

# Final checks
echo "Step 8: Final validation..."
if [ ! -d "Frontend/dist" ]; then
    print_error "Frontend build directory not found"
    exit 1
fi
print_success "Frontend build artifacts verified"

if [ ! -f "backend/server.js" ]; then
    print_error "Backend server.js not found"
    exit 1
fi
print_success "Backend files verified"

echo ""
echo "========================================="
print_success "Build Phase 2 completed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Review security audit results"
echo "2. Configure production environment variables"
echo "3. Run database migrations"
echo "4. Deploy frontend (Frontend/dist) to web server"
echo "5. Deploy backend to Node.js server"
echo "6. Configure reverse proxy (nginx/Apache)"
echo "7. Set up SSL/TLS certificates"
echo "8. Configure monitoring and logging"
echo ""
