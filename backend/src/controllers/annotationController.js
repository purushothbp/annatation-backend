const mongoose = require('mongoose');
const Document = require('../models/Document');
const Annotation = require('../models/Annotation');

const canEditAnnotation = (annotation, user) => {
  if (!annotation) return false;
  if (annotation.userId.toString() === user.sub) return true;
  return user.role === 'owner';
};

const createAnnotation = async (request, reply) => {
  const { documentId, selector, quoteSelector, body, orphaned } = request.body;

  if (
    !documentId ||
    selector?.start === undefined ||
    selector?.end === undefined ||
    !quoteSelector?.exact ||
    !body
  ) {
    return reply.code(400).send({ message: 'documentId, selector, quoteSelector.exact and body are required' });
  }

  if (selector.end < selector.start) {
    return reply.code(400).send({ message: 'selector.end must be greater than selector.start' });
  }

  const document = await Document.findById(documentId);
  if (!document) {
    return reply.code(404).send({ message: 'Document not found' });
  }

  const rangeHash = Annotation.buildRangeHash({
    documentId,
    selector,
    userId: request.user.sub,
  });

  try {
    const annotation = await Annotation.create({
      documentId,
      userId: request.user.sub,
      selector,
      quoteSelector,
      body,
      orphaned: Boolean(orphaned),
      rangeHash,
    });

    request.server.io?.to(`doc:${documentId}`).emit('annotation.created', annotation);

    reply.code(201).send({ annotation });
  } catch (error) {
    if (error.code === 11000) {
      return reply.code(409).send({ message: 'Duplicate annotation for this range' });
    }
    throw error;
  }
};

const updateAnnotation = async (request, reply) => {
  const { id } = request.params;
  const updates = request.body;

  const annotation = await Annotation.findById(id);
  if (!annotation) {
    return reply.code(404).send({ message: 'Annotation not found' });
  }

  if (!canEditAnnotation(annotation, request.user)) {
    return reply.code(403).send({ message: 'Forbidden' });
  }

  if (updates.selector) {
    if (updates.selector.end < updates.selector.start) {
      return reply.code(400).send({ message: 'selector.end must be greater than selector.start' });
    }
    annotation.selector = updates.selector;
    annotation.rangeHash = Annotation.buildRangeHash({
      documentId: annotation.documentId,
      selector: updates.selector,
      userId: annotation.userId,
    });
  }

  if (updates.quoteSelector) {
    annotation.quoteSelector = updates.quoteSelector;
  }

  if (updates.body) {
    annotation.body = updates.body;
  }

  if (typeof updates.orphaned === 'boolean') {
    annotation.orphaned = updates.orphaned;
  }

  await annotation.save();

  request.server.io?.to(`doc:${annotation.documentId}`).emit('annotation.updated', annotation);

  reply.send({ annotation });
};

const deleteAnnotation = async (request, reply) => {
  const { id } = request.params;
  const annotation = await Annotation.findById(id);
  if (!annotation) {
    return reply.code(404).send({ message: 'Annotation not found' });
  }

  if (!canEditAnnotation(annotation, request.user)) {
    return reply.code(403).send({ message: 'Forbidden' });
  }

  await Annotation.deleteOne({ _id: id });

  request.server.io?.to(`doc:${annotation.documentId}`).emit('annotation.deleted', { id });

  reply.code(204).send();
};

module.exports = {
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
};
