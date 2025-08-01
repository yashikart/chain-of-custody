#!/usr/bin/env node

/**
 * Test script for Chain of Custody API
 * Demonstrates pagination, filtering, and export functionality
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3000/api';

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, params = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      params
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
}

// Test file upload
async function testUpload() {
  console.log('\n=== Testing File Upload ===');
  
  // Create a test file
  const testContent = 'This is a test file for chain of custody tracking.';
  fs.writeFileSync('test-file.txt', testContent);
  
  const form = new FormData();
  form.append('file', fs.createReadStream('test-file.txt'));
  form.append('userId', 'test-user-001');
  form.append('department', 'IT Security');
  form.append('caseNumber', 'TEST-2023-001');
  form.append('evidenceType', 'Log File');
  form.append('classification', 'Internal');
  form.append('notes', 'Test upload for API demonstration');
  
  try {
    const response = await axios.post(`${BASE_URL}/upload`, form, {
      headers: form.getHeaders()
    });
    
    console.log('Upload successful:', response.data);
    
    // Clean up test file
    fs.unlinkSync('test-file.txt');
    
    return response.data.fileId;
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
    fs.unlinkSync('test-file.txt');
    return null;
  }
}

// Test pagination
async function testPagination() {
  console.log('\n=== Testing Pagination ===');
  
  try {
    // Test upload list with pagination
    const page1 = await apiCall('GET', '/upload/list', null, { page: 1, limit: 5 });
    console.log('Page 1 results:', {
      recordCount: page1.data.length,
      pagination: page1.pagination
    });
    
    // Test reports with different page size
    const page2 = await apiCall('GET', '/reports/files', null, { page: 1, limit: 3, sortBy: 'createdAt', sortOrder: 'desc' });
    console.log('Reports page results:', {
      recordCount: page2.data.length,
      pagination: page2.pagination
    });
    
  } catch (error) {
    console.error('Pagination test failed:', error.message);
  }
}

// Test filtering
async function testFiltering() {
  console.log('\n=== Testing Filtering ===');
  
  try {
    // Filter by department
    const deptFilter = await apiCall('GET', '/reports/files', null, { 
      department: 'IT Security',
      page: 1,
      limit: 10
    });
    console.log('Department filter results:', {
      recordCount: deptFilter.data.length,
      filters: deptFilter.filters
    });
    
    // Filter by status
    const statusFilter = await apiCall('GET', '/reports/files', null, { 
      status: 'active',
      page: 1,
      limit: 10
    });
    console.log('Status filter results:', {
      recordCount: statusFilter.data.length,
      filters: statusFilter.filters
    });
    
    // Date range filter (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dateFilter = await apiCall('GET', '/reports/files', null, { 
      startDate: sevenDaysAgo.toISOString().split('T')[0],
      page: 1,
      limit: 10
    });
    console.log('Date filter results:', {
      recordCount: dateFilter.data.length,
      filters: dateFilter.filters
    });
    
  } catch (error) {
    console.error('Filtering test failed:', error.message);
  }
}

// Test file movement
async function testMovement(fileId) {
  if (!fileId) return;
  
  console.log('\n=== Testing File Movement ===');
  
  try {
    // Move file to archive
    const moveResult = await apiCall('POST', '/move', {
      fileId,
      userId: 'test-user-002',
      newLocation: 'test-archive',
      notes: 'Moving to test archive location'
    });
    console.log('Move result:', moveResult);
    
    // Get movement history
    const history = await apiCall('GET', `/move/history/${fileId}`);
    console.log('Movement history:', {
      fileId: history.fileId,
      currentLocation: history.currentLocation,
      moveCount: history.moveHistory.length
    });
    
    // Test movement list
    const moveList = await apiCall('GET', '/move/list', null, { 
      page: 1, 
      limit: 5,
      userId: 'test-user-002'
    });
    console.log('Movement list:', {
      recordCount: moveList.data.length,
      pagination: moveList.pagination
    });
    
  } catch (error) {
    console.error('Movement test failed:', error.message);
  }
}

// Test CSV export
async function testCSVExport() {
  console.log('\n=== Testing CSV Export ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/reports/export/csv`, {
      params: { department: 'IT Security' },
      responseType: 'stream'
    });
    
    const filename = 'test-export.csv';
    const writer = fs.createWriteStream(filename);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    const stats = fs.statSync(filename);
    console.log('CSV export successful:', {
      filename,
      size: stats.size,
      totalRecords: response.headers['x-total-records']
    });
    
    // Show first few lines
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n').slice(0, 3);
    console.log('CSV preview:', lines);
    
    // Clean up
    fs.unlinkSync(filename);
    
  } catch (error) {
    console.error('CSV export test failed:', error.message);
  }
}

// Test XML export
async function testXMLExport() {
  console.log('\n=== Testing XML Export ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/reports/export/xml`, {
      params: { status: 'active' },
      responseType: 'stream'
    });
    
    const filename = 'test-export.xml';
    const writer = fs.createWriteStream(filename);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    const stats = fs.statSync(filename);
    console.log('XML export successful:', {
      filename,
      size: stats.size,
      totalRecords: response.headers['x-total-records']
    });
    
    // Show first few lines
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n').slice(0, 5);
    console.log('XML preview:', lines);
    
    // Clean up
    fs.unlinkSync(filename);
    
  } catch (error) {
    console.error('XML export test failed:', error.message);
  }
}

// Test download functionality
async function testDownload(fileId) {
  if (!fileId) return;
  
  console.log('\n=== Testing Download ===');
  
  try {
    // Get download info
    const info = await apiCall('GET', `/download/info/${fileId}`);
    console.log('Download info:', {
      fileId: info.fileId,
      fileName: info.originalFileName,
      fileExists: info.fileExists,
      integrityValid: info.integrityValid,
      downloadCount: info.downloadCount
    });
    
    // Log access
    const accessLog = await apiCall('POST', '/download/access-log', {
      fileId,
      userId: 'test-user-003',
      notes: 'API test access'
    });
    console.log('Access logged:', accessLog);
    
    // Test download list
    const downloadList = await apiCall('GET', '/download/list', null, { 
      page: 1, 
      limit: 5,
      action: 'access'
    });
    console.log('Download list:', {
      recordCount: downloadList.data.length,
      pagination: downloadList.pagination
    });
    
  } catch (error) {
    console.error('Download test failed:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('Starting Chain of Custody API Tests...');
  console.log('Make sure the server is running on http://localhost:3000');
  
  try {
    // Test server health
    const health = await apiCall('GET', '/../health');
    console.log('Server status:', health);
    
    // Run tests
    const fileId = await testUpload();
    await testPagination();
    await testFiltering();
    await testMovement(fileId);
    await testDownload(fileId);
    await testCSVExport();
    await testXMLExport();
    
    console.log('\n=== All Tests Completed ===');
    
  } catch (error) {
    console.error('Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testUpload,
  testPagination,
  testFiltering,
  testMovement,
  testDownload,
  testCSVExport,
  testXMLExport
};
