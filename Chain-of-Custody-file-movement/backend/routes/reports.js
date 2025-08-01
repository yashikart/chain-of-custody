const express = require('express');
const { Parser } = require('json2csv');
const xml2js = require('xml2js');
const moment = require('moment');
const ChainOfCustody = require('../models/ChainOfCustody');

const router = express.Router();

// Helper function to build query filters
function buildQueryFilters(queryParams) {
  const filters = {};
  
  // Date range filters
  if (queryParams.startDate || queryParams.endDate) {
    filters.createdAt = {};
    if (queryParams.startDate) {
      filters.createdAt.$gte = new Date(queryParams.startDate);
    }
    if (queryParams.endDate) {
      filters.createdAt.$lte = new Date(queryParams.endDate);
    }
  }
  
  // Status filter
  if (queryParams.status) {
    filters.status = queryParams.status;
  }
  
  // Location filter
  if (queryParams.location) {
    filters.currentLocation = queryParams.location;
  }
  
  // Department filter
  if (queryParams.department) {
    filters['metadata.department'] = queryParams.department;
  }
  
  // Case number filter
  if (queryParams.caseNumber) {
    filters['metadata.caseNumber'] = queryParams.caseNumber;
  }
  
  // Evidence type filter
  if (queryParams.evidenceType) {
    filters['metadata.evidenceType'] = queryParams.evidenceType;
  }
  
  // User ID filter (for custody chain)
  if (queryParams.userId) {
    filters['custodyChain.userId'] = queryParams.userId;
  }
  
  return filters;
}

// Helper function to flatten custody chain for CSV export
function flattenCustodyData(records) {
  const flattened = [];
  
  records.forEach(record => {
    record.custodyChain.forEach(event => {
      flattened.push({
        fileId: record.fileId,
        originalFileName: record.originalFileName,
        fileSize: record.fileSize,
        mimeType: record.mimeType,
        checksum: record.checksum,
        currentLocation: record.currentLocation,
        status: record.status,
        department: record.metadata?.department || '',
        caseNumber: record.metadata?.caseNumber || '',
        evidenceType: record.metadata?.evidenceType || '',
        classification: record.metadata?.classification || '',
        tags: record.metadata?.tags?.join(', ') || '',
        action: event.action,
        actionTimestamp: moment(event.timestamp).format('YYYY-MM-DD HH:mm:ss'),
        actionUserId: event.userId,
        actionLocation: event.location,
        actionIpAddress: event.ipAddress || '',
        actionUserAgent: event.userAgent || '',
        actionNotes: event.notes || '',
        recordCreatedAt: moment(record.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        recordUpdatedAt: moment(record.updatedAt).format('YYYY-MM-DD HH:mm:ss')
      });
    });
  });
  
  return flattened;
}

// GET /api/reports/files - Get paginated list of files with filters
router.get('/files', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query filters
    const filters = buildQueryFilters(req.query);
    
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
    console.error('Files list error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve files',
      message: error.message 
    });
  }
});

// GET /api/reports/export/csv - Export chain of custody data as CSV
router.get('/export/csv', async (req, res) => {
  try {
    // Build query filters
    const filters = buildQueryFilters(req.query);
    
    // Get all matching records (no pagination for export)
    const records = await ChainOfCustody.find(filters).lean();
    
    if (records.length === 0) {
      return res.status(404).json({ error: 'No records found for export' });
    }
    
    // Flatten the data for CSV export
    const flattenedData = flattenCustodyData(records);
    
    // Define CSV fields
    const csvFields = [
      'fileId',
      'originalFileName',
      'fileSize',
      'mimeType',
      'checksum',
      'currentLocation',
      'status',
      'department',
      'caseNumber',
      'evidenceType',
      'classification',
      'tags',
      'action',
      'actionTimestamp',
      'actionUserId',
      'actionLocation',
      'actionIpAddress',
      'actionUserAgent',
      'actionNotes',
      'recordCreatedAt',
      'recordUpdatedAt'
    ];
    
    // Create CSV parser
    const json2csvParser = new Parser({ fields: csvFields });
    const csv = json2csvParser.parse(flattenedData);
    
    // Set response headers for file download
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
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

// GET /api/reports/export/xml - Export chain of custody data as XML
router.get('/export/xml', async (req, res) => {
  try {
    // Build query filters
    const filters = buildQueryFilters(req.query);
    
    // Get all matching records (no pagination for export)
    const records = await ChainOfCustody.find(filters).lean();
    
    if (records.length === 0) {
      return res.status(404).json({ error: 'No records found for export' });
    }
    
    // Prepare data for XML conversion
    const xmlData = {
      chainOfCustodyExport: {
        $: {
          exportDate: moment().toISOString(),
          totalRecords: records.length
        },
        files: {
          file: records.map(record => ({
            $: {
              fileId: record.fileId,
              status: record.status
            },
            basicInfo: {
              originalFileName: record.originalFileName,
              fileSize: record.fileSize,
              mimeType: record.mimeType,
              checksum: record.checksum,
              currentLocation: record.currentLocation,
              createdAt: moment(record.createdAt).toISOString(),
              updatedAt: moment(record.updatedAt).toISOString()
            },
            metadata: {
              department: record.metadata?.department || '',
              caseNumber: record.metadata?.caseNumber || '',
              evidenceType: record.metadata?.evidenceType || '',
              classification: record.metadata?.classification || '',
              tags: record.metadata?.tags ? {
                tag: record.metadata.tags
              } : ''
            },
            custodyChain: {
              event: record.custodyChain.map(event => ({
                $: {
                  action: event.action,
                  timestamp: moment(event.timestamp).toISOString()
                },
                userId: event.userId,
                location: event.location,
                ipAddress: event.ipAddress || '',
                userAgent: event.userAgent || '',
                notes: event.notes || ''
              }))
            }
          }))
        }
      }
    };
    
    // Build XML
    const builder = new xml2js.Builder({
      rootName: 'chainOfCustodyExport',
      xmldec: { version: '1.0', encoding: 'UTF-8' }
    });
    const xml = builder.buildObject(xmlData.chainOfCustodyExport);
    
    // Set response headers for file download
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `chain-of-custody-export_${timestamp}.xml`;
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Total-Records', records.length);
    
    res.send(xml);
    
  } catch (error) {
    console.error('XML export error:', error);
    res.status(500).json({ 
      error: 'Failed to export XML',
      message: error.message 
    });
  }
});

module.exports = router;
