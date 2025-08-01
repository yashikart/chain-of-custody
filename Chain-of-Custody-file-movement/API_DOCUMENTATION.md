# Chain of Custody API Documentation

## Overview
This API provides comprehensive chain of custody tracking for file movement operations with support for CSV/XML exports and pagination.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, the API uses userId parameters for tracking. Future versions may implement token-based authentication.

## Common Query Parameters for Pagination
- `page` (integer): Page number (default: 1)
- `limit` (integer): Records per page (default: 10, max: 100)
- `sortBy` (string): Field to sort by (default: 'createdAt')
- `sortOrder` (string): 'asc' or 'desc' (default: 'desc')

## Common Filter Parameters
- `startDate` (ISO date): Filter records from this date
- `endDate` (ISO date): Filter records until this date
- `status` (string): 'active', 'archived', or 'deleted'
- `department` (string): Filter by department
- `caseNumber` (string): Filter by case number
- `evidenceType` (string): Filter by evidence type
- `userId` (string): Filter by user ID
- `location` (string): Filter by location

---

## Upload Endpoints

### POST /api/upload
Upload a file with chain of custody tracking.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file` (file): The file to upload
  - `userId` (string, required): User performing the upload
  - `department` (string): Department name
  - `caseNumber` (string): Case number
  - `evidenceType` (string): Type of evidence
  - `classification` (string): Classification level
  - `notes` (string): Additional notes

**Response:**
```json
{
  "message": "File uploaded successfully",
  "fileId": "uuid",
  "originalFileName": "document.pdf",
  "fileSize": 1024,
  "checksum": "sha256hash",
  "uploadTimestamp": "2023-01-01T00:00:00.000Z"
}
```

### GET /api/upload/status/:fileId
Get detailed status and chain of custody for a specific file.

**Response:**
```json
{
  "fileId": "uuid",
  "originalFileName": "document.pdf",
  "fileSize": 1024,
  "currentLocation": "uploads",
  "status": "active",
  "custodyChain": [...],
  "metadata": {...},
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### GET /api/upload/list
Get paginated list of uploaded files.

**Query Parameters:** All common pagination and filter parameters

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalRecords": 100,
    "recordsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "filters": {...}
}
```

---

## Move Endpoints

### POST /api/move
Move a file to a new location with chain of custody update.

**Request:**
```json
{
  "fileId": "uuid",
  "userId": "user123",
  "newLocation": "archive",
  "notes": "Moving to archive storage"
}
```

**Response:**
```json
{
  "message": "File moved successfully",
  "fileId": "uuid",
  "previousLocation": "uploads",
  "newLocation": "archive",
  "moveTimestamp": "2023-01-01T00:00:00.000Z"
}
```

### GET /api/move/history/:fileId
Get movement history for a specific file.

**Response:**
```json
{
  "fileId": "uuid",
  "originalFileName": "document.pdf",
  "currentLocation": "archive",
  "moveHistory": [...]
}
```

### GET /api/move/list
Get paginated list of file movements.

**Query Parameters:** All common pagination and filter parameters

### POST /api/move/batch
Move multiple files to a new location.

**Request:**
```json
{
  "fileIds": ["uuid1", "uuid2"],
  "userId": "user123",
  "newLocation": "archive",
  "notes": "Batch archive operation"
}
```

---

## Download Endpoints

### GET /api/download/:fileId
Download a file with audit logging.

**Query Parameters:**
- `userId` (string, required): User performing the download
- `notes` (string): Additional notes

**Response:** File stream with headers:
- `Content-Disposition`: attachment; filename="..."
- `X-File-ID`: File identifier
- `X-File-Checksum`: File integrity checksum

### GET /api/download/info/:fileId
Get download information without downloading the file.

**Response:**
```json
{
  "fileId": "uuid",
  "originalFileName": "document.pdf",
  "fileSize": 1024,
  "mimeType": "application/pdf",
  "currentLocation": "archive",
  "status": "active",
  "checksum": "sha256hash",
  "fileExists": true,
  "integrityValid": true,
  "downloadCount": 5,
  "lastDownload": "2023-01-01T00:00:00.000Z",
  "metadata": {...}
}
```

### GET /api/download/list
Get paginated list of download activities.

**Query Parameters:** All common pagination and filter parameters plus:
- `action` (string): 'download' or 'access'

### POST /api/download/access-log
Log file access without downloading.

**Request:**
```json
{
  "fileId": "uuid",
  "userId": "user123",
  "notes": "Viewed file metadata"
}
```

---

## Reports Endpoints

### GET /api/reports/files
Get paginated list of all files with comprehensive filtering.

**Query Parameters:** All common pagination and filter parameters

### GET /api/reports/export/csv
Export chain of custody data as CSV file.

**Query Parameters:** All common filter parameters (no pagination)

**Response:** CSV file download with headers:
- `Content-Type`: text/csv
- `Content-Disposition`: attachment; filename="chain-of-custody-export_YYYY-MM-DD_HH-mm-ss.csv"
- `X-Total-Records`: Number of records exported

### GET /api/reports/export/xml
Export chain of custody data as XML file.

**Query Parameters:** All common filter parameters (no pagination)

**Response:** XML file download with headers:
- `Content-Type`: application/xml
- `Content-Disposition`: attachment; filename="chain-of-custody-export_YYYY-MM-DD_HH-mm-ss.xml"
- `X-Total-Records`: Number of records exported

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `400`: Bad Request (missing required parameters)
- `404`: Not Found (file or resource not found)
- `500`: Internal Server Error

---

## CSV Export Format

The CSV export includes flattened custody chain data with columns:
- File information: fileId, originalFileName, fileSize, mimeType, checksum
- Current state: currentLocation, status
- Metadata: department, caseNumber, evidenceType, classification, tags
- Action details: action, actionTimestamp, actionUserId, actionLocation
- Audit trail: actionIpAddress, actionUserAgent, actionNotes
- Record timestamps: recordCreatedAt, recordUpdatedAt

## XML Export Format

The XML export maintains hierarchical structure:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<chainOfCustodyExport exportDate="..." totalRecords="...">
  <files>
    <file fileId="..." status="...">
      <basicInfo>...</basicInfo>
      <metadata>...</metadata>
      <custodyChain>
        <event action="..." timestamp="...">...</event>
      </custodyChain>
    </file>
  </files>
</chainOfCustodyExport>
```
