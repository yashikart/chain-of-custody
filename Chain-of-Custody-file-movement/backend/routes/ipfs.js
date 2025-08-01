const express = require('express');
const multer = require('multer');
const IPFSSimulator = require('../services/ipfsSimulator');

const router = express.Router();

// Initialize IPFS simulator
const ipfs = new IPFSSimulator();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// POST /api/ipfs/add - Add file to IPFS network
router.post('/add', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { pinToNodes } = req.body;
    let nodesToPin = ['node-local']; // Default

    if (pinToNodes) {
      try {
        nodesToPin = JSON.parse(pinToNodes);
      } catch (error) {
        nodesToPin = pinToNodes.split(',').map(id => id.trim());
      }
    }

    const fileObject = await ipfs.addFile(
      req.file.buffer,
      req.file.originalname,
      nodesToPin
    );

    res.status(201).json({
      message: 'File added to IPFS network',
      hash: fileObject.hash,
      name: fileObject.name,
      size: fileObject.size,
      chunks: fileObject.chunks.length,
      replicationFactor: fileObject.replicationFactor,
      pinnedTo: fileObject.pinnedTo,
      addedAt: fileObject.addedAt
    });

  } catch (error) {
    console.error('IPFS add error:', error);
    res.status(500).json({
      error: 'Failed to add file to IPFS',
      message: error.message
    });
  }
});

// GET /api/ipfs/cat/:hash - Retrieve file from IPFS network
router.get('/cat/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const { preferredNode } = req.query;

    const result = await ipfs.retrieveFile(hash, preferredNode);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${result.metadata.name}"`);
    res.setHeader('X-IPFS-Hash', hash);
    res.setHeader('X-Retrieved-From', result.retrievedFrom);
    res.setHeader('X-Retrieval-Latency', result.latency);

    res.send(result.content);

  } catch (error) {
    console.error('IPFS cat error:', error);
    res.status(404).json({
      error: 'Failed to retrieve file from IPFS',
      message: error.message
    });
  }
});

// POST /api/ipfs/pin/:hash - Pin file to additional nodes
router.post('/pin/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const { nodeId } = req.body;

    if (!nodeId) {
      return res.status(400).json({ error: 'Node ID is required' });
    }

    await ipfs.pinFileToNode(hash, nodeId);

    res.json({
      message: 'File pinned successfully',
      hash,
      nodeId,
      pinnedAt: new Date()
    });

  } catch (error) {
    console.error('IPFS pin error:', error);
    res.status(500).json({
      error: 'Failed to pin file',
      message: error.message
    });
  }
});

// DELETE /api/ipfs/pin/:hash - Unpin file from node
router.delete('/pin/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const { nodeId } = req.body;

    if (!nodeId) {
      return res.status(400).json({ error: 'Node ID is required' });
    }

    await ipfs.unpinFileFromNode(hash, nodeId);

    res.json({
      message: 'File unpinned successfully',
      hash,
      nodeId,
      unpinnedAt: new Date()
    });

  } catch (error) {
    console.error('IPFS unpin error:', error);
    res.status(500).json({
      error: 'Failed to unpin file',
      message: error.message
    });
  }
});

// GET /api/ipfs/ls - List all files in IPFS network
router.get('/ls', async (req, res) => {
  try {
    const files = ipfs.getAllFiles();

    res.json({
      files,
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0)
    });

  } catch (error) {
    console.error('IPFS ls error:', error);
    res.status(500).json({
      error: 'Failed to list files',
      message: error.message
    });
  }
});

