# 🔒 Chain of Custody File Movement System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

A comprehensive system for tracking file movements and maintaining chain of custody for digital evidence and sensitive documents. Perfect for legal, forensic, compliance, and security applications.

## 🌟 **Key Features**

- **🔐 Legal-grade chain of custody tracking**
- **🔍 Forensic hash verification (MD5, SHA1, SHA256, SHA512)**
- **📊 Professional CSV/XML reporting**
- **🌐 Modern React web interface**
- **🔗 IPFS-like distributed storage simulation**
- **📋 Complete audit trails**
- **⚖️ Court-ready documentation**

## 🎯 **Perfect For**

- **Legal firms** - Evidence management and discovery
- **Law enforcement** - Digital forensics and case management
- **Corporations** - Compliance and audit requirements
- **Healthcare** - HIPAA-compliant document tracking
- **Financial services** - Regulatory compliance
- **Government agencies** - Secure document handling

## Features

### Core Chain of Custody Features
- File upload with metadata tracking
- Chain of custody logging
- File movement between locations
- Download with audit trail
- MongoDB integration for data persistence

### Advanced Features
- **CSV and XML export functionality**
- **Pagination support for all list endpoints**
- **Advanced filtering and sorting**
- **Comprehensive audit trail reporting**

### Frontend Features
- **React-based web interface**
- **Drag & drop file upload**
- **Interactive chain visualization**
- **Real-time reports and analytics**
- **Hash generation and verification tools**

### IPFS Integration
- **IPFS storage simulation**
- **Distributed file storage**
- **Hash-based addressing**
- **Node replication management**

### Testing & Development
- **Comprehensive Postman collection**
- **Manual hash generation utilities**
- **Automated testing scripts**
- **Cross-platform compatibility**

## Project Structure

```
Chain-of-Custody-file-movement/
├── backend/
│   ├── models/
│   │   └── ChainOfCustody.js
│   ├── routes/
│   │   ├── upload.js         <-- File upload with pagination
│   │   ├── move.js           <-- File movement with pagination
│   │   ├── download.js       <-- File download with pagination
│   │   ├── reports.js        <-- CSV/XML export and reporting
│   │   └── ipfs.js           <-- IPFS simulation endpoints
│   ├── services/
│   │   └── ipfsSimulator.js  <-- IPFS storage simulation
│   ├── uploads/              <-- Temporary file storage
│   ├── ipfs-storage/         <-- IPFS simulation storage
│   ├── server.js             <-- Main server file
│   └── .env                  <-- For MongoDB URL
├── frontend/                 <-- React frontend application
│   ├── src/
│   │   ├── components/       <-- React components
│   │   ├── services/         <-- API service layer
│   │   └── App.js            <-- Main React app
│   └── package.json          <-- Frontend dependencies
├── postman/                  <-- Postman testing collection
│   ├── Chain-of-Custody-API.postman_collection.json
│   └── Chain-of-Custody-Environment.postman_environment.json
├── hash-utilities/           <-- Hash generation utilities
│   └── manual-hash-generator.js
├── package.json              <-- Backend dependencies
├── test-api.js               <-- API testing script
├── README.md
├── API_DOCUMENTATION.md      <-- Comprehensive API documentation
├── POSTMAN_TESTING_GUIDE.md  <-- Postman testing instructions
├── HASH_GENERATION_GUIDE.md  <-- Hash generation and verification guide
└── USAGE_EXAMPLES.md         <-- Practical usage examples
```

## Quick Start

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd Chain-of-Custody-file-movement
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Update backend/.env with your MongoDB connection
   MONGODB_URL=mongodb://localhost:27017/chain-of-custody
   PORT=3000
   ```

3. **Start the backend server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

### Frontend Setup

1. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the React development server:**
   ```bash
   npm start
   ```

3. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

### Testing Setup

1. **Run API tests:**
   ```bash
   npm test
   ```

2. **Import Postman collection:**
   - Import `postman/Chain-of-Custody-API.postman_collection.json`
   - Import `postman/Chain-of-Custody-Environment.postman_environment.json`

3. **Generate file hashes:**
   ```bash
   node hash-utilities/manual-hash-generator.js file document.pdf
   ```

## API Endpoints

### Core Operations
- `POST /api/upload` - Upload a file with chain of custody metadata
- `POST /api/move` - Move a file and update chain of custody
- `GET /api/download/:fileId` - Download a file with audit logging

### List Endpoints (with Pagination)
- `GET /api/upload/list` - Get paginated list of uploaded files
- `GET /api/move/list` - Get paginated list of file movements
- `GET /api/download/list` - Get paginated list of download activities
- `GET /api/reports/files` - Get comprehensive file reports

### Export Endpoints
- `GET /api/reports/export/csv` - Export data as CSV file
- `GET /api/reports/export/xml` - Export data as XML file

### IPFS Simulation Endpoints
- `POST /api/ipfs/add` - Add file to IPFS network
- `GET /api/ipfs/cat/:hash` - Retrieve file from IPFS
- `POST /api/ipfs/pin/:hash` - Pin file to additional nodes
- `GET /api/ipfs/status` - Get network status
- `GET /api/ipfs/nodes` - Get all nodes information

### Additional Features
- Batch file operations
- Advanced filtering and sorting
- File integrity verification
- Comprehensive audit trails
- IPFS-like distributed storage
- Hash-based file addressing

For detailed API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## Environment Variables

- `MONGODB_URL` - MongoDB connection string
- `PORT` - Server port (default: 3000)
