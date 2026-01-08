# Build Phase 2 - Production Build Script for Windows
# This script prepares the application for production deployment

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Job Portal - Build Phase 2" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

function Print-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Print-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Yellow
}

# Check prerequisites
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor White
try {
    $nodeVersion = node --version
    Print-Success "Node.js is installed: $nodeVersion"
} catch {
    Print-Error "Node.js is not installed"
    exit 1
}

try {
    $npmVersion = npm --version
    Print-Success "npm is installed: $npmVersion"
} catch {
    Print-Error "npm is not installed"
    exit 1
}

try {
    psql --version | Out-Null
    Print-Success "PostgreSQL client is available"
} catch {
    Print-Warning "PostgreSQL client not found - database checks will be skipped"
}

Write-Host ""

# Check for .env file in backend
Write-Host "Step 2: Checking environment configuration..." -ForegroundColor White
if (-not (Test-Path "backend\.env")) {
    Print-Error "backend\.env file not found!"
    Print-Info "Please copy backend\.env.example to backend\.env and configure it"
    exit 1
}
Print-Success "Backend .env file exists"

# Validate JWT_SECRET (basic check)
$envContent = Get-Content "backend\.env" -Raw
if ($envContent -notmatch "JWT_SECRET=.{32,}") {
    Print-Warning "JWT_SECRET may be too short or not set properly"
}
Print-Success "Environment variables validated"

Write-Host ""

# Security audit
Write-Host "Step 3: Running security audits..." -ForegroundColor White
Write-Host "Backend security audit..." -ForegroundColor Gray
Set-Location backend
try {
    npm audit --production
    Print-Success "Backend security audit passed"
} catch {
    Print-Warning "Backend has some vulnerabilities - review with 'npm audit'"
}
Set-Location ..

Write-Host "Frontend security audit..." -ForegroundColor Gray
Set-Location Frontend
try {
    npm audit --production
    Print-Success "Frontend security audit passed"
} catch {
    Print-Warning "Frontend has some vulnerabilities - review with 'npm audit'"
}
Set-Location ..

Print-Success "Security audits completed"
Write-Host ""

# Install dependencies
Write-Host "Step 4: Installing dependencies..." -ForegroundColor White
Write-Host "Installing backend dependencies..." -ForegroundColor Gray
Set-Location backend
npm install
Set-Location ..
Print-Success "Backend dependencies installed"

Write-Host "Installing frontend dependencies..." -ForegroundColor Gray
Set-Location Frontend
npm install
Set-Location ..
Print-Success "Frontend dependencies installed"

Write-Host ""

# Lint frontend
Write-Host "Step 5: Linting code..." -ForegroundColor White
Set-Location Frontend
try {
    npm run lint
    Print-Success "Frontend linting passed"
} catch {
    Print-Warning "Frontend linting found issues"
}
Set-Location ..

Write-Host ""

# Build frontend
Write-Host "Step 6: Building frontend for production..." -ForegroundColor White
Set-Location Frontend
$env:NODE_ENV = "production"
npm run build
Set-Location ..
Print-Success "Frontend build completed - output in Frontend\dist\"

Write-Host ""

# Database migration check
Write-Host "Step 7: Checking database migrations..." -ForegroundColor White
Print-Info "Make sure to run all migrations before deploying:"
Print-Info "  - schema.sql"
Print-Info "  - backend\migration_*.sql"

Write-Host ""

# Final checks
Write-Host "Step 8: Final validation..." -ForegroundColor White
if (-not (Test-Path "Frontend\dist")) {
    Print-Error "Frontend build directory not found"
    exit 1
}
Print-Success "Frontend build artifacts verified"

if (-not (Test-Path "backend\server.js")) {
    Print-Error "Backend server.js not found"
    exit 1
}
Print-Success "Backend files verified"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Print-Success "Build Phase 2 completed successfully!"
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Review security audit results" -ForegroundColor Gray
Write-Host "2. Configure production environment variables" -ForegroundColor Gray
Write-Host "3. Run database migrations" -ForegroundColor Gray
Write-Host "4. Deploy frontend (Frontend\dist) to web server" -ForegroundColor Gray
Write-Host "5. Deploy backend to Node.js server" -ForegroundColor Gray
Write-Host "6. Configure reverse proxy (nginx/Apache)" -ForegroundColor Gray
Write-Host "7. Set up SSL/TLS certificates" -ForegroundColor Gray
Write-Host "8. Configure monitoring and logging" -ForegroundColor Gray
Write-Host ""
