# Chain of Custody System Startup Script
Write-Host "🔒 Starting Chain of Custody System..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    Write-Host "💡 Trying with --legacy-peer-deps..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Still failed. You can run backend only." -ForegroundColor Red
        Set-Location ..
        Write-Host "🚀 Starting backend server only..." -ForegroundColor Green
        node backend/simple-server.js
        exit 0
    }
}

Set-Location ..

# Create uploads directory
if (!(Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" -Force
    Write-Host "📁 Created uploads directory" -ForegroundColor Green
}

Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
Write-Host "   Backend will run on: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Health check: http://localhost:3000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 To start frontend separately, run:" -ForegroundColor Yellow
Write-Host "   cd frontend && npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 To test hash generator:" -ForegroundColor Yellow
Write-Host "   node hash-utilities/manual-hash-generator.js text 'Hello World'" -ForegroundColor Yellow
Write-Host ""

# Start the backend server
node backend/simple-server.js
