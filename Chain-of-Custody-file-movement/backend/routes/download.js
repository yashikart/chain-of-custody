const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ChainOfCustody = require('../models/ChainOfCustody');

const router = express.Router();

// Verify file integrity
function verifyFileIntegrity(filePath, expectedChecksum) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => {
      const actualChecksum = hash.digest('hex');
      resolve(actualChecksum === expectedChecksum);
    });
    stream.on('error', reject);
  });
}

// GET /api/download/:fileId - Download file with audit logging
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId, notes } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required for download' });
    }

    // Find the chain of custody record
    const record = await ChainOfCustody.findByFileId(fileId);
    
    if (!record) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file is active
    if (record.status !== 'active') {
      return res.status(400).json({ 
        error: `Cannot download file with status: ${record.status}` 
      });
    }

    // Verify file exists
    if (!fs.existsSync(record.filePath)) {
      return res.status(404).json({ 
        error: 'Physical file not found' 
      });
    }

    // Verify file integrity
    const isIntegrityValid = await verifyFileIntegrity(record.filePath, record.checksum);
    
    if (!isIntegrityValid) {
      return res.status(500).json({ 
        error: 'File integrity check failed - file may be corrupted' 
      });
    }

    // Log download event in chain of custody
    await record.addCustodyEvent({
      action: 'download',
      userId,
      location: record.currentLocation,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      notes: notes || 'File downloaded'
    });

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${record.originalFileName}"`);
    res.setHeader('Content-Type', record.mimeType);
    res.setHeader('Content-Length', record.fileSize);
    res.setHeader('X-File-ID', fileId);
    res.setHeader('X-File-Checksum', record.checksum);

    // Stream the file to the response
    const fileStream = fs.createReadStream(record.filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Failed to stream file',
          message: error.message 
        });
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      error: 'Download failed',
      message: error.message 
    });
  }
});

// GET /api/download/info/:fileId - Get download information without downloading
router.get('/download/info/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const record = await ChainOfCustody.findByFileId(fileId);
    
    if (!record) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check file existence and integrity
    const fileExists = fs.existsSync(record.filePath);
    let integrityValid = false;
    
    if (fileExists) {
      integrityValid = await verifyFileIntegrity(record.filePath, record.checksum);
    }

    // Get download history
    const downloadHistory = record.custodyChain.filter(event => 
      event.action === 'download'
    );

    res.json({
      fileId: record.fileId,
      originalFileName: record.originalFileName,
      fileSize: record.fileSize,
      mimeType: record.mimeType,
      currentLocation: record.currentLocation,
      status: record.status,
      checksum: record.checksum,
      fileExists,
      integrityValid,
      downloadCount: downloadHistory.length,
      lastDownload: downloadHistory.length > 0 ? 
        downloadHistory[downloadHistory.length - 1].timestamp : null,
      metadata: record.metadata,
      createdAt: record.createdAt
    });

  } catch (error) {
    console.error('Download info error:', error);
    res.status(500).json({ 
      error: 'Failed to get download information',
      message: error.message 
    });
  }
});

// POST /api/download/access-log - Log file access without download
router.post('/download/access-log', async (req, res) => {
  try {
    const { fileId, userId, notes } = req.body;

    if (!fileId || !userId) {
      return res.status(400).json({
        error: 'File ID and User ID are required'
      });
    }

    const record = await ChainOfCustody.findByFileId(fileId);

    if (!record) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Log access event
    await record.addCustodyEvent({
      action: 'access',
      userId,
      location: record.currentLocation,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      notes: notes || 'File accessed'
    });

    res.json({
      message: 'Access logged successfully',
      fileId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Access log error:', error);
    res.status(500).json({
      error: 'Failed to log access',
      message: error.message
    });
  }
});

// GET /api/download/list - Get paginated list of download activities
router.get('/download/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build aggregation pipeline to get download/access events
    const pipeline = [
      // Unwind custody chain to get individual events
      { $unwind: '$custodyChain' },

      // Filter for download and access events
      {
        $match: {
          'custodyChain.action': { $in: ['download', 'access'] }
        }
      }
    ];

    // Add date filter if provided
    if (req.query.startDate || req.query.endDate) {
      const dateFilter = {};
      if (req.query.startDate) {
        dateFilter.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        dateFilter.$lte = new Date(req.query.endDate);
      }
      pipeline.push({
        $match: { 'custodyChain.timestamp': dateFilter }
      });
    }

    // Add user filter if provided
    if (req.query.userId) {
      pipeline.push({
        $match: { 'custodyChain.userId': req.query.userId }
      });
    }

    // Add action filter if provided
    if (req.query.action) {
      pipeline.push({
        $match: { 'custodyChain.action': req.query.action }
      });
    }

    // Project the fields we want
    pipeline.push({
      $project: {
        fileId: 1,
        originalFileName: 1,
        fileSize: 1,
        mimeType: 1,
        currentLocation: 1,
        status: 1,
        'metadata.department': 1,
        'metadata.caseNumber': 1,
        'metadata.evidenceType': 1,
        action: '$custodyChain.action',
        timestamp: '$custodyChain.timestamp',
        userId: '$custodyChain.userId',
        location: '$custodyChain.location',
        ipAddress: '$custodyChain.ipAddress',
        userAgent: '$custodyChain.userAgent',
        notes: '$custodyChain.notes'
      }
    });

    // Sort by timestamp
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    pipeline.push({
      $sort: { timestamp: sortOrder }
    });

    // Execute aggregation with pagination
    const [results, totalCountResult] = await Promise.all([
      ChainOfCustody.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit }
      ]),
      ChainOfCustody.aggregate([
        ...pipeline,
        { $count: 'total' }
      ])
    ]);

    const totalCount = totalCountResult.length > 0 ? totalCountResult[0].total : 0;
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      data: results,
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
    console.error('Download list error:', error);
    res.status(500).json({
      error: 'Failed to retrieve download list',
      message: error.message
    });
  }
});

module.exports = router;
