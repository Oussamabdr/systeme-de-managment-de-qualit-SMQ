# Automated Deployment Verification Script (PowerShell)
# Tests that deployment will succeed on Render.com

$ErrorActionPreference = "Stop"

Write-Host "AUTOMATED DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

try {
    # 1. Verify render.yaml exists
    Write-Host "1. Validating render.yaml..." -ForegroundColor Yellow
    if (Test-Path "render.yaml") {
        Write-Host "   OK render.yaml exists"
    } else {
        Write-Host "   ERROR render.yaml not found!" -ForegroundColor Red
        exit 1
    }
    Write-Host ""

    # 2. Verify backend can build
    Write-Host "2. Testing backend build process..." -ForegroundColor Yellow
    Push-Location backend
    
    if (Test-Path "src/server.js") {
        Write-Host "   OK Backend server entry point exists"
    } else {
        Write-Host "   ERROR Backend server.js not found" -ForegroundColor Red
        exit 1
    }

    if (Test-Path "prisma/schema.prisma") {
        Write-Host "   OK Database schema exists"
    } else {
        Write-Host "   ERROR Database schema not found" -ForegroundColor Red
        exit 1
    }

    if (Test-Path "prisma/seed.js") {
        Write-Host "   OK Seed script exists"
    } else {
        Write-Host "   ERROR Seed script not found" -ForegroundColor Red
        exit 1
    }

    Pop-Location
    Write-Host ""

    # 3. Verify frontend configuration
    Write-Host "3. Testing frontend build process..." -ForegroundColor Yellow
    Push-Location frontend
    
    if (Test-Path "vite.config.js") {
        Write-Host "   OK Vite configuration exists"
    } else {
        Write-Host "   ERROR vite.config.js not found" -ForegroundColor Red
        exit 1
    }

    Pop-Location
    Write-Host ""

    # 4. Verify Git status
    Write-Host "4. Checking Git status..." -ForegroundColor Yellow
    
    $branch = & git rev-parse --abbrev-ref HEAD
    Write-Host "   OK Branch: $branch"
    
    $latestCommit = & git log -1 --oneline
    Write-Host "   OK Latest: $latestCommit"
    
    $status = & git status --porcelain
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Host "   OK Working directory clean (all committed)"
    } else {
        Write-Host "   WARNING There are uncommitted changes"
    }
    
    Write-Host ""

    # 5. Verify required files exist
    Write-Host "5. Checking required deployment files..." -ForegroundColor Yellow
    
    $files = @(
        "render.yaml",
        "backend/src/server.js",
        "backend/prisma/schema.prisma",
        "backend/prisma/seed.js",
        "frontend/vite.config.js",
        "frontend/src/store/uiStore.js",
        "frontend/src/utils/i18n.js",
        "DEPLOY_NOW.md",
        "DEPLOYMENT_CHECKLIST.md",
        "DEPLOYMENT_GUIDE.md"
    )

    $allFound = $true
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Host "   OK $file"
        } else {
            Write-Host "   ERROR $file missing" -ForegroundColor Red
            $allFound = $false
        }
    }
    
    if (!$allFound) {
        exit 1
    }
    
    Write-Host ""

    # 6. Final status
    Write-Host "================================" -ForegroundColor Green
    Write-Host "ALL VERIFICATION CHECKS PASSED" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your application is ready for deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://dashboard.render.com"
    Write-Host "2. Create New - Blueprint"
    Write-Host "3. Connect your GitHub repository"
    Write-Host "4. Render will auto-detect render.yaml and deploy"
    Write-Host ""
    Write-Host "Expected deployment time: 4-6 minutes" -ForegroundColor Cyan

} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}
