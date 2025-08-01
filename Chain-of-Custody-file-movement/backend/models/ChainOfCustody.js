const mongoose = require('mongoose');

const chainOfCustodySchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    unique: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  checksum: {
    type: String,
    required: true
  },
  custodyChain: [{
    action: {
      type: String,
      enum: ['upload', 'move', 'download', 'access'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    userId: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    notes: {
      type: String
    }
  }],
  currentLocation: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  metadata: {
    department: String,
    caseNumber: String,
    evidenceType: String,
    classification: String,
    tags: [String]
  }
}, {
  timestamps: true
});

// Index for efficient queries
chainOfCustodySchema.index({ fileId: 1 });
chainOfCustodySchema.index({ 'custodyChain.timestamp': -1 });
chainOfCustodySchema.index({ currentLocation: 1 });

// Additional indexes for pagination and filtering
chainOfCustodySchema.index({ status: 1, createdAt: -1 });
chainOfCustodySchema.index({ 'metadata.department': 1, createdAt: -1 });
chainOfCustodySchema.index({ 'metadata.caseNumber': 1 });
chainOfCustodySchema.index({ 'metadata.evidenceType': 1 });
chainOfCustodySchema.index({ 'custodyChain.userId': 1, 'custodyChain.timestamp': -1 });
chainOfCustodySchema.index({ 'custodyChain.action': 1, 'custodyChain.timestamp': -1 });
chainOfCustodySchema.index({ createdAt: -1, status: 1 }); // Compound index for common queries

// Method to add custody event
chainOfCustodySchema.methods.addCustodyEvent = function(eventData) {
  this.custodyChain.push(eventData);
  if (eventData.location) {
    this.currentLocation = eventData.location;
  }
  return this.save();
};

// Static method to find by file ID
chainOfCustodySchema.statics.findByFileId = function(fileId) {
  return this.findOne({ fileId });
};

module.exports = mongoose.model('ChainOfCustody', chainOfCustodySchema);
