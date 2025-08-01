const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend/build'));

// In-memory storage (for demo - replace with MongoDB in production)
let files = new Map();
let custodyChain = new Map();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Utility function to calculate file hash
function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Generate unique file ID
function generateFileId() {
  return crypto.randomUUID();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Chain of Custody server is running',
    timestamp: new Date().toISOString(),
    totalFiles: files.size
  });
});

// Upload file endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId, department, caseNumber, evidenceType, classification, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Calculate file hash
    const checksum = await calculateFileHash(req.file.path);
    const fileId = generateFileId();

    // Create file record
    const fileRecord = {
      fileId,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      checksum,
      currentLocation: 'uploads',
      status: 'active',
      metadata: {
        department: department || '',
        caseNumber: caseNumber || '',
        evidenceType: evidenceType || '',
        classification: classification || ''
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create initial custody chain entry
    const custodyEntry = {
      action: 'upload',
      timestamp: new Date(),
      userId,
      location: 'uploads',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      notes: notes || 'File uploaded'
    };

    files.set(fileId, fileRecord);
    custodyChain.set(fileId, [custodyEntry]);

    res.status(201).json({
      message: 'File uploaded successfully',
      fileId,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      checksum,
      uploadTimestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
});

// Get file status
app.get('/api/upload/status/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const file = files.get(fileId);
    const chain = custodyChain.get(fileId);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      ...file,
      custodyChain: chain || []
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      error: 'Failed to get file status',
      message: error.message 
    });
  }
});

// List files with pagination
app.get('/api/upload/list', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const allFiles = Array.from(files.values());
    const totalRecords = allFiles.length;
    const totalPages = Math.ceil(totalRecords / limit);
    
    const paginatedFiles = allFiles.slice(skip, skip + limit);

    res.json({
      data: paginatedFiles,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        recordsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve files',
      message: error.message 
    });
  }
});

// Move file
app.post('/api/move', (req, res) => {
  try {
    const { fileId, userId, newLocation, notes } = req.body;

    if (!fileId || !userId || !newLocation) {
      return res.status(400).json({ 
        error: 'Missing required fields: fileId, userId, and newLocation are required' 
      });
    }

    const file = files.get(fileId);
    const chain = custodyChain.get(fileId) || [];

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Update file location
    const previousLocation = file.currentLocation;
    file.currentLocation = newLocation;
    file.updatedAt = new Date();

    // Add custody chain entry
    const custodyEntry = {
      action: 'move',
      timestamp: new Date(),
      userId,
      location: newLocation,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      notes: notes || `File moved from ${previousLocation} to ${newLocation}`
    };

    chain.push(custodyEntry);
    custodyChain.set(fileId, chain);
    files.set(fileId, file);

    res.json({
      message: 'File moved successfully',
      fileId,
      previousLocation,
      newLocation,
      moveTimestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Move error:', error);
    res.status(500).json({ 
      error: 'Failed to move file',
      message: error.message 
    });
  }
});

// Download file
app.get('/api/download/:fileId', (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId, notes } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required for download' });
    }

    const file = files.get(fileId);
    const chain = custodyChain.get(fileId) || [];

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: 'Physical file not found' });
    }

    // Add custody chain entry
    const custodyEntry = {
      action: 'download',
      timestamp: new Date(),
      userId,
      location: file.currentLocation,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      notes: notes || 'File downloaded'
    };

    chain.push(custodyEntry);
    custodyChain.set(fileId, chain);

    // Set download headers
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalFileName}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('X-File-ID', fileId);
    res.setHeader('X-File-Checksum', file.checksum);

    // Stream file
    const fileStream = fs.createReadStream(file.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      error: 'Download failed',
      message: error.message 
    });
  }
});

// Export as CSV
app.get('/api/reports/export/csv', (req, res) => {
  try {
    const allFiles = Array.from(files.values());
    const flattenedData = [];

    allFiles.forEach(file => {
      const chain = custodyChain.get(file.fileId) || [];
      chain.forEach(event => {
        flattenedData.push({
          fileId: file.fileId,
          originalFileName: file.originalFileName,
          fileSize: file.fileSize,
          checksum: file.checksum,
          currentLocation: file.currentLocation,
          status: file.status,
          department: file.metadata?.department || '',
          caseNumber: file.metadata?.caseNumber || '',
          evidenceType: file.metadata?.evidenceType || '',
          action: event.action,
          actionTimestamp: event.timestamp.toISOString(),
          actionUserId: event.userId,
          actionLocation: event.location,
          actionNotes: event.notes || ''
        });
      });
    });

    const csvFields = [
      'fileId', 'originalFileName', 'fileSize', 'checksum', 'currentLocation',
      'status', 'department', 'caseNumber', 'evidenceType', 'action',
      'actionTimestamp', 'actionUserId', 'actionLocation', 'actionNotes'
    ];

    const json2csvParser = new Parser({ fields: csvFields });
    const csv = json2csvParser.parse(flattenedData);

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `chain-of-custody-export_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Total-Records', flattenedData.length);

    res.send(csv);

  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ 
      error: 'Failed to export CSV',
      message: error.message 
    });
  }
});

// Serve React app for any non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/build/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ 
      message: 'Chain of Custody API Server',
      endpoints: [
        'GET /health',
        'POST /api/upload',
        'GET /api/upload/status/:fileId',
        'GET /api/upload/list',
        'POST /api/move',
        'GET /api/download/:fileId',
        'GET /api/reports/export/csv'
      ]
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Chain of Custody server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base: http://localhost:${PORT}/api`);
});

module.exports = app;
