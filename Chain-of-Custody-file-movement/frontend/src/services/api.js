import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// File upload service
export const uploadFile = async (formData) => {
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get file status and chain of custody
export const getFileStatus = async (fileId) => {
  const response = await api.get(`/upload/status/${fileId}`);
  return response.data;
};

// Get paginated file list
export const getFileList = async (params = {}) => {
  const response = await api.get('/upload/list', { params });
  return response.data;
};

// Move file to new location
export const moveFile = async (moveData) => {
  const response = await api.post('/move', moveData);
  return response.data;
};

// Get movement history for a file
export const getMoveHistory = async (fileId) => {
  const response = await api.get(`/move/history/${fileId}`);
  return response.data;
};

// Get paginated movement list
export const getMoveList = async (params = {}) => {
  const response = await api.get('/move/list', { params });
  return response.data;
};

// Batch move files
export const batchMoveFiles = async (batchData) => {
  const response = await api.post('/move/batch', batchData);
  return response.data;
};

// Download file
export const downloadFile = async (fileId, userId, notes = '') => {
  const response = await api.get(`/download/${fileId}`, {
    params: { userId, notes },
    responseType: 'blob',
  });
  return response;
};

// Get download info
export const getDownloadInfo = async (fileId) => {
  const response = await api.get(`/download/info/${fileId}`);
  return response.data;
};

// Get paginated download list
export const getDownloadList = async (params = {}) => {
  const response = await api.get('/download/list', { params });
  return response.data;
};

// Log file access
export const logFileAccess = async (accessData) => {
  const response = await api.post('/download/access-log', accessData);
  return response.data;
};

// Get comprehensive reports
export const getReports = async (params = {}) => {
  const response = await api.get('/reports/files', { params });
  return response.data;
};

// Export data as CSV
export const exportCSV = async (params = {}) => {
  const response = await api.get('/reports/export/csv', {
    params,
    responseType: 'blob',
  });
  return response;
};

// Export data as XML
export const exportXML = async (params = {}) => {
  const response = await api.get('/reports/export/xml', {
    params,
    responseType: 'blob',
  });
  return response;
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Utility function to download blob response
export const downloadBlob = (response, filename) => {
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Utility function to format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Utility function to format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

// Utility function to get status badge class
export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'active':
      return 'badge bg-success';
    case 'archived':
      return 'badge bg-warning';
    case 'deleted':
      return 'badge bg-danger';
    default:
      return 'badge bg-secondary';
  }
};

// Utility function to get action badge class
export const getActionBadgeClass = (action) => {
  switch (action) {
    case 'upload':
      return 'badge bg-success';
    case 'move':
      return 'badge bg-warning';
    case 'download':
      return 'badge bg-info';
    case 'access':
      return 'badge bg-secondary';
    default:
      return 'badge bg-light text-dark';
  }
};

export default api;
