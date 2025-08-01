# Simple GitHub Setup for Chain of Custody System
Write-Host "Preparing Chain of Custody System for GitHub..." -ForegroundColor Green

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git is not installed. Please install Git first." -ForegroundColor Red
    Write-Host "Download from: https://git-scm.com/download/windows" -ForegroundColor Yellow
    exit 1
}

# Clean up temporary files
Write-Host "`nCleaning up temporary files..." -ForegroundColor Yellow

$filesToClean = @(
    "test-evidence",
    "demo-evidence", 
    "secure-storage",
    "sample-evidence",
    "custody-database.json",
    "audit-log.json",
    "manifest-*.json",
    "*-report.csv"
)

foreach ($pattern in $filesToClean) {
    if (Test-Path $pattern) {
        Remove-Item $pattern -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Removed: $pattern" -ForegroundColor Gray
    }
}

# Create uploads directory
if (!(Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" -Force | Out-Null
}

# Add .gitkeep to uploads directory
"# Keep this directory in Git" | Out-File -FilePath "uploads\.gitkeep" -Encoding UTF8

Write-Host "Cleanup complete" -ForegroundColor Green

# Test hash generator
Write-Host "`nTesting system..." -ForegroundColor Yellow
try {
    $testResult = node hash-utilities/manual-hash-generator.js text "GitHub test" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Hash generator working" -ForegroundColor Green
    } else {
        Write-Host "  Hash generator test failed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Could not test hash generator" -ForegroundColor Yellow
}

# Initialize Git if needed
if (!(Test-Path ".git")) {
    Write-Host "`nInitializing Git repository..." -ForegroundColor Cyan
    git init
    Write-Host "Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "`nGit repository already exists" -ForegroundColor Green
}

# Show next steps
Write-Host "`nYour project is ready for GitHub!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Go to GitHub and create a new repository" -ForegroundColor White
Write-Host "2. Repository name: Chain-of-Custody-file-movement" -ForegroundColor White
Write-Host "3. Run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "   git add ." -ForegroundColor Yellow
Write-Host "   git commit -m `"Initial commit: Complete Chain of Custody system`"" -ForegroundColor Yellow
Write-Host "   git remote add origin https://github.com/yashikart/Chain-of-Custody-file-movement.git" -ForegroundColor Yellow
Write-Host "   git branch -M main" -ForegroundColor Yellow
Write-Host "   git push -u origin main" -ForegroundColor Yellow

Write-Host "`nRepository URL will be:" -ForegroundColor Cyan
Write-Host "   https://github.com/yashikart/Chain-of-Custody-file-movement" -ForegroundColor Blue

Write-Host "`nSetup complete!" -ForegroundColor Green
