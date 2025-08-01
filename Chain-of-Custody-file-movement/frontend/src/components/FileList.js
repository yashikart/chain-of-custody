import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  getFileList, 
  moveFile, 
  downloadFile, 
  getFileStatus,
  formatFileSize, 
  formatDate, 
  getStatusBadgeClass,
  downloadBlob
} from '../services/api';

const FileList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    department: '',
    caseNumber: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveData, setMoveData] = useState({
    newLocation: '',
    userId: '',
    notes: ''
  });

  // Load files
  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await getFileList(filters);
      setFiles(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load files: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
      page: 1 // Reset to first page when filtering
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle file move
  const handleMoveFile = async () => {
    if (!moveData.userId || !moveData.newLocation) {
      toast.error('User ID and new location are required');
      return;
    }

    try {
      await moveFile({
        fileId: selectedFile.fileId,
        userId: moveData.userId,
        newLocation: moveData.newLocation,
        notes: moveData.notes
      });
      
      toast.success('File moved successfully');
      setShowMoveModal(false);
      setMoveData({ newLocation: '', userId: '', notes: '' });
      loadFiles(); // Refresh the list
    } catch (error) {
      toast.error('Failed to move file: ' + error.response?.data?.message || error.message);
    }
  };

  // Handle file download
  const handleDownload = async (file) => {
    const userId = prompt('Enter your User ID for download tracking:');
    if (!userId) return;

    try {
      const response = await downloadFile(file.fileId, userId, 'Downloaded from file list');
      downloadBlob(response, file.originalFileName);
      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file: ' + error.response?.data?.message || error.message);
    }
  };

  // View file details
  const viewFileDetails = async (file) => {
    try {
      const details = await getFileStatus(file.fileId);
      setSelectedFile(details);
    } catch (error) {
      toast.error('Failed to load file details: ' + error.message);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-list me-2"></i>
                File List
              </h4>
            </div>
            <div className="card-body">
              {/* Filters */}
              <div className="filter-section">
                <div className="row">
                  <div className="col-md-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                      <option value="deleted">Deleted</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      name="department"
                      value={filters.department}
                      onChange={handleFilterChange}
                      placeholder="Filter by department"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Case Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="caseNumber"
                      value={filters.caseNumber}
                      onChange={handleFilterChange}
                      placeholder="Filter by case number"
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Sort By</label>
                    <select
                      className="form-select"
                      name="sortBy"
                      value={filters.sortBy}
                      onChange={handleFilterChange}
                    >
                      <option value="createdAt">Created Date</option>
                      <option value="originalFileName">File Name</option>
                      <option value="fileSize">File Size</option>
                      <option value="currentLocation">Location</option>
                    </select>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-3">
                    <label className="form-label">Sort Order</label>
                    <select
                      className="form-select"
                      name="sortOrder"
                      value={filters.sortOrder}
                      onChange={handleFilterChange}
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Items per page</label>
                    <select
                      className="form-select"
                      name="limit"
                      value={filters.limit}
                      onChange={handleFilterChange}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Loading */}
              {loading && (
                <div className="loading-spinner">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}

              {/* Files Table */}
              {!loading && (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>File Name</th>
                          <th>Size</th>
                          <th>Status</th>
                          <th>Location</th>
                          <th>Department</th>
                          <th>Case Number</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((file) => (
                          <tr key={file.fileId}>
                            <td>
                              <div>
                                <strong>{file.originalFileName}</strong>
                                <br />
                                <small className="text-muted">{file.mimeType}</small>
                              </div>
                            </td>
                            <td>{formatFileSize(file.fileSize)}</td>
                            <td>
                              <span className={getStatusBadgeClass(file.status)}>
                                {file.status}
                              </span>
                            </td>
                            <td>{file.currentLocation}</td>
                            <td>{file.metadata?.department || '-'}</td>
                            <td>{file.metadata?.caseNumber || '-'}</td>
                            <td>{formatDate(file.createdAt)}</td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => viewFileDetails(file)}
                                  title="View Details"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => handleDownload(file)}
                                  title="Download"
                                >
                                  <i className="fas fa-download"></i>
                                </button>
                                <button
                                  className="btn btn-outline-warning"
                                  onClick={() => {
                                    setSelectedFile(file);
                                    setShowMoveModal(true);
                                  }}
                                  title="Move File"
                                >
                                  <i className="fas fa-arrows-alt"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="pagination-controls">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPreviousPage}
                      >
                        <i className="fas fa-chevron-left"></i> Previous
                      </button>
                      
                      <span className="mx-3">
                        Page {pagination.currentPage} of {pagination.totalPages}
                        ({pagination.totalRecords} total records)
                      </span>
                      
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        Next <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Move File Modal */}
      {showMoveModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Move File</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowMoveModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p><strong>File:</strong> {selectedFile?.originalFileName}</p>
                <p><strong>Current Location:</strong> {selectedFile?.currentLocation}</p>
                
                <div className="mb-3">
                  <label className="form-label">User ID *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={moveData.userId}
                    onChange={(e) => setMoveData(prev => ({ ...prev, userId: e.target.value }))}
                    placeholder="Enter your user ID"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">New Location *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={moveData.newLocation}
                    onChange={(e) => setMoveData(prev => ({ ...prev, newLocation: e.target.value }))}
                    placeholder="e.g., archive, secure-storage"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    value={moveData.notes}
                    onChange={(e) => setMoveData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    placeholder="Reason for moving the file"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowMoveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleMoveFile}
                >
                  Move File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;
