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

const listDocuments = async (request, reply) => {
  const page = Number(request.query.page || 1);
  const limit = Number(request.query.limit || 10);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Document.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Document.countDocuments({}),
  ]);

  reply.send({
    data: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

const uploadDocument = async (request, reply) => {
  await ensureDirs();

  const parts = request.parts();
  const fields = {};
  let filePart;

  for await (const part of parts) {
    if (part.type === 'file') {
      filePart = part;
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  if (!filePart) {
    return reply.code(400).send({ message: 'PDF file is required' });
  }

  if (filePart.mimetype !== 'application/pdf') {
    return reply.code(400).send({ message: 'Only PDF files are supported' });
  }

  const title = fields.title || filePart.filename || 'Untitled Document';

  const tempBufferChunks = [];
  for await (const chunk of filePart.file) {
    tempBufferChunks.push(chunk);
  }
  const pdfBuffer = Buffer.concat(tempBufferChunks);

  const documentId = new mongoose.Types.ObjectId();
  const pdfFileName = `${documentId}.pdf`;
  const pdfPath = path.join(env.uploadDir, pdfFileName);
  await fsp.writeFile(pdfPath, pdfBuffer);

  const document = await Document.create({
    _id: documentId,
    title,
    ownerId: request.user.sub,
    storageLocation: pdfFileName,
    mimeType: filePart.mimetype,
    extractionStatus: 'processing',
  });

  const log = request.log;

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
      log.error({ err: error }, 'Text extraction failed');
    }
  });

  reply.code(202).send({ document });
};

const getDocument = async (request, reply) => {
  const { id } = request.params;
  const document = await Document.findById(id);

  if (!document) {
    return reply.code(404).send({ message: 'Document not found' });
  }

  reply.send({ document });
};

const getDocumentText = async (request, reply) => {
  const { id } = request.params;
  const document = await Document.findById(id);

  if (!document) {
    return reply.code(404).send({ message: 'Document not found' });
  }

  if (!document.textLocation) {
    return reply.code(202).send({ message: 'Text extraction pending', status: document.extractionStatus });
  }

  const textPath = path.join(env.textDir, document.textLocation);
  try {
    const textContent = await fsp.readFile(textPath, 'utf8');
    reply
      .type('text/plain; charset=utf-8')
      .header('Cache-Control', 'no-store')
      .send(textContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return reply.code(500).send({ message: 'Extracted text missing' });
    }
    return reply.code(500).send({ message: 'Extracted text missing' });
  }
};

const getDocumentTextMetadata = async (request, reply) => {
  const { id } = request.params;
  const document = await Document.findById(id);

  if (!document) {
    return reply.code(404).send({ message: 'Document not found' });
  }

  if (!document.textMetadataLocation) {
    return reply.code(202).send({ message: 'Metadata not ready', status: document.extractionStatus });
  }

  const metaPath = path.join(env.textDir, document.textMetadataLocation);
  try {
    const contents = await fsp.readFile(metaPath, 'utf8');
    reply.send({ metadata: JSON.parse(contents) });
  } catch (error) {
    request.log.error({ err: error }, 'Failed to read metadata');
    reply.code(500).send({ message: 'Failed to read metadata' });
  }
};

const getAnnotations = async (request, reply) => {
  const { id } = request.params;
  const limit = Number(request.query.limit || 50);
  const { cursor } = request.query;
  const document = await Document.findById(id);

  if (!document) {
    return reply.code(404).send({ message: 'Document not found' });
  }

  const query = { documentId: id };
  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      return reply.code(400).send({ message: 'Invalid cursor' });
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

  reply.send({
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
