# Usage Examples

This document provides practical examples of using the Chain of Custody API with pagination, filtering, and export features.

## Basic File Operations

### 1. Upload a File
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@document.pdf" \
  -F "userId=john.doe" \
  -F "department=Legal" \
  -F "caseNumber=CASE-2023-001" \
  -F "evidenceType=Contract" \
  -F "classification=Confidential" \
  -F "notes=Original contract document"
```

### 2. Move a File
```bash
curl -X POST http://localhost:3000/api/move \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "file-uuid-here",
    "userId": "jane.smith",
    "newLocation": "secure-archive",
    "notes": "Moving to secure storage"
  }'
```

### 3. Download a File
```bash
curl -X GET "http://localhost:3000/api/download/file-uuid-here?userId=john.doe&notes=Legal review" \
  -o downloaded-file.pdf
```

## Pagination Examples

### 1. Get Files with Pagination
```bash
# Get first page (10 records)
curl "http://localhost:3000/api/upload/list?page=1&limit=10"

# Get second page with 25 records per page
curl "http://localhost:3000/api/upload/list?page=2&limit=25"

# Sort by file size in ascending order
curl "http://localhost:3000/api/upload/list?sortBy=fileSize&sortOrder=asc"
```

### 2. Get Movement History with Pagination
```bash
# Get recent movements
curl "http://localhost:3000/api/move/list?page=1&limit=20&sortOrder=desc"

# Get movements by specific user
curl "http://localhost:3000/api/move/list?userId=john.doe&page=1&limit=10"
```

### 3. Get Download Activities
```bash
# Get all download activities
curl "http://localhost:3000/api/download/list?action=download&page=1&limit=15"

# Get access logs only
curl "http://localhost:3000/api/download/list?action=access&page=1&limit=15"
```

## Filtering Examples

### 1. Filter by Date Range
```bash
# Get files uploaded in the last 30 days
curl "http://localhost:3000/api/upload/list?startDate=2023-11-01&endDate=2023-11-30"

# Get movements from specific date
curl "http://localhost:3000/api/move/list?startDate=2023-11-15"
```

### 2. Filter by Department and Case
```bash
# Get files from Legal department
curl "http://localhost:3000/api/reports/files?department=Legal&page=1&limit=20"

# Get files for specific case
curl "http://localhost:3000/api/reports/files?caseNumber=CASE-2023-001"
```

### 3. Filter by Status and Location
```bash
# Get active files in archive
curl "http://localhost:3000/api/reports/files?status=active&location=secure-archive"

# Get all archived files
curl "http://localhost:3000/api/reports/files?status=archived"
```

## Export Examples

### 1. Export All Data as CSV
```bash
# Export all chain of custody data
curl "http://localhost:3000/api/reports/export/csv" -o chain-of-custody-full.csv

# Export with date filter
curl "http://localhost:3000/api/reports/export/csv?startDate=2023-11-01&endDate=2023-11-30" \
  -o chain-of-custody-november.csv
```

### 2. Export Filtered Data as XML
```bash
# Export Legal department data
curl "http://localhost:3000/api/reports/export/xml?department=Legal" \
  -o legal-department-custody.xml

# Export specific case data
curl "http://localhost:3000/api/reports/export/xml?caseNumber=CASE-2023-001" \
  -o case-001-custody.xml
```

### 3. Export by Evidence Type
```bash
# Export all contracts
curl "http://localhost:3000/api/reports/export/csv?evidenceType=Contract" \
  -o contracts-custody.csv

# Export financial documents
curl "http://localhost:3000/api/reports/export/xml?evidenceType=Financial" \
  -o financial-docs-custody.xml
```

## Advanced Filtering Combinations

### 1. Complex Date and User Filter
```bash
# Get files uploaded by specific user in date range
curl "http://localhost:3000/api/reports/files?userId=john.doe&startDate=2023-11-01&endDate=2023-11-30&page=1&limit=50"
```

### 2. Department and Status Filter
```bash
# Get active Legal department files
curl "http://localhost:3000/api/reports/files?department=Legal&status=active&sortBy=createdAt&sortOrder=desc"
```

### 3. Location and Evidence Type Filter
```bash
# Get contracts in secure archive
curl "http://localhost:3000/api/reports/files?location=secure-archive&evidenceType=Contract"
```

## Batch Operations

### 1. Batch Move Files
```bash
curl -X POST http://localhost:3000/api/move/batch \
  -H "Content-Type: application/json" \
  -d '{
    "fileIds": ["uuid1", "uuid2", "uuid3"],
    "userId": "admin.user",
    "newLocation": "long-term-storage",
    "notes": "Quarterly archive operation"
  }'
```

## Response Examples

### Paginated Response Structure
```json
{
  "data": [
    {
      "fileId": "uuid",
      "originalFileName": "document.pdf",
      "fileSize": 1024,
      "currentLocation": "uploads",
      "status": "active",
      "metadata": {
        "department": "Legal",
        "caseNumber": "CASE-2023-001"
      },
      "createdAt": "2023-11-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 47,
    "recordsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "filters": {
    "department": "Legal",
    "page": "1",
    "limit": "10"
  }
}
```

### Export Response Headers
```
Content-Type: text/csv
Content-Disposition: attachment; filename="chain-of-custody-export_2023-11-15_14-30-25.csv"
X-Total-Records: 150
```

## Error Handling

### Common Error Responses
```json
{
  "error": "File not found",
  "message": "No file found with the specified ID"
}
```

```json
{
  "error": "Missing required fields",
  "message": "File ID and User ID are required"
}
```

## Tips for Efficient Usage

1. **Use appropriate page sizes**: Start with 10-25 records per page for UI display
2. **Apply filters early**: Use specific filters to reduce data transfer
3. **Sort strategically**: Sort by relevant fields (timestamp, size, etc.)
4. **Export in batches**: For large datasets, use date range filters
5. **Monitor pagination**: Check `hasNextPage` to implement infinite scroll
6. **Cache results**: Cache paginated results on the client side when appropriate

## Integration Examples

### JavaScript/Node.js Client
```javascript
const axios = require('axios');

async function getFiles(page = 1, filters = {}) {
  const params = new URLSearchParams({
    page,
    limit: 20,
    ...filters
  });
  
  const response = await axios.get(`http://localhost:3000/api/reports/files?${params}`);
  return response.data;
}

// Usage
const files = await getFiles(1, { department: 'Legal', status: 'active' });
```

### Python Client
```python
import requests

def export_csv(filters=None):
    params = filters or {}
    response = requests.get('http://localhost:3000/api/reports/export/csv', params=params)
    
    if response.status_code == 200:
        with open('export.csv', 'wb') as f:
            f.write(response.content)
        return True
    return False

# Usage
export_csv({'department': 'Legal', 'startDate': '2023-11-01'})
```
