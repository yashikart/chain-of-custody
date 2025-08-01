# Chain of Custody Demo Script
# Demonstrates all the new features

Write-Host "🔒 Chain of Custody Demo - Complete Workflow" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

# Create demo evidence files
Write-Host "`n📁 Creating demo evidence files..." -ForegroundColor Yellow

# Create evidence directory
if (!(Test-Path "demo-evidence")) {
    New-Item -ItemType Directory -Path "demo-evidence" -Force
}

# Create sample evidence files
@"
EVIDENCE DOCUMENT - CASE-2024-001
Date: $(Get-Date)
Type: Digital Evidence
Description: Email communication between suspects
Classification: CONFIDENTIAL
Chain of Custody Required: YES
"@ | Out-File -FilePath "demo-evidence\email-evidence.txt" -Encoding UTF8

@"
FINANCIAL TRANSACTION LOG
Date: $(Get-Date)
Account: 1234567890
Transactions:
- 2024-01-01: Transfer $10,000 to Account 9876543210
- 2024-01-02: Cash withdrawal $5,000
- 2024-01-03: Wire transfer $15,000 to offshore account
Status: Under Investigation
"@ | Out-File -FilePath "demo-evidence\financial-log.txt" -Encoding UTF8

@"
SYSTEM ACCESS LOG - SECURITY INCIDENT
Date: $(Get-Date)
Server: PROD-DB-01
Incident: Unauthorized access detected
Timeline:
- 23:45:12 - Failed login attempt (user: admin)
- 23:45:45 - Failed login attempt (user: administrator)
- 23:46:23 - Successful login (user: backup_admin)
- 23:47:01 - Database query executed
- 23:47:15 - Data export initiated
- 23:48:30 - User logged out
Alert Level: CRITICAL
"@ | Out-File -FilePath "demo-evidence\access-log.txt" -Encoding UTF8

Write-Host "✅ Created 3 evidence files" -ForegroundColor Green

# Step 1: Generate basic hashes
Write-Host "`n🔢 Step 1: Generating basic file hashes..." -ForegroundColor Cyan
node hash-utilities/manual-hash-generator.js file demo-evidence/email-evidence.txt

# Step 2: Add files to chain of custody
Write-Host "`n🔒 Step 2: Adding files to chain of custody..." -ForegroundColor Cyan
Write-Host "Adding email evidence to custody chain..."
node hash-utilities/manual-hash-generator.js track demo-evidence/email-evidence.txt

Write-Host "`nAdding financial log to custody chain..."
node hash-utilities/manual-hash-generator.js track demo-evidence/financial-log.txt

Write-Host "`nAdding access log to custody chain..."
node hash-utilities/manual-hash-generator.js track demo-evidence/access-log.txt

# Step 3: Simulate file movement
Write-Host "`n📦 Step 3: Simulating file movement to secure storage..." -ForegroundColor Cyan

# Create secure storage directory
if (!(Test-Path "secure-storage")) {
    New-Item -ItemType Directory -Path "secure-storage" -Force
}

# Copy files to simulate movement (in real scenario, you'd actually move them)
Copy-Item "demo-evidence\email-evidence.txt" "secure-storage\email-evidence.txt"
Copy-Item "demo-evidence\financial-log.txt" "secure-storage\financial-log.txt"

# Track the movements
Write-Host "Tracking email evidence movement..."
node hash-utilities/manual-hash-generator.js move demo-evidence/email-evidence.txt secure-storage/email-evidence.txt "Moved to secure storage for analysis"

Write-Host "`nTracking financial log movement..."
node hash-utilities/manual-hash-generator.js move demo-evidence/financial-log.txt secure-storage/financial-log.txt "Secured for forensic accounting review"

# Step 4: View custody chains
Write-Host "`n👁️ Step 4: Viewing custody chains..." -ForegroundColor Cyan
Write-Host "Custody chain for email evidence:"
node hash-utilities/manual-hash-generator.js custody demo-evidence/email-evidence.txt

Write-Host "`nCustody chain for financial log:"
node hash-utilities/manual-hash-generator.js custody demo-evidence/financial-log.txt

# Step 5: Generate multiple hashes for verification
Write-Host "`n🔍 Step 5: Generating multiple hashes for verification..." -ForegroundColor Cyan
node hash-utilities/manual-hash-generator.js multiple demo-evidence/access-log.txt

# Step 6: Export custody data
Write-Host "`n📊 Step 6: Exporting custody data to CSV..." -ForegroundColor Cyan
node hash-utilities/manual-hash-generator.js export-csv demo-custody-report.csv

# Step 7: View audit log
Write-Host "`n📋 Step 7: Viewing audit log..." -ForegroundColor Cyan
node hash-utilities/manual-hash-generator.js audit-log

# Step 8: Verify file integrity
Write-Host "`n✅ Step 8: Verifying file integrity..." -ForegroundColor Cyan
Write-Host "Generating hash for verification..."
$hash = node hash-utilities/manual-hash-generator.js file demo-evidence/access-log.txt | Select-String "SHA256:" | ForEach-Object { $_.ToString().Split(":")[1].Trim() }

if ($hash) {
    Write-Host "Verifying file integrity with hash: $($hash.Substring(0,16))..."
    node hash-utilities/manual-hash-generator.js verify demo-evidence/access-log.txt $hash
}

# Step 9: Create and verify manifest
Write-Host "`n📋 Step 9: Creating and verifying manifest..." -ForegroundColor Cyan
node hash-utilities/manual-hash-generator.js manifest demo-evidence/email-evidence.txt demo-evidence/financial-log.txt demo-evidence/access-log.txt

# Find the created manifest file
$manifestFile = Get-ChildItem -Filter "manifest-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($manifestFile) {
    Write-Host "Verifying against manifest: $($manifestFile.Name)"
    node hash-utilities/manual-hash-generator.js check-manifest $manifestFile.Name
}

# Summary
Write-Host "`n🎉 Demo Complete! Summary of what was demonstrated:" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ File hash generation (SHA256, MD5, SHA1, SHA512)" -ForegroundColor Green
Write-Host "✅ Chain of custody tracking with timestamps" -ForegroundColor Green
Write-Host "✅ File movement tracking with audit trail" -ForegroundColor Green
Write-Host "✅ Custody chain visualization" -ForegroundColor Green
Write-Host "✅ CSV export for reporting" -ForegroundColor Green
Write-Host "✅ Audit log with user and workstation tracking" -ForegroundColor Green
Write-Host "✅ File integrity verification" -ForegroundColor Green
Write-Host "✅ Manifest creation and verification" -ForegroundColor Green

Write-Host "`n📁 Files created during demo:" -ForegroundColor Yellow
Write-Host "- demo-evidence/ (3 evidence files)" -ForegroundColor White
Write-Host "- secure-storage/ (moved evidence files)" -ForegroundColor White
Write-Host "- custody-database.json (custody tracking)" -ForegroundColor White
Write-Host "- audit-log.json (audit trail)" -ForegroundColor White
Write-Host "- demo-custody-report.csv (exported data)" -ForegroundColor White
Write-Host "- manifest-*.json (file manifest)" -ForegroundColor White

Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
Write-Host "1. Open demo-custody-report.csv in Excel to view the data" -ForegroundColor White
Write-Host "2. Examine custody-database.json to see the tracking structure" -ForegroundColor White
Write-Host "3. Review audit-log.json for complete audit trail" -ForegroundColor White
Write-Host "4. Try the web interface: npm start (backend) + cd frontend && npm start" -ForegroundColor White

Write-Host "`n🔒 Your Chain of Custody system is now fully operational!" -ForegroundColor Green
