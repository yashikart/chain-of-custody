import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import CryptoJS from 'crypto-js';
import { uploadFile, formatFileSize } from '../services/api';

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    department: '',
    caseNumber: '',
    evidenceType: '',
    classification: '',
    notes: ''
  });

  // Calculate file hash
  const calculateFileHash = (file) => {
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

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    const filesWithHash = await Promise.all(
      acceptedFiles.map(async (file) => {
        const hash = await calculateFileHash(file);
        return {
          file,
          hash,
          id: Math.random().toString(36).substr(2, 9),
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        };
      })
    );
    setFiles(prev => [...prev, ...filesWithHash]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  // Remove file from list
  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    if (!formData.userId) {
      toast.error('User ID is required');
      return;
    }

    setUploading(true);
    const results = [];

    try {
      for (const fileData of files) {
        const formDataToSend = new FormData();
        formDataToSend.append('file', fileData.file);
        formDataToSend.append('userId', formData.userId);
        formDataToSend.append('department', formData.department);
        formDataToSend.append('caseNumber', formData.caseNumber);
        formDataToSend.append('evidenceType', formData.evidenceType);
        formDataToSend.append('classification', formData.classification);
        formDataToSend.append('notes', formData.notes);

        try {
          const result = await uploadFile(formDataToSend);
          results.push({
            ...result,
            originalFile: fileData.file.name,
            clientHash: fileData.hash,
            status: 'success'
          });
          toast.success(`${fileData.file.name} uploaded successfully`);
        } catch (error) {
          results.push({
            originalFile: fileData.file.name,
            error: error.response?.data?.message || error.message,
            status: 'error'
          });
          toast.error(`Failed to upload ${fileData.file.name}: ${error.response?.data?.message || error.message}`);
        }
      }

      setUploadResults(results);
      setFiles([]);
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-upload me-2"></i>
                File Upload
              </h4>
            </div>
            <div className="card-body">
              {/* Upload Form */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">User ID *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="userId"
                      value={formData.userId}
                      onChange={handleInputChange}
                      placeholder="Enter your user ID"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g., Legal, IT, HR"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Case Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="caseNumber"
                      value={formData.caseNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., CASE-2023-001"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Evidence Type</label>
                    <select
                      className="form-select"
                      name="evidenceType"
                      value={formData.evidenceType}
                      onChange={handleInputChange}
                    >
                      <option value="">Select evidence type</option>
                      <option value="Document">Document</option>
                      <option value="Image">Image</option>
                      <option value="Video">Video</option>
                      <option value="Audio">Audio</option>
                      <option value="Log File">Log File</option>
                      <option value="Database">Database</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Classification</label>
                    <select
                      className="form-select"
                      name="classification"
                      value={formData.classification}
                      onChange={handleInputChange}
                    >
                      <option value="">Select classification</option>
                      <option value="Public">Public</option>
                      <option value="Internal">Internal</option>
                      <option value="Confidential">Confidential</option>
                      <option value="Restricted">Restricted</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Additional notes about the upload"
                    />
                  </div>
                </div>
              </div>

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
                    Maximum file size: 100MB per file
                  </p>
                </div>
              </div>

              {/* Selected Files */}
              {files.length > 0 && (
                <div className="mt-4">
                  <h5>Selected Files ({files.length})</h5>
                  <div className="row">
                    {files.map((fileData) => (
                      <div key={fileData.id} className="col-md-6 col-lg-4 mb-3">
                        <div className="card">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <h6 className="card-title text-truncate" title={fileData.file.name}>
                                  {fileData.file.name}
                                </h6>
                                <p className="card-text small text-muted">
                                  Size: {formatFileSize(fileData.file.size)}<br/>
                                  Type: {fileData.file.type || 'Unknown'}
                                </p>
                                <div className="hash-display small">
                                  <strong>SHA256:</strong><br/>
                                  {fileData.hash}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeFile(fileData.id)}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                            {fileData.preview && (
                              <img
                                src={fileData.preview}
                                alt="Preview"
                                className="img-thumbnail mt-2"
                                style={{ maxHeight: '100px', width: '100%', objectFit: 'cover' }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="mt-4">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleUpload}
                  disabled={uploading || files.length === 0}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload me-2"></i>
                      Upload Files ({files.length})
                    </>
                  )}
                </button>
              </div>

              {/* Upload Results */}
              {uploadResults.length > 0 && (
                <div className="mt-4">
                  <h5>Upload Results</h5>
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>File Name</th>
                          <th>Status</th>
                          <th>File ID</th>
                          <th>Hash Match</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResults.map((result, index) => (
                          <tr key={index}>
                            <td>{result.originalFile}</td>
                            <td>
                              <span className={`badge ${result.status === 'success' ? 'bg-success' : 'bg-danger'}`}>
                                {result.status}
                              </span>
                            </td>
                            <td>
                              {result.fileId && (
                                <code className="small">{result.fileId}</code>
                              )}
                            </td>
                            <td>
                              {result.checksum && result.clientHash && (
                                <span className={`badge ${result.checksum === result.clientHash ? 'bg-success' : 'bg-warning'}`}>
                                  {result.checksum === result.clientHash ? 'Match' : 'Mismatch'}
                                </span>
                              )}
                            </td>
                            <td>
                              {result.error && (
                                <small className="text-danger">{result.error}</small>
                              )}
                              {result.uploadTimestamp && (
                                <small className="text-muted">
                                  Uploaded: {new Date(result.uploadTimestamp).toLocaleString()}
                                </small>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default FileUpload;
