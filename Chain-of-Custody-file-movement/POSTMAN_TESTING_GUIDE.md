# Postman Testing Guide for Chain of Custody API

This guide provides comprehensive instructions for testing the Chain of Custody API using Postman.

## Setup Instructions

### 1. Import Collection and Environment

1. **Import Collection:**
   - Open Postman
   - Click "Import" button
   - Select `postman/Chain-of-Custody-API.postman_collection.json`
   - Click "Import"

2. **Import Environment:**
   - Click "Import" button again
   - Select `postman/Chain-of-Custody-Environment.postman_environment.json`
   - Click "Import"

3. **Select Environment:**
   - In the top-right corner, select "Chain of Custody Environment" from the dropdown

### 2. Start the Backend Server

Before testing, ensure your backend server is running:

```bash
cd Chain-of-Custody-file-movement
npm install
npm start
```

The server should be running on `http://localhost:3000`

## Testing Workflow

### Step 1: Health Check

1. **Test:** Health Check
2. **Purpose:** Verify the server is running
3. **Expected Result:** Status 200 with message "Chain of Custody server is running"

### Step 2: File Upload Testing

#### Basic Upload Test

1. **Test:** Upload File
2. **Setup:**
   - In the request body, click on "file" field
   - Select a test file from your computer
   - Modify other form fields if needed (userId, department, etc.)
3. **Expected Result:**
   - Status 201
   - Response contains `fileId`, `checksum`, and `uploadTimestamp`
   - The `fileId` is automatically saved to environment variables

#### Upload List Testing

1. **Test:** Get Upload List (Paginated)
2. **Purpose:** Test pagination functionality
3. **Parameters to modify:**
   - `page`: Change to test different pages
   - `limit`: Change to test different page sizes
   - `sortBy`: Test different sorting fields
   - `sortOrder`: Test ascending/descending order

2. **Test:** Get Upload List (Filtered)
3. **Purpose:** Test filtering functionality
4. **Parameters to modify:**
   - `department`: Filter by department
   - `status`: Filter by file status
   - `caseNumber`: Filter by case number

### Step 3: File Status and Details

1. **Test:** Get File Status
2. **Purpose:** Retrieve complete chain of custody for uploaded file
3. **Note:** Uses the `fileId` automatically captured from upload test
4. **Expected Result:** Complete file details with custody chain

### Step 4: File Movement Testing

#### Single File Move

1. **Test:** Move File
2. **Setup:**
   - Modify `newLocation` in request body
   - Modify `notes` if desired
3. **Expected Result:**
   - Status 200
   - File moved successfully
   - Previous and new locations shown

#### Movement History

1. **Test:** Get Move History
2. **Purpose:** View movement history for specific file
3. **Expected Result:** List of all move and upload events for the file

#### Movement List

1. **Test:** Get Move List (Paginated)
2. **Purpose:** View all movement activities across all files
3. **Parameters to test:**
   - Pagination parameters
   - User filtering
   - Date range filtering

#### Batch Move

1. **Test:** Batch Move Files
2. **Setup:**
   - Modify `fileIds` array to include multiple file IDs
   - You may need to upload multiple files first
3. **Expected Result:** Batch operation results with success/failure for each file

### Step 5: Download Testing

#### Download File

1. **Test:** Download File
2. **Purpose:** Download file and log access
3. **Expected Result:**
   - File download starts
   - Access is logged in chain of custody

#### Download Information

1. **Test:** Get Download Info
2. **Purpose:** Get file download metadata without downloading
3. **Expected Result:** File info, integrity status, download count

#### Access Logging

1. **Test:** Log File Access
2. **Purpose:** Log file access without downloading
3. **Expected Result:** Access event added to chain of custody

#### Download Activity List

1. **Test:** Get Download List
2. **Purpose:** View all download and access activities
3. **Parameters to test:**
   - Filter by action type (download/access)
   - Pagination parameters
   - User filtering

### Step 6: Reports and Export Testing

#### Reports

