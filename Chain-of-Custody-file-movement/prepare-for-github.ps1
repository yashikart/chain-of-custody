# Prepare Chain of Custody System for GitHub
Write-Host "🚀 Preparing Chain of Custody System for GitHub..." -ForegroundColor Green

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed. Please install Git first." -ForegroundColor Red
    Write-Host "Download from: https://git-scm.com/download/windows" -ForegroundColor Yellow
    exit 1
}

# Clean up any temporary files
Write-Host "`n🧹 Cleaning up temporary files..." -ForegroundColor Yellow

# Remove demo files if they exist
$filesToClean = @(
    "test-evidence",
    "demo-evidence", 
    "secure-storage",
    "sample-evidence",
    "test*.txt",
    "custody-database.json",
    "audit-log.json",
    "manifest-*.json",
    "*-report.csv",
    "*.tmp"
)

foreach ($pattern in $filesToClean) {
    if (Test-Path $pattern) {
        Remove-Item $pattern -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Removed: $pattern" -ForegroundColor Gray
    }
}

# Create uploads directory but keep it empty
if (!(Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" -Force | Out-Null
}

# Add .gitkeep to uploads directory
"# This file ensures the uploads directory is tracked by Git`n# Actual uploaded files are ignored by .gitignore" | Out-File -FilePath "uploads\.gitkeep" -Encoding UTF8

Write-Host "✅ Cleanup complete" -ForegroundColor Green

# Verify important files exist
Write-Host "`n📋 Verifying project files..." -ForegroundColor Yellow

$requiredFiles = @(
    "README.md",
    "package.json", 
    "LICENSE",
    ".gitignore",
    "backend/simple-server.js",
    "frontend/package.json",
    "hash-utilities/manual-hash-generator.js",
    "postman/Chain-of-Custody-API.postman_collection.json"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (missing)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (!$allFilesExist) {
    Write-Host "`n❌ Some required files are missing. Please check your project structure." -ForegroundColor Red
    exit 1
}

# Test the system quickly
Write-Host "`n🧪 Quick system test..." -ForegroundColor Yellow

try {
    # Test hash generator
    $testResult = node hash-utilities/manual-hash-generator.js text "GitHub test" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Hash generator working" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Hash generator test failed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Could not test hash generator" -ForegroundColor Yellow
}

# Check package.json validity
try {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "  ✅ package.json is valid" -ForegroundColor Green
} catch {
    Write-Host "  ❌ package.json is invalid" -ForegroundColor Red
    $allFilesExist = $false
}

# Initialize Git if not already initialized
if (!(Test-Path ".git")) {
    Write-Host "`n🔧 Initializing Git repository..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "`n✅ Git repository already exists" -ForegroundColor Green
}

# Show project statistics
Write-Host "`n📊 Project Statistics:" -ForegroundColor Cyan
$jsFiles = (Get-ChildItem -Recurse -Include "*.js" | Where-Object { $_.FullName -notmatch "node_modules" }).Count
$jsonFiles = (Get-ChildItem -Recurse -Include "*.json" | Where-Object { $_.FullName -notmatch "node_modules" }).Count
$mdFiles = (Get-ChildItem -Recurse -Include "*.md").Count
$totalFiles = (Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch "node_modules" }).Count

Write-Host "  JavaScript files: $jsFiles" -ForegroundColor White
Write-Host "  JSON files: $jsonFiles" -ForegroundColor White  
Write-Host "  Markdown files: $mdFiles" -ForegroundColor White
Write-Host "  Total files: $totalFiles" -ForegroundColor White

# Final instructions
Write-Host "`n🎉 Your project is ready for GitHub!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray

Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Follow the instructions in GITHUB_SETUP.md" -ForegroundColor White
Write-Host "2. Create repository on GitHub: https://github.com/new" -ForegroundColor White
Write-Host "3. Repository name: Chain-of-Custody-file-movement" -ForegroundColor White
Write-Host "4. Run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "   git add ." -ForegroundColor Yellow
Write-Host "   git commit -m 'Initial commit: Complete Chain of Custody system'" -ForegroundColor Yellow
Write-Host "   git remote add origin https://github.com/yashikart/Chain-of-Custody-file-movement.git" -ForegroundColor Yellow
Write-Host "   git branch -M main" -ForegroundColor Yellow
Write-Host "   git push -u origin main" -ForegroundColor Yellow

Write-Host "`n🔗 Your repository will be available at:" -ForegroundColor Cyan
Write-Host "   https://github.com/yashikart/Chain-of-Custody-file-movement" -ForegroundColor Blue

Write-Host "`nTips:" -ForegroundColor Yellow
Write-Host "- Add repository topics: chain-of-custody, digital-forensics, legal-tech" -ForegroundColor White
Write-Host "- Create a release after first push" -ForegroundColor White
Write-Host "- Share with legal and security communities" -ForegroundColor White

Write-Host "`nPreparation complete!" -ForegroundColor Green
