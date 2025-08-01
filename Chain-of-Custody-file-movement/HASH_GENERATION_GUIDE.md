# Hash Generation and Verification Guide

This guide provides comprehensive instructions for generating and verifying file hashes manually using various tools and methods.

## Overview

File hashing is crucial for:
- **Integrity Verification**: Ensuring files haven't been modified
- **Chain of Custody**: Proving file authenticity in legal contexts
- **Deduplication**: Identifying duplicate files
- **Digital Forensics**: Maintaining evidence integrity

## Hash Algorithms

### Supported Algorithms

| Algorithm | Output Length | Security Level | Use Case |
|-----------|---------------|----------------|----------|
| MD5 | 128-bit (32 hex chars) | ⚠️ Deprecated | Legacy compatibility only |
| SHA1 | 160-bit (40 hex chars) | ⚠️ Weak | Legacy systems |
| SHA256 | 256-bit (64 hex chars) | ✅ Strong | Recommended for most uses |
| SHA512 | 512-bit (128 hex chars) | ✅ Very Strong | High-security applications |

### Recommendations

- **Use SHA256** for general purposes
- **Use SHA512** for high-security requirements
- **Avoid MD5 and SHA1** for new implementations

## Manual Hash Generation Methods

### 1. Using Our Custom Utility

```bash
# Navigate to the project directory
cd Chain-of-Custody-file-movement

# Make the script executable (Linux/macOS)
chmod +x hash-utilities/manual-hash-generator.js

# Generate hash for a single file
node hash-utilities/manual-hash-generator.js file document.pdf

# Generate hash with specific algorithm
node hash-utilities/manual-hash-generator.js file document.pdf sha256

# Generate multiple hashes
node hash-utilities/manual-hash-generator.js multiple document.pdf

# Generate hash for text
node hash-utilities/manual-hash-generator.js text "Hello World"

# Verify file integrity
node hash-utilities/manual-hash-generator.js verify document.pdf abc123def456...

# Generate manifest for multiple files
node hash-utilities/manual-hash-generator.js manifest file1.txt file2.pdf file3.jpg

# Verify files against manifest
node hash-utilities/manual-hash-generator.js check-manifest manifest-1234567890.json
```

### 2. Windows PowerShell

```powershell
# SHA256 (recommended)
Get-FileHash -Path "document.pdf" -Algorithm SHA256

# MD5
Get-FileHash -Path "document.pdf" -Algorithm MD5

# SHA1
Get-FileHash -Path "document.pdf" -Algorithm SHA1

# SHA512
Get-FileHash -Path "document.pdf" -Algorithm SHA512

# Multiple files
Get-ChildItem *.pdf | Get-FileHash -Algorithm SHA256

# Export to CSV
Get-ChildItem *.* | Get-FileHash -Algorithm SHA256 | Export-Csv -Path "hashes.csv" -NoTypeInformation
```

### 3. Linux/macOS Command Line

```bash
# SHA256 (most common)
sha256sum document.pdf

# MD5
md5sum document.pdf

# SHA1
sha1sum document.pdf

# SHA512
sha512sum document.pdf

# Multiple files
sha256sum *.pdf

# Generate checksums file
sha256sum *.* > checksums.sha256

# Verify against checksums file
sha256sum -c checksums.sha256

# macOS specific (using shasum)
shasum -a 256 document.pdf  # SHA256
shasum -a 1 document.pdf    # SHA1
shasum -a 512 document.pdf  # SHA512
```

### 4. Node.js Programmatic Approach

```javascript
const crypto = require('crypto');
const fs = require('fs');

// Method 1: For small files (loads entire file into memory)
function generateHashSync(filePath, algorithm = 'sha256') {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash(algorithm);
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Method 2: For large files (streaming, memory efficient)
function generateHashAsync(filePath, algorithm = 'sha256') {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Usage examples
const hash1 = generateHashSync('document.pdf');
console.log('SHA256:', hash1);

generateHashAsync('document.pdf', 'sha512')
  .then(hash => console.log('SHA512:', hash))
  .catch(console.error);
```

### 5. Python Implementation

```python
import hashlib
import sys

def generate_hash(file_path, algorithm='sha256'):
    """Generate hash for a file using specified algorithm"""
    hash_obj = hashlib.new(algorithm)
    
    with open(file_path, 'rb') as f:
        # Read file in chunks to handle large files
        for chunk in iter(lambda: f.read(4096), b""):
            hash_obj.update(chunk)
    
    return hash_obj.hexdigest()

# Usage
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python hash_generator.py <file_path> [algorithm]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    algorithm = sys.argv[2] if len(sys.argv) > 2 else 'sha256'
    
    try:
        hash_value = generate_hash(file_path, algorithm)
        print(f"{algorithm.upper()}: {hash_value}")
    except Exception as e:
        print(f"Error: {e}")
```

