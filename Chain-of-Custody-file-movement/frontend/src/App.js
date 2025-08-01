import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  // API base URL
  const API_BASE = 'http://localhost:3000/api';

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE}/upload/list`);
      setFiles(response.data.data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  // File upload handler
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', 'demo-user');
    formData.append('department', 'Demo Department');
    formData.append('caseNumber', 'DEMO-2024-001');
    formData.append('evidenceType', 'Document');
    formData.append('notes', 'Uploaded via web interface');

    try {
      setUploadStatus('Uploading...');
      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadStatus(`Upload successful! File ID: ${response.data.fileId}`);
      loadFiles(); // Refresh file list
    } catch (error) {
      setUploadStatus(`Upload failed: ${error.response?.data?.message || error.message}`);
    }
  };

  // Calculate file hash
  const calculateHash = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
        const hash = CryptoJS.SHA256(wordArray).toString();
        resolve(hash);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Hash generator component
  const HashGenerator = () => {
    const [textInput, setTextInput] = useState('');
    const [textHash, setTextHash] = useState('');

    const generateTextHash = () => {
      if (textInput) {
        const hash = CryptoJS.SHA256(textInput).toString();
        setTextHash(hash);
      }
    };

    return (
      <div className="card">
        <div className="card-header">
          <h5>Hash Generator</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Text to Hash:</label>
            <textarea
              className="form-control"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text to generate SHA256 hash"
              rows="3"
            />
          </div>
          <button className="btn btn-primary" onClick={generateTextHash}>
            Generate Hash
          </button>
          {textHash && (
            <div className="mt-3">
              <label className="form-label">SHA256 Hash:</label>
              <div className="form-control" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {textHash}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand">
            🔒 Chain of Custody Tracker
          </span>
          <div className="navbar-nav">
            <button
              className={`nav-link btn btn-link ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              📤 Upload
            </button>
            <button
              className={`nav-link btn btn-link ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              📋 Files
            </button>
            <button
              className={`nav-link btn btn-link ${activeTab === 'hash' ? 'active' : ''}`}
              onClick={() => setActiveTab('hash')}
            >
              🔢 Hash
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container-fluid mt-4">
        {activeTab === 'upload' && (
          <div className="row">
            <div className="col-md-8">
              <div className="card">
                <div className="card-header">
                  <h5>📤 File Upload</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Select File:</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={handleFileUpload}
                    />
                  </div>
                  {uploadStatus && (
                    <div className={`alert ${uploadStatus.includes('successful') ? 'alert-success' : uploadStatus.includes('failed') ? 'alert-danger' : 'alert-info'}`}>
                      {uploadStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="card">
            <div className="card-header">
              <h5>📋 File List</h5>
              <button className="btn btn-sm btn-outline-primary" onClick={loadFiles}>
                🔄 Refresh
              </button>
            </div>
            <div className="card-body">
              {files.length === 0 ? (
                <p>No files uploaded yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Size</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Uploaded</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.fileId}>
                          <td>{file.originalFileName}</td>
                          <td>{(file.fileSize / 1024).toFixed(1)} KB</td>
                          <td>
                            <span className={`badge ${file.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                              {file.status}
                            </span>
                          </td>
                          <td>{file.currentLocation}</td>
                          <td>{new Date(file.createdAt).toLocaleString()}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => setSelectedFile(file)}
                            >
                              👁️ View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'hash' && <HashGenerator />}

        {/* File Details Modal */}
        {selectedFile && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">File Details</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSelectedFile(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <h6>📄 File Information</h6>
                  <p><strong>Name:</strong> {selectedFile.originalFileName}</p>
                  <p><strong>Size:</strong> {(selectedFile.fileSize / 1024).toFixed(1)} KB</p>
                  <p><strong>Type:</strong> {selectedFile.mimeType}</p>
                  <p><strong>Location:</strong> {selectedFile.currentLocation}</p>
                  <p><strong>Status:</strong> {selectedFile.status}</p>

                  <h6>🔒 Security</h6>
                  <p><strong>Checksum (SHA256):</strong></p>
                  <div className="form-control" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedFile.checksum}
                  </div>

                  <h6>📋 Metadata</h6>
                  <p><strong>Department:</strong> {selectedFile.metadata?.department || 'N/A'}</p>
                  <p><strong>Case Number:</strong> {selectedFile.metadata?.caseNumber || 'N/A'}</p>
                  <p><strong>Evidence Type:</strong> {selectedFile.metadata?.evidenceType || 'N/A'}</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedFile(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
