const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const ChainOfCustody = require('../models/ChainOfCustody');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Add file type validation if needed
    cb(null, true);
  }
});

// Calculate file checksum
function calculateChecksum(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// POST /api/upload - Upload file with chain of custody
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId, department, caseNumber, evidenceType, classification, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Calculate file checksum
    const checksum = await calculateChecksum(req.file.path);

    // Generate unique file ID
    const fileId = crypto.randomUUID();

    // Create chain of custody record
    const chainOfCustody = new ChainOfCustody({
      fileId,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      checksum,
      currentLocation: 'uploads',
      custodyChain: [{
        action: 'upload',
        userId,
        location: 'uploads',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        notes
      }],
      metadata: {
        department,
        caseNumber,
        evidenceType,
        classification
      }
    });

    await chainOfCustody.save();

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
    
    // Clean up uploaded file if database save failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
});

// GET /api/upload/status/:fileId - Get upload status and chain of custody
router.get('/upload/status/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    const record = await ChainOfCustody.findByFileId(fileId);

    if (!record) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      fileId: record.fileId,
      originalFileName: record.originalFileName,
      fileSize: record.fileSize,
      currentLocation: record.currentLocation,
      status: record.status,
      custodyChain: record.custodyChain,
      metadata: record.metadata,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to get file status',
      message: error.message
    });
  }
});

// GET /api/upload/list - Get paginated list of uploaded files
router.get('/upload/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query filters
    const filters = {};

    // Filter by status
    if (req.query.status) {
      filters.status = req.query.status;
    }

    // Filter by department
    if (req.query.department) {
      filters['metadata.department'] = req.query.department;
    }

    // Filter by case number
    if (req.query.caseNumber) {
      filters['metadata.caseNumber'] = req.query.caseNumber;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      filters.createdAt = {};
      if (req.query.startDate) {
        filters.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filters.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Build sort options
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    // Execute query with pagination
    const [records, totalCount] = await Promise.all([
      ChainOfCustody.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-custodyChain') // Exclude custody chain for list view
        .lean(),
      ChainOfCustody.countDocuments(filters)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      data: records,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords: totalCount,
        recordsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      filters: req.query
    });

  } catch (error) {
    console.error('Upload list error:', error);
    res.status(500).json({
      error: 'Failed to retrieve upload list',
      message: error.message
    });
  }
});

module.exports = router;
