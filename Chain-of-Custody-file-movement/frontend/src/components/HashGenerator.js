import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import CryptoJS from 'crypto-js';

const HashGenerator = () => {
  const [files, setFiles] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [textHash, setTextHash] = useState('');
  const [hashAlgorithm, setHashAlgorithm] = useState('SHA256');
  const [processing, setProcessing] = useState(false);

  // Calculate hash for different algorithms
  const calculateHash = (data, algorithm) => {
    switch (algorithm) {
      case 'MD5':
        return CryptoJS.MD5(data).toString();
      case 'SHA1':
        return CryptoJS.SHA1(data).toString();
      case 'SHA256':
        return CryptoJS.SHA256(data).toString();
      case 'SHA512':
        return CryptoJS.SHA512(data).toString();
      default:
        return CryptoJS.SHA256(data).toString();
    }
  };

  // Calculate file hash
  const calculateFileHash = (file, algorithm) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
          const hash = calculateHash(wordArray, algorithm);
          resolve(hash);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    setProcessing(true);
    
    try {
      const filesWithHashes = await Promise.all(
        acceptedFiles.map(async (file) => {
          const hashes = {};
          
          // Calculate hashes for all algorithms
          for (const algo of ['MD5', 'SHA1', 'SHA256', 'SHA512']) {
            try {
              hashes[algo] = await calculateFileHash(file, algo);
            } catch (error) {
              console.error(`Error calculating ${algo} for ${file.name}:`, error);
              hashes[algo] = 'Error calculating hash';
            }
          }
          
          return {
            file,
            hashes,
            id: Math.random().toString(36).substr(2, 9),
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified)
          };
        })
      );
      
      setFiles(prev => [...prev, ...filesWithHashes]);
      toast.success(`Generated hashes for ${acceptedFiles.length} file(s)`);
    } catch (error) {
      toast.error('Error processing files: ' + error.message);
    } finally {
      setProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  // Calculate text hash
  const calculateTextHash = () => {
    if (!textInput.trim()) {
      toast.error('Please enter some text to hash');
      return;
    }
    
    try {
      const hash = calculateHash(textInput, hashAlgorithm);
      setTextHash(hash);
      toast.success('Hash calculated successfully');
    } catch (error) {
      toast.error('Error calculating hash: ' + error.message);
    }
  };

  // Remove file from list
  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Clear all files
  const clearAllFiles = () => {
    setFiles([]);
  };

  // Copy hash to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Hash copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Export hashes as JSON
  const exportHashes = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      files: files.map(f => ({
        filename: f.file.name,
        size: f.size,
        type: f.type,
        lastModified: f.lastModified.toISOString(),
        hashes: f.hashes
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `file-hashes-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Hash data exported successfully');
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-hashtag me-2"></i>
                Hash Generator & Verification Tool
              </h4>
            </div>
            <div className="card-body">
              {/* Text Hash Generator */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-keyboard me-2"></i>
                        Text Hash Generator
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label">Algorithm</label>
                        <select
                          className="form-select"
                          value={hashAlgorithm}
                          onChange={(e) => setHashAlgorithm(e.target.value)}
                        >
                          <option value="MD5">MD5</option>
                          <option value="SHA1">SHA1</option>
                          <option value="SHA256">SHA256</option>
                          <option value="SHA512">SHA512</option>
                        </select>
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Text to Hash</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="Enter text to generate hash..."
                        />
                      </div>
                      
                      <button
                        className="btn btn-primary"
                        onClick={calculateTextHash}
                        disabled={!textInput.trim()}
                      >
                        <i className="fas fa-calculator me-2"></i>
                        Generate Hash
                      </button>
                      
                      {textHash && (
                        <div className="mt-3">
                          <label className="form-label">Generated Hash ({hashAlgorithm})</label>
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control hash-display"
                              value={textHash}
                              readOnly
                            />
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => copyToClipboard(textHash)}
                            >
                              <i className="fas fa-copy"></i>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-info-circle me-2"></i>
                        Hash Information
                      </h5>
                    </div>
                    <div className="card-body">
                      <h6>Hash Algorithms:</h6>
                      <ul className="list-unstyled">
                        <li><strong>MD5:</strong> 128-bit hash (32 hex chars) - Fast but not cryptographically secure</li>
                        <li><strong>SHA1:</strong> 160-bit hash (40 hex chars) - Deprecated for security</li>
                        <li><strong>SHA256:</strong> 256-bit hash (64 hex chars) - Recommended for security</li>
                        <li><strong>SHA512:</strong> 512-bit hash (128 hex chars) - Highest security</li>
                      </ul>
                      
                      <h6 className="mt-3">Use Cases:</h6>
                      <ul className="list-unstyled">
                        <li>• File integrity verification</li>
                        <li>• Digital forensics</li>
                        <li>• Chain of custody validation</li>
                        <li>• Data deduplication</li>
                        <li>• Password verification</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Hash Generator */}
              <div className="card">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="fas fa-file me-2"></i>
                      File Hash Generator
                    </h5>
                    <div className="btn-group">
                      {files.length > 0 && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={exportHashes}
                          >
                            <i className="fas fa-download me-1"></i>
                            Export Hashes
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={clearAllFiles}
                          >
                            <i className="fas fa-trash me-1"></i>
                            Clear All
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {/* File Drop Zone */}
                  <div
                    {...getRootProps()}
                    className={`dropzone ${isDragActive ? 'active' : ''}`}
                  >
                    <input {...getInputProps()} />
                    <div>
                      <i className="fas fa-cloud-upload-alt fa-3x mb-3 text-primary"></i>
                      <h5>
                        {isDragActive
                          ? 'Drop the files here...'
                          : 'Drag & drop files here, or click to select files'
                        }
                      </h5>
                      <p className="text-muted">
                        Generate MD5, SHA1, SHA256, and SHA512 hashes for your files
                      </p>
                      {processing && (
                        <div className="mt-3">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Processing...</span>
                          </div>
                          <p className="mt-2">Calculating hashes...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File List with Hashes */}
                  {files.length > 0 && (
                    <div className="mt-4">
                      <h6>Generated Hashes ({files.length} files)</h6>
                      
                      {files.map((fileData) => (
                        <div key={fileData.id} className="card mb-3">
                          <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0">{fileData.file.name}</h6>
                                <small className="text-muted">
                                  {formatFileSize(fileData.size)} • {fileData.type || 'Unknown type'} • 
                                  Modified: {fileData.lastModified.toLocaleString()}
                                </small>
                              </div>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeFile(fileData.id)}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                          <div className="card-body">
                            {Object.entries(fileData.hashes).map(([algorithm, hash]) => (
                              <div key={algorithm} className="mb-2">
                                <label className="form-label small fw-bold">{algorithm}</label>
                                <div className="input-group">
                                  <input
                                    type="text"
                                    className="form-control hash-display small"
                                    value={hash}
                                    readOnly
                                  />
                                  <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => copyToClipboard(hash)}
                                    title="Copy to clipboard"
                                  >
                                    <i className="fas fa-copy"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Hash Verification Examples */}
              <div className="card mt-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-terminal me-2"></i>
                    Command Line Examples
                  </h5>
                </div>
                <div className="card-body">
                  <h6>Generate hashes using command line tools:</h6>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="text-primary">Windows (PowerShell)</h6>
                      <pre className="bg-dark text-light p-3 rounded">
{`# SHA256
Get-FileHash -Path "file.txt" -Algorithm SHA256

# MD5
Get-FileHash -Path "file.txt" -Algorithm MD5

# SHA1
Get-FileHash -Path "file.txt" -Algorithm SHA1`}
                      </pre>
                    </div>
                    
                    <div className="col-md-6">
                      <h6 className="text-success">Linux/macOS</h6>
                      <pre className="bg-dark text-light p-3 rounded">
{`# SHA256
sha256sum file.txt

# MD5
md5sum file.txt

# SHA1
sha1sum file.txt`}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h6 className="text-warning">Node.js Example</h6>
                    <pre className="bg-dark text-light p-3 rounded">
{`const crypto = require('crypto');
const fs = require('fs');

const hash = crypto.createHash('sha256');
const stream = fs.createReadStream('file.txt');

stream.on('data', data => hash.update(data));
stream.on('end', () => {
  console.log(hash.digest('hex'));
});`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashGenerator;
