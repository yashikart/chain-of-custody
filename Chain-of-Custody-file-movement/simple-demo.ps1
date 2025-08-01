# Simple Chain of Custody Demo
Write-Host "🔒 Chain of Custody Demo - Quick Test" -ForegroundColor Green

# Create test directory
Write-Host "`n📁 Creating test files..." -ForegroundColor Yellow
if (!(Test-Path "test-evidence")) {
    New-Item -ItemType Directory -Path "test-evidence" -Force
}

# Create a simple test file
"This is test evidence for demonstration" | Out-File -FilePath "test-evidence\sample.txt" -Encoding UTF8
Write-Host "✅ Created test-evidence\sample.txt" -ForegroundColor Green

# Test 1: Basic hash generation
Write-Host "`n🔢 Test 1: Generate hash for text" -ForegroundColor Cyan
node hash-utilities/manual-hash-generator.js text "Hello World"

# Test 2: Generate file hash
Write-Host "`n🔢 Test 2: Generate hash for file" -ForegroundColor Cyan
node hash-utilities/manual-hash-generator.js file test-evidence/sample.txt

# Test 3: Add to custody chain
Write-Host "`n🔒 Test 3: Add file to custody chain" -ForegroundColor Cyan
node hash-utilities/manual-hash-generator.js track test-evidence/sample.txt

# Test 4: View custody chain
Write-Host "`n👁️ Test 4: View custody chain" -ForegroundColor Cyan
node hash-utilities/manual-hash-generator.js custody test-evidence/sample.txt

# Test 5: Generate multiple hashes
Write-Host "`n🔍 Test 5: Generate multiple hashes" -ForegroundColor Cyan
node hash-utilities/manual-hash-generator.js multiple test-evidence/sample.txt

# Test 6: Export to CSV
Write-Host "`n📊 Test 6: Export custody data" -ForegroundColor Cyan
node hash-utilities/manual-hash-generator.js export-csv test-report.csv

# Test 7: View audit log
Write-Host "`n📋 Test 7: View audit log" -ForegroundColor Cyan
node hash-utilities/manual-hash-generator.js audit-log

Write-Host "`n🎉 Demo Complete!" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor Yellow
Write-Host "- test-evidence/sample.txt" -ForegroundColor White
Write-Host "- custody-database.json" -ForegroundColor White
Write-Host "- audit-log.json" -ForegroundColor White
Write-Host "- test-report.csv" -ForegroundColor White

Write-Host "`n💡 Try these commands manually:" -ForegroundColor Cyan
Write-Host "node hash-utilities/manual-hash-generator.js text 'Your text here'" -ForegroundColor White
Write-Host "node hash-utilities/manual-hash-generator.js file your-file.txt" -ForegroundColor White
Write-Host "node hash-utilities/manual-hash-generator.js track your-file.txt" -ForegroundColor White
