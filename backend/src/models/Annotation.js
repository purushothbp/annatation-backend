const mongoose = require('mongoose');
const crypto = require('crypto');

const selectorSchema = new mongoose.Schema(
  {
    start: { type: Number, required: true, min: 0 },
    end: { type: Number, required: true, min: 0 },
    page: { type: Number, min: 0 },
  },
  { _id: false }
);

const quoteSelectorSchema = new mongoose.Schema(
  {
    exact: { type: String, required: true },
    prefix: { type: String },
    suffix: { type: String },
  },
  { _id: false }
);

const annotationSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    selector: { type: selectorSchema, required: true },
    quoteSelector: { type: quoteSelectorSchema, required: true },
    body: { type: String, required: true },
    rangeHash: { type: String, required: true, unique: true },
    orphaned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

annotationSchema.index({ documentId: 1, 'selector.start': 1, 'selector.end': 1 });
annotationSchema.index({ documentId: 1, createdAt: -1 });

annotationSchema.statics.buildRangeHash = ({ documentId, selector, userId }) => {
  const hash = crypto.createHash('sha256');
  hash.update(String(documentId));
  hash.update(':');
  hash.update(String(userId));
  hash.update(':');
  hash.update(`${selector.start}-${selector.end}`);
  return hash.digest('hex');
};

module.exports = mongoose.model('Annotation', annotationSchema);