// GET /api/ipfs/status - Get network status
router.get('/status', async (req, res) => {
  try {
    const status = ipfs.getNetworkStatus();

    res.json({
      network: status,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('IPFS status error:', error);
    res.status(500).json({
      error: 'Failed to get network status',
      message: error.message
    });
  }
});

// GET /api/ipfs/nodes - Get all nodes information
router.get('/nodes', async (req, res) => {
  try {
    const nodes = [];
    
    for (const [nodeId] of ipfs.nodes) {
      const nodeInfo = ipfs.getNodeInfo(nodeId);
      nodes.push(nodeInfo);
    }

    res.json({
      nodes,
      totalNodes: nodes.length,
      onlineNodes: nodes.filter(node => node.status === 'online').length
    });

  } catch (error) {
    console.error('IPFS nodes error:', error);
    res.status(500).json({
      error: 'Failed to get nodes information',
      message: error.message
    });
  }
});

// GET /api/ipfs/nodes/:nodeId - Get specific node information
router.get('/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const nodeInfo = ipfs.getNodeInfo(nodeId);

    res.json(nodeInfo);

  } catch (error) {
    console.error('IPFS node info error:', error);
    res.status(404).json({
      error: 'Failed to get node information',
      message: error.message
    });
  }
});

// POST /api/ipfs/nodes/:nodeId/toggle - Toggle node online/offline status
router.post('/nodes/:nodeId/toggle', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const result = ipfs.toggleNodeStatus(nodeId);

    res.json({
      message: `Node ${nodeId} is now ${result.status}`,
      ...result
    });

  } catch (error) {
    console.error('IPFS node toggle error:', error);
    res.status(404).json({
      error: 'Failed to toggle node status',
      message: error.message
    });
  }
});

// GET /api/ipfs/verify/:hash - Verify file integrity across nodes
router.get('/verify/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const verification = await ipfs.verifyFileIntegrity(hash);

    res.json(verification);

  } catch (error) {
    console.error('IPFS verify error:', error);
    res.status(404).json({
      error: 'Failed to verify file integrity',
      message: error.message
    });
  }
});

// GET /api/ipfs/info/:hash - Get file information
router.get('/info/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const files = ipfs.getAllFiles();
    const file = files.find(f => f.hash === hash);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get additional node information
    const nodeDetails = file.pinnedTo.map(nodeId => {
      try {
        const nodeInfo = ipfs.getNodeInfo(nodeId);
        return {
          id: nodeId,
          name: nodeInfo.name,
          location: nodeInfo.location,
          status: nodeInfo.status,
          latency: nodeInfo.latency
        };
      } catch (error) {
        return {
          id: nodeId,
          error: error.message
        };
      }
    });

    res.json({
      ...file,
      nodeDetails,
      availableNodes: nodeDetails.filter(node => node.status === 'online').length
    });

  } catch (error) {
    console.error('IPFS info error:', error);
    res.status(500).json({
      error: 'Failed to get file information',
      message: error.message
    });
  }
});

// POST /api/ipfs/replicate/:hash - Replicate file to more nodes
router.post('/replicate/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const { targetReplication = 3 } = req.body;

    const files = ipfs.getAllFiles();
    const file = files.find(f => f.hash === hash);

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.replicationFactor >= targetReplication) {
      return res.json({
        message: 'File already has sufficient replication',
        currentReplication: file.replicationFactor,
        targetReplication
      });
    }

    // Find available nodes not currently storing the file
    const availableNodes = [];
    for (const [nodeId] of ipfs.nodes) {
      const nodeInfo = ipfs.getNodeInfo(nodeId);
      if (nodeInfo.status === 'online' && !file.pinnedTo.includes(nodeId)) {
        availableNodes.push(nodeId);
      }
    }

    const nodesToAdd = availableNodes.slice(0, targetReplication - file.replicationFactor);
    const results = [];

    for (const nodeId of nodesToAdd) {
      try {
        await ipfs.pinFileToNode(hash, nodeId);
        results.push({ nodeId, status: 'success' });
      } catch (error) {
        results.push({ nodeId, status: 'failed', error: error.message });
      }
    }

    // Get updated file info
    const updatedFiles = ipfs.getAllFiles();
    const updatedFile = updatedFiles.find(f => f.hash === hash);

    res.json({
      message: 'Replication completed',
      hash,
      previousReplication: file.replicationFactor,
      currentReplication: updatedFile.replicationFactor,
      targetReplication,
      results
    });

  } catch (error) {
    console.error('IPFS replicate error:', error);
    res.status(500).json({
      error: 'Failed to replicate file',
      message: error.message
    });
  }
});

module.exports = router;
