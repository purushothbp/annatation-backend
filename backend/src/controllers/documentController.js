const fsp = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const { env } = require('../config/env');
const Document = require('../models/Document');
const Annotation = require('../models/Annotation');
const { storeExtractedText } = require('../services/textExtractionService');

const ensureDirs = async () => {
  await fsp.mkdir(env.uploadDir, { recursive: true });
  await fsp.mkdir(env.textDir, { recursive: true });
};

const listDocuments = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Document.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Document.countDocuments({}),
  ]);

  res.json({
    data: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

const uploadDocument = async (req, res) => {
  await ensureDirs();

  const filePart = req.file;
  const fields = req.body || {};

  if (!filePart) {
    return res.status(400).json({ message: 'PDF file is required' });
  }

  if (filePart.mimetype !== 'application/pdf') {
    return res.status(400).json({ message: 'Only PDF files are supported' });
  }

  const title = fields.title || filePart.originalname || 'Untitled Document';
  const pdfBuffer = filePart.buffer;

  const documentId = new mongoose.Types.ObjectId();
  const pdfFileName = `${documentId}.pdf`;
  const pdfPath = path.join(env.uploadDir, pdfFileName);
  await fsp.writeFile(pdfPath, pdfBuffer);

  const document = await Document.create({
    _id: documentId,
    title,
    ownerId: req.user.sub,
    storageLocation: pdfFileName,
    mimeType: filePart.mimetype,
    extractionStatus: 'processing',
  });

  setImmediate(async () => {
    try {
      const { textFileName, metaFileName } = await storeExtractedText({
        documentId: document._id.toString(),
        buffer: pdfBuffer,
      });
      await Document.findByIdAndUpdate(
        documentId,
        {
          textLocation: textFileName,
          textMetadataLocation: metaFileName,
          textExtractedAt: new Date(),
          extractionStatus: 'complete',
          extractionError: undefined,
        },
        { new: true }
      );
    } catch (error) {
      await Document.findByIdAndUpdate(
        documentId,
        {
          extractionStatus: 'failed',
          extractionError: error.message,
        },
        { new: true }
      );
      console.error('Text extraction failed', error);
    }
  });

  res.status(202).json({ document });
};

const getDocument = async (req, res) => {
  const { id } = req.params;
  const document = await Document.findById(id);

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  res.json({ document });
};

const getDocumentText = async (req, res) => {
  const { id } = req.params;
  const document = await Document.findById(id);

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  if (!document.textLocation) {
    return res.status(202).json({ message: 'Text extraction pending', status: document.extractionStatus });
  }

  const textPath = path.join(env.textDir, document.textLocation);
  try {
    const textContent = await fsp.readFile(textPath, 'utf8');
    res
      .set('Content-Type', 'text/plain; charset=utf-8')
      .set('Cache-Control', 'no-store')
      .send(textContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(500).json({ message: 'Extracted text missing' });
    }
    return res.status(500).json({ message: 'Extracted text missing' });
  }
};

const getDocumentTextMetadata = async (req, res) => {
  const { id } = req.params;
  const document = await Document.findById(id);

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  if (!document.textMetadataLocation) {
    return res.status(202).json({ message: 'Metadata not ready', status: document.extractionStatus });
  }

  const metaPath = path.join(env.textDir, document.textMetadataLocation);
  try {
    const contents = await fsp.readFile(metaPath, 'utf8');
    res.json({ metadata: JSON.parse(contents) });
  } catch (error) {
    console.error('Failed to read metadata', error);
    res.status(500).json({ message: 'Failed to read metadata' });
  }
};

const getAnnotations = async (req, res) => {
  const { id } = req.params;
  const limit = Number(req.query.limit || 50);
  const { cursor } = req.query;
  const document = await Document.findById(id);

  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const query = { documentId: id };
  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      return res.status(400).json({ message: 'Invalid cursor' });
    }
    query._id = { $gt: new mongoose.Types.ObjectId(cursor) };
  }

  const annotations = await Annotation.find(query)
    .sort({ _id: 1 })
    .limit(limit + 1)
    .lean();

  const hasMore = annotations.length > limit;
  const data = hasMore ? annotations.slice(0, limit) : annotations;
  const nextCursor = hasMore ? data[data.length - 1]._id : null;

  res.json({
    data,
    pagination: {
      cursor: nextCursor,
      hasMore,
    },
  });
};

module.exports = {
  listDocuments,
  uploadDocument,
  getDocument,
  getDocumentText,
  getDocumentTextMetadata,
  getAnnotations,
};
