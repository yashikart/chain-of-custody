import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  getFileStatus, 
  getFileList,
  formatDate, 
  getActionBadgeClass 
} from '../services/api';

const ChainVisualization = () => {
  const [selectedFileId, setSelectedFileId] = useState('');
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load available files for selection
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const response = await getFileList({ limit: 100 });
        setFiles(response.data);
      } catch (error) {
        console.error('Failed to load files:', error);
      }
    };
    loadFiles();
  }, []);

  // Load chain of custody for selected file
  const loadChainData = async (fileId) => {
    if (!fileId) return;
    
    setLoading(true);
    try {
      const data = await getFileStatus(fileId);
      setFileData(data);
    } catch (error) {
      toast.error('Failed to load chain data: ' + error.message);
      setFileData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (fileId) => {
    setSelectedFileId(fileId);
    loadChainData(fileId);
  };

  // Filter files based on search term
  const filteredFiles = files.filter(file =>
    file.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.fileId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.metadata?.caseNumber && file.metadata.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get action icon
  const getActionIcon = (action) => {
    switch (action) {
      case 'upload':
        return 'fas fa-upload';
      case 'move':
        return 'fas fa-arrows-alt';
      case 'download':
        return 'fas fa-download';
      case 'access':
        return 'fas fa-eye';
      default:
        return 'fas fa-circle';
    }
  };

  // Get action color
  const getActionColor = (action) => {
    switch (action) {
      case 'upload':
        return '#27ae60';
      case 'move':
        return '#f39c12';
      case 'download':
        return '#3498db';
      case 'access':
        return '#9b59b6';
      default:
        return '#95a5a6';
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* File Selection Panel */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-search me-2"></i>
                Select File
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="list-group" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {filteredFiles.map((file) => (
                  <button
                    key={file.fileId}
                    type="button"
                    className={`list-group-item list-group-item-action ${
                      selectedFileId === file.fileId ? 'active' : ''
                    }`}
                    onClick={() => handleFileSelect(file.fileId)}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1 text-truncate">{file.originalFileName}</h6>
                      <small>{formatDate(file.createdAt)}</small>
                    </div>
                    <p className="mb-1 small">
                      <strong>Location:</strong> {file.currentLocation}
                    </p>
                    {file.metadata?.caseNumber && (
                      <small className="text-muted">Case: {file.metadata.caseNumber}</small>
                    )}
                  </button>
                ))}
              </div>
              
              {filteredFiles.length === 0 && (
                <div className="text-center text-muted py-3">
                  <i className="fas fa-search fa-2x mb-2"></i>
                  <p>No files found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chain Visualization Panel */}
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-project-diagram me-2"></i>
                Chain of Custody Visualization
              </h5>
            </div>
            <div className="card-body">
              {!selectedFileId && (
                <div className="text-center text-muted py-5">
                  <i className="fas fa-arrow-left fa-3x mb-3"></i>
                  <h5>Select a file to view its chain of custody</h5>
                  <p>Choose a file from the list on the left to visualize its complete audit trail.</p>
                </div>
              )}

              {loading && (
                <div className="loading-spinner">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}

              {fileData && !loading && (
                <div>
                  {/* File Information */}
                  <div className="file-info mb-4">
                    <div className="row">
                      <div className="col-md-6">
                        <h6><i className="fas fa-file me-2"></i>File Information</h6>
                        <p><strong>Name:</strong> {fileData.originalFileName}</p>
                        <p><strong>File ID:</strong> <code>{fileData.fileId}</code></p>
                        <p><strong>Size:</strong> {(fileData.fileSize / 1024).toFixed(2)} KB</p>
                        <p><strong>Type:</strong> {fileData.mimeType}</p>
                        <p><strong>Current Location:</strong> {fileData.currentLocation}</p>
                        <p><strong>Status:</strong> 
                          <span className={`badge ms-2 ${
                            fileData.status === 'active' ? 'bg-success' : 
                            fileData.status === 'archived' ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {fileData.status}
                          </span>
                        </p>
                      </div>
                      <div className="col-md-6">
                        <h6><i className="fas fa-tags me-2"></i>Metadata</h6>
                        <p><strong>Department:</strong> {fileData.metadata?.department || 'N/A'}</p>
                        <p><strong>Case Number:</strong> {fileData.metadata?.caseNumber || 'N/A'}</p>
                        <p><strong>Evidence Type:</strong> {fileData.metadata?.evidenceType || 'N/A'}</p>
                        <p><strong>Classification:</strong> {fileData.metadata?.classification || 'N/A'}</p>
                        {fileData.metadata?.tags && fileData.metadata.tags.length > 0 && (
                          <p><strong>Tags:</strong> {fileData.metadata.tags.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chain of Custody Timeline */}
                  <div className="timeline-container">
                    <h6><i className="fas fa-history me-2"></i>Chain of Custody Timeline</h6>
                    
                    <div className="timeline">
                      {fileData.custodyChain.map((event, index) => (
                        <div key={index} className={`chain-event ${event.action}`}>
                          <div className="row">
                            <div className="col-md-8">
                              <div className="d-flex align-items-center mb-2">
                                <div 
                                  className="me-3 p-2 rounded-circle text-white d-flex align-items-center justify-content-center"
                                  style={{ 
                                    backgroundColor: getActionColor(event.action),
                                    width: '40px',
                                    height: '40px'
                                  }}
                                >
                                  <i className={getActionIcon(event.action)}></i>
                                </div>
                                <div>
                                  <h6 className="mb-0">
                                    <span className={getActionBadgeClass(event.action)}>
                                      {event.action.toUpperCase()}
                                    </span>
                                  </h6>
                                  <small className="text-muted">
                                    {formatDate(event.timestamp)}
                                  </small>
                                </div>
                              </div>
                              
                              <div className="ms-5">
                                <p className="mb-1">
                                  <strong>User:</strong> {event.userId}
                                </p>
                                <p className="mb-1">
                                  <strong>Location:</strong> {event.location}
                                </p>
                                {event.ipAddress && (
                                  <p className="mb-1">
                                    <strong>IP Address:</strong> {event.ipAddress}
                                  </p>
                                )}
                                {event.notes && (
                                  <p className="mb-1">
                                    <strong>Notes:</strong> {event.notes}
                                  </p>
                                )}
                                {event.userAgent && (
                                  <details className="mt-2">
                                    <summary className="small text-muted" style={{ cursor: 'pointer' }}>
                                      User Agent Details
                                    </summary>
                                    <small className="text-muted">{event.userAgent}</small>
                                  </details>
                                )}
                              </div>
                            </div>
                            <div className="col-md-4 text-end">
                              <small className="text-muted">
                                Event #{fileData.custodyChain.length - index}
                              </small>
                            </div>
                          </div>
                          
                          {/* Connection line to next event */}
                          {index < fileData.custodyChain.length - 1 && (
                            <div 
                              className="position-absolute"
                              style={{
                                left: '19px',
                                bottom: '-20px',
                                width: '2px',
                                height: '20px',
                                backgroundColor: '#dee2e6'
                              }}
                            ></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* File Integrity */}
                  <div className="mt-4">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">
                          <i className="fas fa-shield-alt me-2"></i>
                          File Integrity
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="hash-display">
                          <strong>SHA256 Checksum:</strong><br/>
                          {fileData.checksum}
                        </div>
                        <small className="text-muted mt-2 d-block">
                          This checksum can be used to verify file integrity at any time.
                        </small>

                        {/* File Metadata Display */}
                        <div className="mt-3">
                          <h6>Complete File Information:</h6>
                          <div className="bg-light p-3 rounded">
                            <pre className="mb-0 small">
                              {JSON.stringify({
                                fileId: fileData.fileId,
                                originalFileName: fileData.originalFileName,
                                fileSize: fileData.fileSize,
                                mimeType: fileData.mimeType,
                                checksum: fileData.checksum,
                                currentLocation: fileData.currentLocation,
                                status: fileData.status,
                                metadata: fileData.metadata,
                                custodyChainLength: fileData.custodyChain.length
                              }, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="mt-4">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="card text-center">
                          <div className="card-body">
                            <h5 className="card-title text-primary">{fileData.custodyChain.length}</h5>
                            <p className="card-text small">Total Events</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card text-center">
                          <div className="card-body">
                            <h5 className="card-title text-success">
                              {fileData.custodyChain.filter(e => e.action === 'upload').length}
                            </h5>
                            <p className="card-text small">Uploads</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card text-center">
                          <div className="card-body">
                            <h5 className="card-title text-warning">
                              {fileData.custodyChain.filter(e => e.action === 'move').length}
                            </h5>
                            <p className="card-text small">Moves</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card text-center">
                          <div className="card-body">
                            <h5 className="card-title text-info">
                              {fileData.custodyChain.filter(e => e.action === 'download').length}
                            </h5>
                            <p className="card-text small">Downloads</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChainVisualization;
