# 🚀 Quick Start Guide

## Option 1: Automated Setup (Recommended)

```powershell
# Run the automated setup script
.\start-system.ps1
```

## Option 2: Manual Setup

### Step 1: Install Backend Dependencies
```powershell
npm install
```

### Step 2: Install Frontend Dependencies
```powershell
cd frontend
npm install
# If that fails, try:
npm install --legacy-peer-deps
cd ..
```

### Step 3: Start Backend Server
```powershell
node backend/simple-server.js
```

### Step 4: Start Frontend (Optional - in new terminal)
```powershell
cd frontend
npm start
```

## 🧪 Testing the System

### 1. Test Hash Generator
```powershell
# Test with text
node hash-utilities/manual-hash-generator.js text "Hello World"

# Test with file (create a test file first)
echo "Test content" > test.txt
node hash-utilities/manual-hash-generator.js file test.txt
```

### 2. Test Backend API
- **Health Check:** http://localhost:3000/health
- **API Documentation:** http://localhost:3000 (shows available endpoints)

### 3. Test File Upload
```powershell
# Using curl (if available)
curl -X POST http://localhost:3000/api/upload -F "file=@test.txt" -F "userId=demo-user"

# Or use the web interface at http://localhost:3001 (if frontend is running)
```

## 🎯 What You Can Do

### Through Web Interface (if frontend is running):
- ✅ Upload files with automatic hash calculation
- ✅ View file list with details
- ✅ Generate text hashes
- ✅ View file details and checksums

### Through API:
- ✅ Upload files: `POST /api/upload`
- ✅ List files: `GET /api/upload/list`
- ✅ Get file status: `GET /api/upload/status/:fileId`
- ✅ Move files: `POST /api/move`
- ✅ Download files: `GET /api/download/:fileId`
- ✅ Export CSV: `GET /api/reports/export/csv`

### Through Command Line:
- ✅ Generate file hashes
- ✅ Verify file integrity
- ✅ Create hash manifests

## 🔧 Troubleshooting

### Frontend Won't Install
```powershell
# Try with legacy peer deps
cd frontend
npm install --legacy-peer-deps

# Or run backend only
node backend/simple-server.js
```

### Backend Won't Start
```powershell
# Check if port 3000 is available
netstat -an | findstr :3000

# Try different port
$env:PORT=3001; node backend/simple-server.js
```

### Hash Generator Issues
```powershell
# Check Node.js version
node --version

# Test with simple command
node -e "console.log('Node.js is working')"
```

## 📊 Sample Workflow

1. **Start the system:** `.\start-system.ps1`
2. **Create test file:** `echo "Evidence data" > evidence.txt`
3. **Generate hash:** `node hash-utilities/manual-hash-generator.js file evidence.txt`
4. **Upload via API:** Use Postman or curl to upload the file
5. **Verify integrity:** Compare uploaded file hash with original

## 🎉 Success Indicators

- ✅ Backend starts without errors
- ✅ Health check returns OK: http://localhost:3000/health
- ✅ Hash generator produces consistent hashes
- ✅ File upload works through API
- ✅ Frontend loads (if installed): http://localhost:3001

The system is now ready for chain of custody file tracking!
