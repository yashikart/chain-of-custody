#!/usr/bin/env node

/**
 * Manual Hash Generation Utility
 * Demonstrates various methods for generating and verifying file hashes
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Chain of Custody Database (JSON file storage)
const CUSTODY_DB_PATH = path.join(__dirname, 'custody-database.json');
const AUDIT_LOG_PATH = path.join(__dirname, 'audit-log.json');

class HashGenerator {
  constructor() {
    this.supportedAlgorithms = ['md5', 'sha1', 'sha256', 'sha512'];
    this.initializeDatabase();
  }

  /**
   * Initialize custody database and audit log
   */
  initializeDatabase() {
    // Initialize custody database
    if (!fs.existsSync(CUSTODY_DB_PATH)) {
      const initialDb = {
        files: {},
        created: new Date().toISOString(),
        version: '1.0'
      };
      fs.writeFileSync(CUSTODY_DB_PATH, JSON.stringify(initialDb, null, 2));
    }

    // Initialize audit log
    if (!fs.existsSync(AUDIT_LOG_PATH)) {
      const initialLog = {
        events: [],
        created: new Date().toISOString()
      };
      fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(initialLog, null, 2));
    }
  }

  /**
   * Load custody database
   */
  loadDatabase() {
    try {
      return JSON.parse(fs.readFileSync(CUSTODY_DB_PATH, 'utf8'));
    } catch (error) {
      console.error('Error loading database:', error.message);
      return { files: {} };
    }
  }

  /**
   * Save custody database
   */
  saveDatabase(db) {
    try {
      fs.writeFileSync(CUSTODY_DB_PATH, JSON.stringify(db, null, 2));
    } catch (error) {
      console.error('Error saving database:', error.message);
    }
  }

  /**
   * Add audit log entry
   */
  addAuditEntry(action, details) {
    try {
      const auditLog = JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, 'utf8'));
      const entry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action,
        details,
        user: process.env.USERNAME || process.env.USER || 'unknown',
        workstation: require('os').hostname()
      };

      auditLog.events.push(entry);
      fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(auditLog, null, 2));
      return entry;
    } catch (error) {
      console.error('Error adding audit entry:', error.message);
    }
  }

  /**
   * Generate hash for a file using streaming (memory efficient)
   * @param {string} filePath - Path to the file
   * @param {string} algorithm - Hash algorithm (md5, sha1, sha256, sha512)
   * @param {boolean} trackCustody - Whether to track in chain of custody
   * @returns {Promise<string>} - Hash string
   */
  async generateFileHash(filePath, algorithm = 'sha256', trackCustody = false) {
    return new Promise((resolve, reject) => {
      if (!this.supportedAlgorithms.includes(algorithm.toLowerCase())) {
        reject(new Error(`Unsupported algorithm: ${algorithm}`));
        return;
      }

      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => {
        hash.update(data);
      });

      stream.on('end', async () => {
        const hashValue = hash.digest('hex');

        if (trackCustody) {
          await this.addToCustodyChain(filePath, hashValue, algorithm, 'hash_generated');
        }

        resolve(hashValue);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Add file to chain of custody
   * @param {string} filePath - Path to the file
   * @param {string} hash - File hash
   * @param {string} algorithm - Hash algorithm used
   * @param {string} action - Action performed
   * @param {string} notes - Additional notes
   */
  async addToCustodyChain(filePath, hash, algorithm, action, notes = '') {
    try {
      const db = this.loadDatabase();
      const fileId = this.generateFileId(filePath);
      const stats = fs.statSync(filePath);

      if (!db.files[fileId]) {
        db.files[fileId] = {
          fileId,
          originalPath: filePath,
          fileName: path.basename(filePath),
          fileSize: stats.size,
          created: stats.birthtime.toISOString(),
          custodyChain: []
        };
      }

      const custodyEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action,
        hash,
        algorithm,
        location: path.dirname(filePath),
        user: process.env.USERNAME || process.env.USER || 'unknown',
        workstation: require('os').hostname(),
        notes
      };

      db.files[fileId].custodyChain.push(custodyEntry);
      db.files[fileId].lastModified = new Date().toISOString();

      this.saveDatabase(db);
      this.addAuditEntry(action, {
        fileId,
        filePath,
        hash,
        algorithm,
        notes
      });

      return custodyEntry;
    } catch (error) {
      console.error('Error adding to custody chain:', error.message);
      throw error;
    }
  }

  /**
   * Generate consistent file ID based on path
   */
  generateFileId(filePath) {
    return crypto.createHash('md5').update(path.resolve(filePath)).digest('hex');
  }

  /**
   * Generate hash for text/string content
   * @param {string} content - Text content to hash
   * @param {string} algorithm - Hash algorithm
   * @returns {string} - Hash string
   */
  generateTextHash(content, algorithm = 'sha256') {
    if (!this.supportedAlgorithms.includes(algorithm.toLowerCase())) {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    return crypto.createHash(algorithm).update(content, 'utf8').digest('hex');
  }

  /**
   * Generate multiple hashes for a file
   * @param {string} filePath - Path to the file
   * @param {Array<string>} algorithms - Array of algorithms to use
   * @returns {Promise<Object>} - Object with algorithm: hash pairs
   */
  async generateMultipleHashes(filePath, algorithms = ['md5', 'sha1', 'sha256', 'sha512']) {
    const results = {};
    
    for (const algorithm of algorithms) {
      try {
        results[algorithm] = await this.generateFileHash(filePath, algorithm);
      } catch (error) {
        results[algorithm] = `Error: ${error.message}`;
      }
    }
    
    return results;
  }

  /**
   * Verify file integrity by comparing hashes
   * @param {string} filePath - Path to the file
   * @param {string} expectedHash - Expected hash value
   * @param {string} algorithm - Hash algorithm used
   * @returns {Promise<boolean>} - True if hashes match
   */
  async verifyFileIntegrity(filePath, expectedHash, algorithm = 'sha256') {
    try {
      const actualHash = await this.generateFileHash(filePath, algorithm);
      return actualHash.toLowerCase() === expectedHash.toLowerCase();
    } catch (error) {
      console.error('Error verifying file integrity:', error.message);
      return false;
    }
  }

  /**
   * Generate hash manifest for multiple files
   * @param {Array<string>} filePaths - Array of file paths
   * @param {string} algorithm - Hash algorithm
   * @returns {Promise<Object>} - Manifest object
   */
  async generateManifest(filePaths, algorithm = 'sha256') {
    const manifest = {
      algorithm,
      generatedAt: new Date().toISOString(),
      files: {}
    };

    for (const filePath of filePaths) {
      try {
        const stats = fs.statSync(filePath);
        const hash = await this.generateFileHash(filePath, algorithm);
        
        manifest.files[filePath] = {
          hash,
          size: stats.size,
          modified: stats.mtime.toISOString()
        };
      } catch (error) {
        manifest.files[filePath] = {
          error: error.message
        };
      }
    }

    return manifest;
  }

  /**
   * Verify files against a manifest
   * @param {Object} manifest - Hash manifest
   * @returns {Promise<Object>} - Verification results
   */
  async verifyManifest(manifest) {
    const results = {
      algorithm: manifest.algorithm,
      verifiedAt: new Date().toISOString(),
      totalFiles: Object.keys(manifest.files).length,
      verified: 0,
      failed: 0,
      missing: 0,
      details: {}
    };

    for (const [filePath, fileInfo] of Object.entries(manifest.files)) {
      if (fileInfo.error) {
        results.details[filePath] = { status: 'error', message: fileInfo.error };
        results.failed++;
        continue;
      }

      if (!fs.existsSync(filePath)) {
        results.details[filePath] = { status: 'missing', message: 'File not found' };
        results.missing++;
        continue;
      }

      try {
        const isValid = await this.verifyFileIntegrity(filePath, fileInfo.hash, manifest.algorithm);
        if (isValid) {
          results.details[filePath] = { status: 'verified', hash: fileInfo.hash };
          results.verified++;
        } else {
          const actualHash = await this.generateFileHash(filePath, manifest.algorithm);
          results.details[filePath] = { 
            status: 'failed', 
            expected: fileInfo.hash, 
            actual: actualHash 
          };
          results.failed++;
        }
      } catch (error) {
        results.details[filePath] = { status: 'error', message: error.message };
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Track file movement
   * @param {string} filePath - Current file path
   * @param {string} newPath - New file path
   * @param {string} notes - Movement notes
   */
  async trackFileMovement(filePath, newPath, notes = '') {
    try {
      const fileId = this.generateFileId(filePath);
      const db = this.loadDatabase();

      if (!db.files[fileId]) {
        throw new Error('File not found in custody database. Generate hash first.');
      }

      // Verify file integrity before move
      const currentHash = await this.generateFileHash(filePath, 'sha256');
      const lastEntry = db.files[fileId].custodyChain[db.files[fileId].custodyChain.length - 1];

      if (lastEntry && lastEntry.hash !== currentHash) {
        console.warn('⚠️  Warning: File hash has changed since last custody entry!');
      }

      // Add movement entry
      await this.addToCustodyChain(filePath, currentHash, 'sha256', 'moved',
        `File moved from ${filePath} to ${newPath}. ${notes}`);

      // Update file path in database
      db.files[fileId].currentPath = newPath;
      this.saveDatabase(db);

      console.log('✅ File movement tracked successfully');
      return true;
    } catch (error) {
      console.error('❌ Error tracking file movement:', error.message);
      return false;
    }
  }

  /**
   * Export custody data as CSV
   * @param {string} outputPath - Output CSV file path
   * @param {string} fileFilter - Optional file filter
   */
  exportCustodyCSV(outputPath = 'custody-export.csv', fileFilter = '') {
    try {
      const db = this.loadDatabase();
      const csvData = [];

      // CSV headers
      const headers = [
        'FileID', 'FileName', 'FilePath', 'FileSize', 'Created',
        'Action', 'Timestamp', 'Hash', 'Algorithm', 'Location',
        'User', 'Workstation', 'Notes'
      ];

      csvData.push(headers.join(','));

      // Process each file
      Object.values(db.files).forEach(file => {
        if (fileFilter && !file.fileName.includes(fileFilter)) return;

        file.custodyChain.forEach(entry => {
          const row = [
            file.fileId,
            `"${file.fileName}"`,
            `"${file.originalPath}"`,
            file.fileSize,
            file.created,
            entry.action,
            entry.timestamp,
            entry.hash,
            entry.algorithm,
            `"${entry.location}"`,
            entry.user,
            entry.workstation,
            `"${entry.notes || ''}"`
          ];
          csvData.push(row.join(','));
        });
      });

      fs.writeFileSync(outputPath, csvData.join('\n'));

      console.log(`✅ Custody data exported to: ${outputPath}`);
      console.log(`📊 Total records: ${csvData.length - 1}`);
      return outputPath;
    } catch (error) {
      console.error('❌ Error exporting CSV:', error.message);
      throw error;
    }
  }

  /**
   * View custody chain for a file
   * @param {string} filePath - File path
   */
  viewCustodyChain(filePath) {
    try {
      const fileId = this.generateFileId(filePath);
      const db = this.loadDatabase();
      const file = db.files[fileId];

      if (!file) {
        console.log('❌ File not found in custody database');
        return;
      }

      console.log(`\n🔒 Chain of Custody: ${file.fileName}`);
      console.log('═'.repeat(80));
      console.log(`📁 File ID: ${file.fileId}`);
      console.log(`📄 Original Path: ${file.originalPath}`);
      console.log(`📊 Size: ${file.fileSize} bytes`);
      console.log(`📅 Created: ${new Date(file.created).toLocaleString()}`);
      console.log(`🔄 Last Modified: ${new Date(file.lastModified || file.created).toLocaleString()}`);
      console.log(`📋 Total Events: ${file.custodyChain.length}`);
      console.log('═'.repeat(80));

      file.custodyChain.forEach((entry, index) => {
        console.log(`\n📌 Event #${index + 1}`);
        console.log(`   Action: ${entry.action.toUpperCase()}`);
        console.log(`   Time: ${new Date(entry.timestamp).toLocaleString()}`);
        console.log(`   Hash: ${entry.hash}`);
        console.log(`   Algorithm: ${entry.algorithm.toUpperCase()}`);
        console.log(`   Location: ${entry.location}`);
        console.log(`   User: ${entry.user}@${entry.workstation}`);
        if (entry.notes) {
          console.log(`   Notes: ${entry.notes}`);
        }
        console.log('─'.repeat(40));
      });

    } catch (error) {
      console.error('❌ Error viewing custody chain:', error.message);
    }
  }

  /**
   * Display hash information in a formatted way
   * @param {Object} hashes - Hash object
   * @param {string} fileName - File name for display
   */
  displayHashes(hashes, fileName = 'Unknown') {
    console.log(`\n📁 File: ${fileName}`);
    console.log('─'.repeat(60));

    Object.entries(hashes).forEach(([algorithm, hash]) => {
      console.log(`${algorithm.toUpperCase().padEnd(8)}: ${hash}`);
    });

    console.log('─'.repeat(60));
  }
}

// Command line interface
async function main() {
  const hashGen = new HashGenerator();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🔐 Chain of Custody Hash Generator & File Tracker

Usage:
  node manual-hash-generator.js <command> [options]

Hash Commands:
  file <path> [algorithm]     Generate hash for a file
  text <content> [algorithm]  Generate hash for text
  multiple <path>             Generate multiple hashes for a file
  verify <path> <hash> [alg]  Verify file integrity
  manifest <path1> [path2...] Generate hash manifest
  check-manifest <manifest>   Verify files against manifest

Chain of Custody Commands:
  track <path> [algorithm]    Add file to custody chain with hash
  move <oldPath> <newPath>    Track file movement
  custody <path>              View custody chain for file
  export-csv [output.csv]     Export custody data as CSV
  audit-log                   View audit log

Examples:
  # Basic hashing
  node manual-hash-generator.js file document.pdf
  node manual-hash-generator.js text "Hello World"

  # Chain of custody
  node manual-hash-generator.js track evidence.pdf
  node manual-hash-generator.js move evidence.pdf /secure/evidence.pdf
  node manual-hash-generator.js custody evidence.pdf
  node manual-hash-generator.js export-csv custody-report.csv

  # Verification
  node manual-hash-generator.js verify document.pdf abc123...

Supported algorithms: md5, sha1, sha256, sha512
    `);
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'file': {
        const filePath = args[1];
        const algorithm = args[2] || 'sha256';
        
        if (!filePath) {
          console.error('❌ Error: File path required');
          return;
        }
        
        if (!fs.existsSync(filePath)) {
          console.error('❌ Error: File not found');
          return;
        }
        
        console.log(`🔄 Generating ${algorithm.toUpperCase()} hash for: ${filePath}`);
        const hash = await hashGen.generateFileHash(filePath, algorithm);
        console.log(`✅ ${algorithm.toUpperCase()}: ${hash}`);
        break;
      }

      case 'text': {
        const content = args[1];
        const algorithm = args[2] || 'sha256';
        
        if (!content) {
          console.error('❌ Error: Text content required');
          return;
        }
        
        const hash = hashGen.generateTextHash(content, algorithm);
        console.log(`✅ ${algorithm.toUpperCase()} hash of "${content}": ${hash}`);
        break;
      }

      case 'multiple': {
        const filePath = args[1];
        
        if (!filePath || !fs.existsSync(filePath)) {
          console.error('❌ Error: Valid file path required');
          return;
        }
        
        console.log(`🔄 Generating multiple hashes for: ${filePath}`);
        const hashes = await hashGen.generateMultipleHashes(filePath);
        hashGen.displayHashes(hashes, path.basename(filePath));
        break;
      }

      case 'verify': {
        const filePath = args[1];
        const expectedHash = args[2];
        const algorithm = args[3] || 'sha256';
        
        if (!filePath || !expectedHash) {
          console.error('❌ Error: File path and expected hash required');
          return;
        }
        
        console.log(`🔄 Verifying file integrity...`);
        const isValid = await hashGen.verifyFileIntegrity(filePath, expectedHash, algorithm);
        
        if (isValid) {
          console.log('✅ File integrity verified - hashes match!');
        } else {
          console.log('❌ File integrity check failed - hashes do not match!');
          const actualHash = await hashGen.generateFileHash(filePath, algorithm);
          console.log(`Expected: ${expectedHash}`);
          console.log(`Actual:   ${actualHash}`);
        }
        break;
      }

      case 'manifest': {
        const filePaths = args.slice(1);
        
        if (filePaths.length === 0) {
          console.error('❌ Error: At least one file path required');
          return;
        }
        
        console.log(`🔄 Generating manifest for ${filePaths.length} file(s)...`);
        const manifest = await hashGen.generateManifest(filePaths);
        
        const manifestPath = `manifest-${Date.now()}.json`;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        
        console.log(`✅ Manifest generated: ${manifestPath}`);
        console.log(`📊 Files processed: ${Object.keys(manifest.files).length}`);
        break;
      }

      case 'check-manifest': {
        const manifestPath = args[1];

        if (!manifestPath || !fs.existsSync(manifestPath)) {
          console.error('❌ Error: Valid manifest file required');
          return;
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        console.log(`🔄 Verifying files against manifest...`);

        const results = await hashGen.verifyManifest(manifest);

        console.log(`\n📊 Verification Results:`);
        console.log(`Total files: ${results.totalFiles}`);
        console.log(`✅ Verified: ${results.verified}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📁 Missing: ${results.missing}`);

        if (results.failed > 0 || results.missing > 0) {
          console.log(`\n🔍 Details:`);
          Object.entries(results.details).forEach(([file, detail]) => {
            if (detail.status !== 'verified') {
              console.log(`${file}: ${detail.status} - ${detail.message || detail.expected}`);
            }
          });
        }
        break;
      }

      case 'track': {
        const filePath = args[1];
        const algorithm = args[2] || 'sha256';

        if (!filePath || !fs.existsSync(filePath)) {
          console.error('❌ Error: Valid file path required');
          return;
        }

        console.log(`🔄 Adding file to custody chain...`);
        const hash = await hashGen.generateFileHash(filePath, algorithm, true);
        console.log(`✅ File added to custody chain`);
        console.log(`📁 File: ${path.basename(filePath)}`);
        console.log(`🔒 ${algorithm.toUpperCase()}: ${hash}`);
        console.log(`💡 Use 'custody ${filePath}' to view full chain`);
        break;
      }

      case 'move': {
        const oldPath = args[1];
        const newPath = args[2];
        const notes = args.slice(3).join(' ') || 'File moved via command line';

        if (!oldPath || !newPath) {
          console.error('❌ Error: Both old and new file paths required');
          return;
        }

        if (!fs.existsSync(oldPath)) {
          console.error('❌ Error: Source file not found');
          return;
        }

        console.log(`🔄 Tracking file movement...`);
        const success = await hashGen.trackFileMovement(oldPath, newPath, notes);

        if (success) {
          console.log(`📁 From: ${oldPath}`);
          console.log(`📁 To: ${newPath}`);
          console.log(`📝 Notes: ${notes}`);
        }
        break;
      }

      case 'custody': {
        const filePath = args[1];

        if (!filePath) {
          console.error('❌ Error: File path required');
          return;
        }

        hashGen.viewCustodyChain(filePath);
        break;
      }

      case 'export-csv': {
        const outputPath = args[1] || `custody-export-${Date.now()}.csv`;
        const fileFilter = args[2] || '';

        console.log(`🔄 Exporting custody data...`);
        hashGen.exportCustodyCSV(outputPath, fileFilter);
        console.log(`💡 Open with: Excel, LibreOffice, or any CSV viewer`);
        break;
      }

      case 'audit-log': {
        try {
          const auditLog = JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, 'utf8'));

          console.log(`\n📋 Audit Log (${auditLog.events.length} events)`);
          console.log('═'.repeat(80));

          auditLog.events.slice(-10).forEach((event, index) => {
            console.log(`\n🔍 Event #${auditLog.events.length - 9 + index}`);
            console.log(`   Time: ${new Date(event.timestamp).toLocaleString()}`);
            console.log(`   Action: ${event.action.toUpperCase()}`);
            console.log(`   User: ${event.user}@${event.workstation}`);
            if (event.details.filePath) {
              console.log(`   File: ${path.basename(event.details.filePath)}`);
            }
            if (event.details.hash) {
              console.log(`   Hash: ${event.details.hash.substring(0, 16)}...`);
            }
            console.log('─'.repeat(40));
          });

          if (auditLog.events.length > 10) {
            console.log(`\n💡 Showing last 10 events. Total: ${auditLog.events.length}`);
          }
        } catch (error) {
          console.error('❌ Error reading audit log:', error.message);
        }
        break;
      }

      default:
        console.error('❌ Error: Unknown command. Use no arguments to see help.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Export for use as module
module.exports = HashGenerator;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
