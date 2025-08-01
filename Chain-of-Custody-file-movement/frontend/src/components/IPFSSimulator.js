import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import CryptoJS from 'crypto-js';

const IPFSSimulator = () => {
  const [ipfsNodes, setIpfsNodes] = useState([
    { id: 'node-1', name: 'Node 1 (Local)', status: 'online', files: [], location: 'Local' },
    { id: 'node-2', name: 'Node 2 (US-East)', status: 'online', files: [], location: 'US-East' },
    { id: 'node-3', name: 'Node 3 (EU-West)', status: 'online', files: [], location: 'EU-West' },
    { id: 'node-4', name: 'Node 4 (Asia)', status: 'offline', files: [], location: 'Asia' }
  ]);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [pinningNodes, setPinningNodes] = useState(['node-1', 'node-2']);
  const [retrievalHistory, setRetrievalHistory] = useState([]);
  const [networkStats, setNetworkStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    replicationFactor: 2,
    onlineNodes: 3
  });

  // Generate IPFS-like hash (simplified)
  const generateIPFSHash = (content) => {
    // Simulate IPFS multihash format (simplified)
    const hash = CryptoJS.SHA256(content).toString();
    return `Qm${hash.substring(0, 44)}`; // IPFS-like format
  };

  // Calculate file chunks (simulate IPFS chunking)
  const calculateChunks = (file) => {
    const chunkSize = 256 * 1024; // 256KB chunks
    const chunks = [];
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      chunks.push({
        index: i,
        start,
        end,
        size: end - start,
        hash: `chunk_${CryptoJS.SHA256(`${file.name}_${i}`).toString().substring(0, 16)}`
      });
    }
    
    return chunks;
  };

  // Add file to IPFS network
  const addFileToIPFS = useCallback(async (file) => {
    try {
      // Read file content
      const content = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsArrayBuffer(file);
      });

      // Generate IPFS hash
      const wordArray = CryptoJS.lib.WordArray.create(content);
      const ipfsHash = generateIPFSHash(wordArray);
      
      // Calculate chunks
      const chunks = calculateChunks(file);
      
      // Create file object
      const ipfsFile = {
        hash: ipfsHash,
        name: file.name,
        size: file.size,
        type: file.type,
        chunks,
        addedAt: new Date(),
        pinned: true,
        replicationFactor: pinningNodes.length
      };

      // Add to selected nodes
      setIpfsNodes(prev => prev.map(node => {
        if (pinningNodes.includes(node.id) && node.status === 'online') {
          return {
            ...node,
            files: [...node.files, ipfsFile]
          };
        }
        return node;
      }));

      // Update network stats
      setNetworkStats(prev => ({
        ...prev,
        totalFiles: prev.totalFiles + 1,
        totalSize: prev.totalSize + file.size
      }));

      toast.success(`File added to IPFS network with hash: ${ipfsHash}`);
      return ipfsFile;
    } catch (error) {
      toast.error('Failed to add file to IPFS: ' + error.message);
      throw error;
    }
  }, [pinningNodes]);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      await addFileToIPFS(file);
    }
  }, [addFileToIPFS]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 50 * 1024 * 1024 // 50MB max
  });

  // Retrieve file from IPFS
  const retrieveFile = (hash) => {
    const availableNodes = ipfsNodes.filter(node => 
      node.status === 'online' && 
      node.files.some(file => file.hash === hash)
    );

    if (availableNodes.length === 0) {
      toast.error('File not available on any online nodes');
      return;
    }

    // Simulate retrieval from fastest node
    const retrievalNode = availableNodes[0];
    const file = retrievalNode.files.find(f => f.hash === hash);
    
    // Add to retrieval history
    setRetrievalHistory(prev => [{
      hash,
      fileName: file.name,
      retrievedFrom: retrievalNode.name,
      retrievedAt: new Date(),
      latency: Math.random() * 500 + 50 // Simulate latency
    }, ...prev.slice(0, 9)]); // Keep last 10 retrievals

    toast.success(`File retrieved from ${retrievalNode.name}`);
    setSelectedFile(file);
  };

  // Pin file to additional nodes
  const pinFile = (hash, nodeId) => {
    const sourceNode = ipfsNodes.find(node => 
      node.files.some(file => file.hash === hash)
    );
    
    if (!sourceNode) {
      toast.error('File not found in network');
      return;
    }

    const file = sourceNode.files.find(f => f.hash === hash);
    
    setIpfsNodes(prev => prev.map(node => {
      if (node.id === nodeId && node.status === 'online') {
        const fileExists = node.files.some(f => f.hash === hash);
        if (!fileExists) {
          return {
            ...node,
            files: [...node.files, { ...file, pinnedAt: new Date() }]
          };
        }
      }
      return node;
    }));

    toast.success(`File pinned to ${ipfsNodes.find(n => n.id === nodeId)?.name}`);
  };

  // Unpin file from node
  const unpinFile = (hash, nodeId) => {
    setIpfsNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          files: node.files.filter(file => file.hash !== hash)
        };
      }
      return node;
    }));

    toast.success('File unpinned from node');
  };

  // Toggle node status
  const toggleNodeStatus = (nodeId) => {
    setIpfsNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        const newStatus = node.status === 'online' ? 'offline' : 'online';
        return { ...node, status: newStatus };
      }
      return node;
    }));

    // Update network stats
    const onlineCount = ipfsNodes.filter(n => n.status === 'online').length;
    setNetworkStats(prev => ({ ...prev, onlineNodes: onlineCount }));
  };

  // Get all unique files in network
  const getAllFiles = () => {
    const fileMap = new Map();
    ipfsNodes.forEach(node => {
      node.files.forEach(file => {
        if (!fileMap.has(file.hash)) {
          fileMap.set(file.hash, {
            ...file,
            availableOn: [node.name],
            replicationCount: 1
          });
        } else {
          const existing = fileMap.get(file.hash);
          existing.availableOn.push(node.name);
          existing.replicationCount++;
        }
      });
    });
    return Array.from(fileMap.values());
  };

  const allFiles = getAllFiles();

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-network-wired me-2"></i>
                IPFS Network Simulator
              </h4>
            </div>
            <div className="card-body">
              {/* Network Statistics */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="card bg-primary text-white">
                    <div className="card-body text-center">
                      <h3>{networkStats.totalFiles}</h3>
                      <p className="mb-0">Total Files</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-success text-white">
                    <div className="card-body text-center">
                      <h3>{(networkStats.totalSize / (1024 * 1024)).toFixed(1)}MB</h3>
                      <p className="mb-0">Total Size</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-info text-white">
                    <div className="card-body text-center">
                      <h3>{networkStats.onlineNodes}</h3>
                      <p className="mb-0">Online Nodes</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-warning text-white">
                    <div className="card-body text-center">
                      <h3>{networkStats.replicationFactor}</h3>
                      <p className="mb-0">Avg Replication</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                {/* File Upload Section */}
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-plus me-2"></i>
                        Add Files to IPFS
                      </h5>
                    </div>
                    <div className="card-body">
                      {/* Pinning Node Selection */}
                      <div className="mb-3">
                        <label className="form-label">Pin to Nodes:</label>
                        <div className="row">
                          {ipfsNodes.map(node => (
                            <div key={node.id} className="col-6 mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={node.id}
                                  checked={pinningNodes.includes(node.id)}
                                  disabled={node.status === 'offline'}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setPinningNodes(prev => [...prev, node.id]);
                                    } else {
                                      setPinningNodes(prev => prev.filter(id => id !== node.id));
                                    }
                                  }}
                                />
                                <label className="form-check-label" htmlFor={node.id}>
                                  {node.name}
                                  <span className={`badge ms-2 ${node.status === 'online' ? 'bg-success' : 'bg-danger'}`}>
                                    {node.status}
                                  </span>
                                </label>
                              </div>
                            </div>
                          ))}
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
                          <h6>
                            {isDragActive
                              ? 'Drop files here...'
                              : 'Drag & drop files to add to IPFS'
                            }
                          </h6>
                          <p className="text-muted small">
                            Files will be chunked and distributed across selected nodes
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Retrieval History */}
                  <div className="card mt-3">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <i className="fas fa-history me-2"></i>
                        Recent Retrievals
                      </h6>
                    </div>
                    <div className="card-body">
                      {retrievalHistory.length === 0 ? (
                        <p className="text-muted text-center">No retrievals yet</p>
                      ) : (
                        <div className="list-group list-group-flush">
                          {retrievalHistory.map((retrieval, index) => (
                            <div key={index} className="list-group-item px-0">
                              <div className="d-flex justify-content-between">
                                <div>
                                  <strong>{retrieval.fileName}</strong>
                                  <br />
                                  <small className="text-muted">
                                    From: {retrieval.retrievedFrom}
                                  </small>
                                </div>
                                <div className="text-end">
                                  <small className="text-muted">
                                    {retrieval.latency.toFixed(0)}ms
                                  </small>
                                  <br />
                                  <small className="text-muted">
                                    {retrieval.retrievedAt.toLocaleTimeString()}
                                  </small>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Network Nodes */}
                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="fas fa-server me-2"></i>
                        Network Nodes
                      </h5>
                    </div>
                    <div className="card-body">
                      {ipfsNodes.map(node => (
                        <div key={node.id} className="card mb-3">
                          <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{node.name}</strong>
                                <span className={`badge ms-2 ${node.status === 'online' ? 'bg-success' : 'bg-danger'}`}>
                                  {node.status}
                                </span>
                              </div>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => toggleNodeStatus(node.id)}
                              >
                                {node.status === 'online' ? 'Go Offline' : 'Go Online'}
                              </button>
                            </div>
                          </div>
                          <div className="card-body">
                            <p className="small text-muted mb-2">
                              Location: {node.location} • Files: {node.files.length}
                            </p>
                            
                            {node.files.length > 0 ? (
                              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                {node.files.map((file, index) => (
                                  <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                                    <div>
                                      <small className="fw-bold">{file.name}</small>
                                      <br />
                                      <code className="small">{file.hash}</code>
                                    </div>
                                    <div className="btn-group btn-group-sm">
                                      <button
                                        className="btn btn-outline-primary"
                                        onClick={() => retrieveFile(file.hash)}
                                        title="Retrieve"
                                      >
                                        <i className="fas fa-download"></i>
                                      </button>
                                      <button
                                        className="btn btn-outline-danger"
                                        onClick={() => unpinFile(file.hash, node.id)}
                                        title="Unpin"
                                      >
                                        <i className="fas fa-unlink"></i>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted small text-center">No files stored</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* All Files in Network */}
              <div className="card mt-4">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-globe me-2"></i>
                    Files in Network
                  </h5>
                </div>
                <div className="card-body">
                  {allFiles.length === 0 ? (
                    <p className="text-muted text-center">No files in network</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>File Name</th>
                            <th>IPFS Hash</th>
                            <th>Size</th>
                            <th>Replication</th>
                            <th>Available On</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allFiles.map((file, index) => (
                            <tr key={index}>
                              <td>{file.name}</td>
                              <td><code className="small">{file.hash}</code></td>
                              <td>{(file.size / 1024).toFixed(1)} KB</td>
                              <td>
                                <span className={`badge ${file.replicationCount >= 2 ? 'bg-success' : 'bg-warning'}`}>
                                  {file.replicationCount}x
                                </span>
                              </td>
                              <td>
                                <small>{file.availableOn.join(', ')}</small>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => retrieveFile(file.hash)}
                                  >
                                    <i className="fas fa-download"></i>
                                  </button>
                                  <div className="dropdown">
                                    <button
                                      className="btn btn-outline-secondary dropdown-toggle"
                                      type="button"
                                      data-bs-toggle="dropdown"
                                    >
                                      Pin
                                    </button>
                                    <ul className="dropdown-menu">
                                      {ipfsNodes.filter(node => 
                                        node.status === 'online' && 
                                        !file.availableOn.includes(node.name)
                                      ).map(node => (
                                        <li key={node.id}>
                                          <button
                                            className="dropdown-item"
                                            onClick={() => pinFile(file.hash, node.id)}
                                          >
                                            {node.name}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected File Details */}
              {selectedFile && (
                <div className="card mt-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="fas fa-info-circle me-2"></i>
                      File Details: {selectedFile.name}
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>IPFS Hash:</strong> <code>{selectedFile.hash}</code></p>
                        <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(1)} KB</p>
                        <p><strong>Type:</strong> {selectedFile.type}</p>
                        <p><strong>Chunks:</strong> {selectedFile.chunks.length}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Added:</strong> {selectedFile.addedAt.toLocaleString()}</p>
                        <p><strong>Pinned:</strong> {selectedFile.pinned ? 'Yes' : 'No'}</p>
                        <p><strong>Replication Factor:</strong> {selectedFile.replicationFactor}</p>
                      </div>
                    </div>
                    
                    <h6 className="mt-3">File Chunks:</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Chunk</th>
                            <th>Hash</th>
                            <th>Size</th>
                            <th>Range</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedFile.chunks.map((chunk, index) => (
                            <tr key={index}>
                              <td>{chunk.index}</td>
                              <td><code className="small">{chunk.hash}</code></td>
                              <td>{(chunk.size / 1024).toFixed(1)} KB</td>
                              <td>{chunk.start}-{chunk.end}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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

export default IPFSSimulator;