## Verification Examples

### 1. Basic Verification

```bash
# Generate hash
node hash-utilities/manual-hash-generator.js file document.pdf
# Output: SHA256: a1b2c3d4e5f6...

# Later, verify the file hasn't changed
node hash-utilities/manual-hash-generator.js verify document.pdf a1b2c3d4e5f6...
```

### 2. Batch Verification

```bash
# Create manifest for multiple files
node hash-utilities/manual-hash-generator.js manifest *.pdf *.jpg *.txt

# Later, verify all files
node hash-utilities/manual-hash-generator.js check-manifest manifest-1234567890.json
```

### 3. Cross-Platform Verification

```bash
# Generate on Windows
Get-FileHash -Path "document.pdf" -Algorithm SHA256
# Output: A1B2C3D4E5F6...

# Verify on Linux
echo "a1b2c3d4e5f6... document.pdf" | sha256sum -c
# Output: document.pdf: OK
```

## Integration with Chain of Custody System

### 1. Pre-Upload Verification

```bash
# Generate hash before upload
node hash-utilities/manual-hash-generator.js file evidence.pdf
# Note the hash: abc123def456...

# Upload file through API
# Compare with hash returned by server
```

### 2. Post-Download Verification

```bash
# Download file from system
curl -o downloaded-evidence.pdf "http://localhost:3000/api/download/file-id?userId=user123"

# Verify integrity
node hash-utilities/manual-hash-generator.js verify downloaded-evidence.pdf abc123def456...
```

### 3. Periodic Integrity Checks

```bash
# Create baseline manifest
node hash-utilities/manual-hash-generator.js manifest /path/to/evidence/*

# Schedule periodic verification
# (Add to cron job or scheduled task)
node hash-utilities/manual-hash-generator.js check-manifest baseline-manifest.json
```

## Best Practices

### 1. Algorithm Selection

- **Use SHA256** for most applications
- **Use SHA512** for high-security environments
- **Avoid MD5 and SHA1** for new implementations
- **Document the algorithm used** in your chain of custody

### 2. Hash Storage

- **Store hashes separately** from the files
- **Use secure storage** for hash databases
- **Include metadata** (algorithm, timestamp, file size)
- **Backup hash records** regularly

### 3. Verification Procedures

- **Verify immediately** after file operations
- **Perform periodic checks** on stored files
- **Document verification results** in audit logs
- **Investigate any hash mismatches** immediately

### 4. Documentation

- **Record hash values** in chain of custody logs
- **Document verification procedures** in SOPs
- **Train staff** on hash verification processes
- **Maintain audit trails** of all hash operations

## Troubleshooting

### Common Issues

1. **Hash Mismatch**
   - File may have been modified
   - Different algorithm used
   - File corruption during transfer
   - Encoding issues (text files)

2. **Performance Issues**
   - Use streaming for large files
   - Consider parallel processing for multiple files
   - Monitor memory usage

3. **Cross-Platform Differences**
   - Case sensitivity in hash values
   - Line ending differences in text files
   - File permission changes

### Solutions

```bash
# Check file size and modification time
ls -la document.pdf

# Compare hashes with different algorithms
node hash-utilities/manual-hash-generator.js multiple document.pdf

# Check for file corruption
# (Re-download or restore from backup)
```

## Automation Scripts

### Batch Hash Generation

```bash
#!/bin/bash
# generate_hashes.sh

for file in "$@"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        node hash-utilities/manual-hash-generator.js file "$file"
    fi
done
```

### Scheduled Verification

```bash
#!/bin/bash
# verify_integrity.sh

MANIFEST_FILE="integrity_manifest.json"
LOG_FILE="integrity_check.log"

echo "$(date): Starting integrity check" >> "$LOG_FILE"
node hash-utilities/manual-hash-generator.js check-manifest "$MANIFEST_FILE" >> "$LOG_FILE" 2>&1
echo "$(date): Integrity check completed" >> "$LOG_FILE"
```

## Legal and Compliance Considerations

### Chain of Custody Requirements

1. **Document hash generation** process and tools used
2. **Maintain hash records** as part of evidence documentation
3. **Verify hashes** before and after any file operations
4. **Use court-accepted** hash algorithms (SHA256 recommended)
5. **Provide expert testimony** on hash verification if needed

### Audit Trail

- Record who generated the hash
- Document when the hash was generated
- Note the algorithm and tools used
- Maintain verification logs
- Store hash records securely

This comprehensive approach ensures file integrity throughout the entire chain of custody process.
