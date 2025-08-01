import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  getReports, 
  exportCSV, 
  exportXML,
  downloadBlob,
  formatFileSize,
  formatDate 
} from '../services/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    startDate: '',
    endDate: '',
    department: '',
    caseNumber: '',
    status: '',
    evidenceType: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    byStatus: {},
    byDepartment: {},
    byEvidenceType: {}
  });

  // Load reports data
  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await getReports(filters);
      setReports(response.data);
      setPagination(response.pagination);
      
      // Calculate statistics
      calculateStats(response.data);
    } catch (error) {
      toast.error('Failed to load reports: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from data
  const calculateStats = (data) => {
    const stats = {
      totalFiles: data.length,
      totalSize: data.reduce((sum, file) => sum + file.fileSize, 0),
      byStatus: {},
      byDepartment: {},
      byEvidenceType: {}
    };

    data.forEach(file => {
      // Status stats
      stats.byStatus[file.status] = (stats.byStatus[file.status] || 0) + 1;
      
      // Department stats
      const dept = file.metadata?.department || 'Unknown';
      stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
      
      // Evidence type stats
      const evidenceType = file.metadata?.evidenceType || 'Unknown';
      stats.byEvidenceType[evidenceType] = (stats.byEvidenceType[evidenceType] || 0) + 1;
    });

    setStats(stats);
  };

  useEffect(() => {
    loadReports();
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

  // Export as CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await exportCSV(filters);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      downloadBlob(response, `chain-of-custody-report_${timestamp}.csv`);
      toast.success('CSV export completed successfully');
    } catch (error) {
      toast.error('Failed to export CSV: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  // Export as XML
  const handleExportXML = async () => {
    setExporting(true);
    try {
      const response = await exportXML(filters);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      downloadBlob(response, `chain-of-custody-report_${timestamp}.xml`);
      toast.success('XML export completed successfully');
    } catch (error) {
      toast.error('Failed to export XML: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      startDate: '',
      endDate: '',
      department: '',
      caseNumber: '',
      status: '',
      evidenceType: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  Reports & Analytics
                </h4>
                <div className="btn-group">
                  <button
                    className="btn btn-success"
                    onClick={handleExportCSV}
                    disabled={exporting}
                  >
                    <i className="fas fa-file-csv me-2"></i>
                    Export CSV
                  </button>
                  <button
                    className="btn btn-info"
                    onClick={handleExportXML}
                    disabled={exporting}
                  >
                    <i className="fas fa-file-code me-2"></i>
                    Export XML
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {/* Statistics Cards */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="card bg-primary text-white">
                    <div className="card-body text-center">
                      <h3>{stats.totalFiles}</h3>
                      <p className="mb-0">Total Files</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-success text-white">
                    <div className="card-body text-center">
                      <h3>{formatFileSize(stats.totalSize)}</h3>
                      <p className="mb-0">Total Size</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-warning text-white">
                    <div className="card-body text-center">
                      <h3>{Object.keys(stats.byDepartment).length}</h3>
                      <p className="mb-0">Departments</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-info text-white">
                    <div className="card-body text-center">
                      <h3>{Object.keys(stats.byEvidenceType).length}</h3>
                      <p className="mb-0">Evidence Types</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="filter-section">
                <div className="row">
                  <div className="col-md-3">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                    />
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
                </div>
                <div className="row mt-3">
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
                    <label className="form-label">Evidence Type</label>
                    <select
                      className="form-select"
                      name="evidenceType"
                      value={filters.evidenceType}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Types</option>
                      <option value="Document">Document</option>
                      <option value="Image">Image</option>
                      <option value="Video">Video</option>
                      <option value="Audio">Audio</option>
                      <option value="Log File">Log File</option>
                      <option value="Database">Database</option>
                      <option value="Other">Other</option>
                    </select>
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
                  <div className="col-md-3">
                    <label className="form-label">Actions</label>
                    <div>
                      <button
                        className="btn btn-outline-secondary me-2"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </button>
                    </div>
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

              {/* Reports Table */}
              {!loading && (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>File Name</th>
                          <th>Size</th>
                          <th>Status</th>
                          <th>Department</th>
                          <th>Case Number</th>
                          <th>Evidence Type</th>
                          <th>Location</th>
                          <th>Created</th>
                          <th>Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((file) => (
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
                              <span className={`badge ${
                                file.status === 'active' ? 'bg-success' : 
                                file.status === 'archived' ? 'bg-warning' : 'bg-danger'
                              }`}>
                                {file.status}
                              </span>
                            </td>
                            <td>{file.metadata?.department || '-'}</td>
                            <td>{file.metadata?.caseNumber || '-'}</td>
                            <td>{file.metadata?.evidenceType || '-'}</td>
                            <td>{file.currentLocation}</td>
                            <td>{formatDate(file.createdAt)}</td>
                            <td>{formatDate(file.updatedAt)}</td>
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

              {/* Statistics Breakdown */}
              <div className="row mt-4">
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Files by Status</h6>
                    </div>
                    <div className="card-body">
                      {Object.entries(stats.byStatus).map(([status, count]) => (
                        <div key={status} className="d-flex justify-content-between">
                          <span className="text-capitalize">{status}:</span>
                          <strong>{count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Files by Department</h6>
                    </div>
                    <div className="card-body">
                      {Object.entries(stats.byDepartment).slice(0, 5).map(([dept, count]) => (
                        <div key={dept} className="d-flex justify-content-between">
                          <span>{dept}:</span>
                          <strong>{count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Files by Evidence Type</h6>
                    </div>
                    <div className="card-body">
                      {Object.entries(stats.byEvidenceType).slice(0, 5).map(([type, count]) => (
                        <div key={type} className="d-flex justify-content-between">
                          <span>{type}:</span>
                          <strong>{count}</strong>
                        </div>
                      ))}
                    </div>
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

export default Reports;