1. **Test:** Get Reports
2. **Purpose:** Get comprehensive file reports with pagination
3. **Parameters to test:**
   - Different page sizes
   - Various sorting options

2. **Test:** Get Reports (Filtered)
3. **Purpose:** Test advanced filtering capabilities
4. **Parameters to test:**
   - Department filtering
   - Status filtering
   - Date range filtering

#### Export Testing

1. **Test:** Export CSV
2. **Purpose:** Export data in CSV format
3. **Expected Result:**
   - CSV file download
   - Headers indicate total records exported

2. **Test:** Export XML
3. **Purpose:** Export data in XML format
4. **Expected Result:**
   - XML file download
   - Hierarchical data structure

## Advanced Testing Scenarios

### Scenario 1: Complete File Lifecycle

1. Upload a file
2. Move it to different locations
3. Download it multiple times
4. Access it for viewing
5. Export the complete chain of custody

### Scenario 2: Batch Operations

1. Upload multiple files
2. Perform batch move operation
3. Generate reports for all files
4. Export comprehensive data

### Scenario 3: Error Testing

1. **Invalid File ID:**
   - Use non-existent fileId in environment
   - Test various endpoints
   - Expected: 404 errors

2. **Missing Parameters:**
   - Remove required fields from requests
   - Expected: 400 errors with validation messages

3. **Invalid Data:**
   - Use invalid date formats
   - Use invalid status values
   - Expected: Appropriate error responses

### Scenario 4: Pagination Stress Testing

1. Upload many files (use the test script)
2. Test pagination with different page sizes
3. Test sorting with large datasets
4. Test filtering with various criteria

## Environment Variables

The environment includes these variables that you can modify:

- `baseUrl`: API base URL (default: http://localhost:3000/api)
- `fileId`: Auto-populated from upload responses
- `userId`: Default user for testing
- `department`: Default department
- `caseNumber`: Default case number
- `evidenceType`: Default evidence type
- `classification`: Default classification
- `newLocation`: Default location for move operations

## Test Data Preparation

### Sample Files for Testing

Create these test files for comprehensive testing:

1. **Small text file** (test.txt) - for basic functionality
2. **Image file** (test.jpg) - for binary file testing
3. **Large file** (>1MB) - for performance testing
4. **Multiple files** - for batch operation testing

### Sample Test Data

Use these values for consistent testing:

- **User IDs:** test-user-001, test-user-002, admin-user
- **Departments:** IT Security, Legal, HR, Finance
- **Case Numbers:** CASE-2023-001, CASE-2023-002, etc.
- **Evidence Types:** Document, Image, Video, Log File, Database
- **Classifications:** Public, Internal, Confidential, Restricted
- **Locations:** uploads, archive, secure-storage, long-term-storage

## Automated Testing

### Collection Runner

1. Select the collection
2. Click "Run collection"
3. Select environment
4. Configure iterations and delay
5. Run automated tests

### Newman (Command Line)

Install Newman for command-line testing:

```bash
npm install -g newman

# Run collection
newman run postman/Chain-of-Custody-API.postman_collection.json \
  -e postman/Chain-of-Custody-Environment.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export newman-report.html
```

## Troubleshooting

### Common Issues

1. **Server not running:** Ensure backend server is started
2. **File upload fails:** Check file size limits and permissions
3. **Environment variables not set:** Verify environment is selected
4. **CORS errors:** Ensure proper CORS configuration in backend

### Debug Tips

1. Check Postman console for detailed error messages
2. Verify environment variables are populated correctly
3. Use Postman's built-in debugging tools
4. Check server logs for backend errors

## Performance Testing

### Load Testing Scenarios

1. **Concurrent uploads:** Test multiple file uploads simultaneously
2. **Pagination performance:** Test large datasets with pagination
3. **Export performance:** Test CSV/XML export with large datasets
4. **Search performance:** Test filtering with complex criteria

### Metrics to Monitor

- Response times for different operations
- Memory usage during large file operations
- Database query performance
- Export generation time

This comprehensive testing approach ensures all API functionality works correctly and performs well under various conditions.
