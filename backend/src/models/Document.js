const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    storageLocation: { type: String, required: true },
    mimeType: { type: String, default: 'application/pdf' },
    textLocation: { type: String },
    textMetadataLocation: { type: String },
    version: { type: Number, default: 1 },
    uploadedAt: { type: Date, default: Date.now },
    textExtractedAt: { type: Date },
    extractionStatus: {
      type: String,
      enum: ['pending', 'processing', 'complete', 'failed'],
      default: 'pending',
    },
    extractionError: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Document', documentSchema);
