const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * IPFS Storage Simulator
 * Simulates IPFS-like distributed storage with hash-based addressing
 */
class IPFSSimulator {
  constructor() {
    this.nodes = new Map();
    this.files = new Map(); // Global file registry
    this.storageDir = path.join(__dirname, '../ipfs-storage');
    this.initializeNodes();
    this.ensureStorageDirectory();
  }

  /**
   * Initialize default IPFS nodes
   */
  initializeNodes() {
    const defaultNodes = [
      { id: 'node-local', name: 'Local Node', location: 'Local', status: 'online' },
      { id: 'node-us-east', name: 'US East Node', location: 'US-East-1', status: 'online' },
      { id: 'node-eu-west', name: 'EU West Node', location: 'EU-West-1', status: 'online' },
      { id: 'node-asia', name: 'Asia Node', location: 'Asia-Pacific', status: 'offline' }
    ];

    defaultNodes.forEach(nodeConfig => {
      this.nodes.set(nodeConfig.id, {
        ...nodeConfig,
        files: new Set(),
        storage: new Map(),
        lastSeen: new Date(),
        bandwidth: Math.random() * 100 + 50, // Simulated bandwidth
        latency: Math.random() * 200 + 10 // Simulated latency
      });
    });
  }

  /**
   * Ensure storage directory exists
   */
  ensureStorageDirectory() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    // Create node-specific directories
    this.nodes.forEach((node, nodeId) => {
      const nodeDir = path.join(this.storageDir, nodeId);
      if (!fs.existsSync(nodeDir)) {
        fs.mkdirSync(nodeDir, { recursive: true });
      }
    });
  }

  /**
   * Generate IPFS-like hash for content
   * @param {Buffer} content - File content
   * @returns {string} - IPFS-like hash
   */
  generateIPFSHash(content) {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    // Simulate IPFS multihash format (simplified)
    return `Qm${hash.substring(0, 44)}`;
  }

  /**
   * Calculate file chunks (simulate IPFS chunking)
   * @param {Buffer} content - File content
   * @param {number} chunkSize - Chunk size in bytes
   * @returns {Array} - Array of chunk objects
   */
  calculateChunks(content, chunkSize = 256 * 1024) {
    const chunks = [];
    const totalChunks = Math.ceil(content.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, content.length);
      const chunkContent = content.slice(start, end);
      const chunkHash = this.generateIPFSHash(chunkContent);

      chunks.push({
        index: i,
        hash: chunkHash,
        size: end - start,
        start,
        end,
        content: chunkContent
      });
    }

    return chunks;
  }

  /**
   * Add file to IPFS network
   * @param {Buffer} content - File content
   * @param {string} fileName - Original file name
   * @param {Array<string>} pinToNodes - Node IDs to pin the file to
   * @returns {Object} - File object with IPFS hash
   */
  async addFile(content, fileName, pinToNodes = ['node-local']) {
    const ipfsHash = this.generateIPFSHash(content);
    const chunks = this.calculateChunks(content);
    
    const fileObject = {
      hash: ipfsHash,
      name: fileName,
      size: content.length,
      chunks: chunks.map(chunk => ({
        index: chunk.index,
        hash: chunk.hash,
        size: chunk.size,
        start: chunk.start,
        end: chunk.end
      })),
      addedAt: new Date(),
      pinned: true,
      pinnedTo: [],
      replicationFactor: 0
    };

    // Store file in global registry
    this.files.set(ipfsHash, {
      ...fileObject,
      content,
      chunks: chunks // Include actual content for chunks
    });

    // Pin to specified nodes
    for (const nodeId of pinToNodes) {
      await this.pinFileToNode(ipfsHash, nodeId);
    }

    return fileObject;
  }

  /**
   * Pin file to a specific node
   * @param {string} ipfsHash - IPFS hash of the file
   * @param {string} nodeId - Node ID to pin to
   * @returns {boolean} - Success status
   */
  async pinFileToNode(ipfsHash, nodeId) {
    const node = this.nodes.get(nodeId);
    const file = this.files.get(ipfsHash);

    if (!node || !file) {
      throw new Error('Node or file not found');
    }

    if (node.status !== 'online') {
      throw new Error('Node is offline');
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, node.latency));

    // Add file to node
    node.files.add(ipfsHash);
    node.storage.set(ipfsHash, {
      hash: ipfsHash,
      pinnedAt: new Date(),
      size: file.size
    });

    // Store file chunks physically
    const nodeDir = path.join(this.storageDir, nodeId);
    const fileDir = path.join(nodeDir, ipfsHash);
    
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    // Store main file
    fs.writeFileSync(path.join(fileDir, 'content'), file.content);

    // Store chunks
    file.chunks.forEach(chunk => {
      fs.writeFileSync(path.join(fileDir, `chunk-${chunk.index}`), chunk.content);
    });

    // Store metadata
    fs.writeFileSync(path.join(fileDir, 'metadata.json'), JSON.stringify({
      hash: ipfsHash,
      name: file.name,
      size: file.size,
      chunks: file.chunks.map(c => ({ index: c.index, hash: c.hash, size: c.size })),
      pinnedAt: new Date(),
      nodeId
    }, null, 2));

    // Update file object
    const globalFile = this.files.get(ipfsHash);
    globalFile.pinnedTo.push(nodeId);
    globalFile.replicationFactor = globalFile.pinnedTo.length;

    return true;
  }

  /**
   * Unpin file from a node
   * @param {string} ipfsHash - IPFS hash of the file
   * @param {string} nodeId - Node ID to unpin from
   * @returns {boolean} - Success status
   */
  async unpinFileFromNode(ipfsHash, nodeId) {
    const node = this.nodes.get(nodeId);
    
    if (!node) {
      throw new Error('Node not found');
    }

    // Remove from node
    node.files.delete(ipfsHash);
    node.storage.delete(ipfsHash);

    // Remove physical storage
    const nodeDir = path.join(this.storageDir, nodeId);
    const fileDir = path.join(nodeDir, ipfsHash);
    
    if (fs.existsSync(fileDir)) {
      fs.rmSync(fileDir, { recursive: true, force: true });
    }

    // Update global file object
    const file = this.files.get(ipfsHash);
    if (file) {
      file.pinnedTo = file.pinnedTo.filter(id => id !== nodeId);
      file.replicationFactor = file.pinnedTo.length;
    }

    return true;
  }

  /**
   * Retrieve file from IPFS network
   * @param {string} ipfsHash - IPFS hash of the file
   * @param {string} preferredNodeId - Preferred node to retrieve from
   * @returns {Object} - File content and metadata
   */
  async retrieveFile(ipfsHash, preferredNodeId = null) {
    const file = this.files.get(ipfsHash);
    
    if (!file) {
      throw new Error('File not found in network');
    }

    // Find available nodes
    const availableNodes = Array.from(this.nodes.entries())
      .filter(([nodeId, node]) => 
        node.status === 'online' && 
        node.files.has(ipfsHash)
      );

    if (availableNodes.length === 0) {
      throw new Error('File not available on any online nodes');
    }

    // Select node (prefer specified node, otherwise fastest)
    let selectedNode;
    if (preferredNodeId && availableNodes.find(([id]) => id === preferredNodeId)) {
      selectedNode = availableNodes.find(([id]) => id === preferredNodeId);
    } else {
      // Select node with lowest latency
      selectedNode = availableNodes.reduce((fastest, current) => 
        current[1].latency < fastest[1].latency ? current : fastest
      );
    }

    const [nodeId, node] = selectedNode;

    // Simulate retrieval delay
    await new Promise(resolve => setTimeout(resolve, node.latency));

    // Read file from storage
    const nodeDir = path.join(this.storageDir, nodeId);
    const fileDir = path.join(nodeDir, ipfsHash);
    const contentPath = path.join(fileDir, 'content');
    const metadataPath = path.join(fileDir, 'metadata.json');

    if (!fs.existsSync(contentPath)) {
      throw new Error('File content not found on node');
    }

    const content = fs.readFileSync(contentPath);
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    return {
      hash: ipfsHash,
      content,
      metadata,
      retrievedFrom: nodeId,
      retrievedAt: new Date(),
      latency: node.latency
    };
  }

  /**
   * Get network status
   * @returns {Object} - Network statistics
   */
  getNetworkStatus() {
    const onlineNodes = Array.from(this.nodes.values()).filter(node => node.status === 'online');
    const totalFiles = this.files.size;
    const totalSize = Array.from(this.files.values()).reduce((sum, file) => sum + file.size, 0);
    
    const replicationStats = Array.from(this.files.values()).reduce((stats, file) => {
      const factor = file.replicationFactor;
      stats[factor] = (stats[factor] || 0) + 1;
      return stats;
    }, {});

    return {
      totalNodes: this.nodes.size,
      onlineNodes: onlineNodes.length,
      totalFiles,
      totalSize,
      replicationStats,
      averageReplication: totalFiles > 0 ? 
        Array.from(this.files.values()).reduce((sum, file) => sum + file.replicationFactor, 0) / totalFiles : 0
    };
  }

  /**
   * Get node information
   * @param {string} nodeId - Node ID
   * @returns {Object} - Node details
   */
  getNodeInfo(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error('Node not found');
    }

    const files = Array.from(node.files).map(hash => {
      const file = this.files.get(hash);
      const storage = node.storage.get(hash);
      return {
        hash,
        name: file?.name,
        size: file?.size,
        pinnedAt: storage?.pinnedAt
      };
    });

    return {
      id: nodeId,
      name: node.name,
      location: node.location,
      status: node.status,
      lastSeen: node.lastSeen,
      bandwidth: node.bandwidth,
      latency: node.latency,
      filesCount: node.files.size,
      files,
      totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0)
    };
  }

  /**
   * Toggle node status
   * @param {string} nodeId - Node ID
   * @returns {Object} - Updated node status
   */
  toggleNodeStatus(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error('Node not found');
    }

    node.status = node.status === 'online' ? 'offline' : 'online';
    node.lastSeen = new Date();

    return {
      id: nodeId,
      status: node.status,
      lastSeen: node.lastSeen
    };
  }

  /**
   * Get all files in the network
   * @returns {Array} - Array of file objects
   */
  getAllFiles() {
    return Array.from(this.files.values()).map(file => ({
      hash: file.hash,
      name: file.name,
      size: file.size,
      addedAt: file.addedAt,
      replicationFactor: file.replicationFactor,
      pinnedTo: file.pinnedTo,
      chunks: file.chunks.map(c => ({ index: c.index, hash: c.hash, size: c.size }))
    }));
  }

  /**
   * Verify file integrity across nodes
   * @param {string} ipfsHash - IPFS hash to verify
   * @returns {Object} - Verification results
   */
  async verifyFileIntegrity(ipfsHash) {
    const file = this.files.get(ipfsHash);
    if (!file) {
      throw new Error('File not found');
    }

    const results = {
      hash: ipfsHash,
      verifiedAt: new Date(),
      nodes: {},
      consistent: true,
      errors: []
    };

    for (const nodeId of file.pinnedTo) {
      const node = this.nodes.get(nodeId);
      if (node.status !== 'online') {
        results.nodes[nodeId] = { status: 'offline' };
        continue;
      }

      try {
        const nodeDir = path.join(this.storageDir, nodeId);
        const fileDir = path.join(nodeDir, ipfsHash);
        const contentPath = path.join(fileDir, 'content');

        if (!fs.existsSync(contentPath)) {
          results.nodes[nodeId] = { status: 'missing' };
          results.consistent = false;
          results.errors.push(`File missing on node ${nodeId}`);
          continue;
        }

        const content = fs.readFileSync(contentPath);
        const actualHash = this.generateIPFSHash(content);

        if (actualHash === ipfsHash) {
          results.nodes[nodeId] = { status: 'verified', hash: actualHash };
        } else {
          results.nodes[nodeId] = { status: 'corrupted', expected: ipfsHash, actual: actualHash };
          results.consistent = false;
          results.errors.push(`Hash mismatch on node ${nodeId}`);
        }
      } catch (error) {
        results.nodes[nodeId] = { status: 'error', error: error.message };
        results.consistent = false;
        results.errors.push(`Error verifying on node ${nodeId}: ${error.message}`);
      }
    }

    return results;
  }
}

module.exports = IPFSSimulator;
