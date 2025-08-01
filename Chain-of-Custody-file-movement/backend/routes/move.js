const express = require('express');
const fs = require('fs');
const path = require('path');
const ChainOfCustody = require('../models/ChainOfCustody');

const router = express.Router();

// POST /api/move - Move file to new location with chain of custody update
router.post('/move', async (req, res) => {
  try {
    const { fileId, userId, newLocation, notes } = req.body;

    // Validate required fields
    if (!fileId || !userId || !newLocation) {
      return res.status(400).json({ 
        error: 'Missing required fields: fileId, userId, and newLocation are required' 
      });
    }

    // Find the chain of custody record
    const record = await ChainOfCustody.findByFileId(fileId);
    
    if (!record) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file is active
    if (record.status !== 'active') {
      return res.status(400).json({ 
        error: `Cannot move file with status: ${record.status}` 
      });
    }

    // Verify current file exists
    if (!fs.existsSync(record.filePath)) {
      return res.status(404).json({ 
        error: 'Physical file not found at current location' 
      });
    }

    // Create new location directory if it doesn't exist
    const newLocationDir = path.join(__dirname, '../', newLocation);
    if (!fs.existsSync(newLocationDir)) {
      fs.mkdirSync(newLocationDir, { recursive: true });
    }

    // Generate new file path
    const fileName = path.basename(record.filePath);
    const newFilePath = path.join(newLocationDir, fileName);

    // Move the file
    fs.renameSync(record.filePath, newFilePath);

    // Update chain of custody record
    await record.addCustodyEvent({
      action: 'move',
      userId,
      location: newLocation,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      notes: notes || `File moved from ${record.currentLocation} to ${newLocation}`
    });

    // Update file path in record
    record.filePath = newFilePath;
    await record.save();

    res.json({
      message: 'File moved successfully',
      fileId,
      previousLocation: record.custodyChain[record.custodyChain.length - 2]?.location,
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

// GET /api/move/history/:fileId - Get movement history for a file
router.get('/move/history/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    const record = await ChainOfCustody.findByFileId(fileId);

    if (!record) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Filter custody chain for move events
    const moveHistory = record.custodyChain.filter(event =>
      event.action === 'move' || event.action === 'upload'
    );

    res.json({
      fileId,
      originalFileName: record.originalFileName,
      currentLocation: record.currentLocation,
      moveHistory: moveHistory.map(event => ({
        action: event.action,
        timestamp: event.timestamp,
        userId: event.userId,
        location: event.location,
        notes: event.notes
      }))
    });

  } catch (error) {
    console.error('Move history error:', error);
    res.status(500).json({
      error: 'Failed to get move history',
      message: error.message
    });
  }
});

// GET /api/move/list - Get paginated list of file movements
router.get('/move/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build aggregation pipeline to get move events
    const pipeline = [
      // Unwind custody chain to get individual events
      { $unwind: '$custodyChain' },

      // Filter for move and upload events
      {
        $match: {
          'custodyChain.action': { $in: ['move', 'upload'] }
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

    // Add location filter if provided
    if (req.query.location) {
      pipeline.push({
        $match: { 'custodyChain.location': req.query.location }
      });
    }

    // Project the fields we want
    pipeline.push({
      $project: {
        fileId: 1,
        originalFileName: 1,
        currentLocation: 1,
        status: 1,
        'metadata.department': 1,
        'metadata.caseNumber': 1,
        action: '$custodyChain.action',
        timestamp: '$custodyChain.timestamp',
        userId: '$custodyChain.userId',
        location: '$custodyChain.location',
        ipAddress: '$custodyChain.ipAddress',
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
    console.error('Move list error:', error);
    res.status(500).json({
      error: 'Failed to retrieve move list',
      message: error.message
    });
  }
});

// POST /api/move/batch - Move multiple files to new location
router.post('/move/batch', async (req, res) => {
  try {
    const { fileIds, userId, newLocation, notes } = req.body;

    if (!fileIds || !Array.isArray(fileIds) || !userId || !newLocation) {
      return res.status(400).json({ 
        error: 'Missing required fields: fileIds (array), userId, and newLocation are required' 
      });
    }

    const results = [];
    const errors = [];

    for (const fileId of fileIds) {
      try {
        const record = await ChainOfCustody.findByFileId(fileId);
        
        if (!record) {
          errors.push({ fileId, error: 'File not found' });
          continue;
        }

        if (record.status !== 'active') {
          errors.push({ fileId, error: `Cannot move file with status: ${record.status}` });
          continue;
        }

        if (!fs.existsSync(record.filePath)) {
          errors.push({ fileId, error: 'Physical file not found' });
          continue;
        }

        // Create new location directory if it doesn't exist
        const newLocationDir = path.join(__dirname, '../', newLocation);
        if (!fs.existsSync(newLocationDir)) {
          fs.mkdirSync(newLocationDir, { recursive: true });
        }

        // Generate new file path
        const fileName = path.basename(record.filePath);
        const newFilePath = path.join(newLocationDir, fileName);

        // Move the file
        fs.renameSync(record.filePath, newFilePath);

        // Update chain of custody record
        await record.addCustodyEvent({
          action: 'move',
          userId,
          location: newLocation,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          notes: notes || `Batch move from ${record.currentLocation} to ${newLocation}`
        });

        // Update file path in record
        record.filePath = newFilePath;
        await record.save();

        results.push({
          fileId,
          status: 'success',
          newLocation
        });

      } catch (error) {
        errors.push({ 
          fileId, 
          error: error.message 
        });
      }
    }

    res.json({
      message: 'Batch move completed',
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Batch move error:', error);
    res.status(500).json({ 
      error: 'Batch move failed',
      message: error.message 
    });
  }
});

module.exports = router;
