const mongoose = require('mongoose');
const Document = require('../models/Document');
const Annotation = require('../models/Annotation');

const canEditAnnotation = (annotation, user) => {
  if (!annotation) return false;
  if (annotation.userId.toString() === user.sub) return true;
  return user.role === 'owner';
};

const createAnnotation = async (req, res) => {
  const { documentId, selector, quoteSelector, body, orphaned } = req.body;

  if (
    !documentId ||
    selector?.start === undefined ||
    selector?.end === undefined ||
    !quoteSelector?.exact ||
    !body
  ) {
    return res.status(400).json({ message: 'documentId, selector, quoteSelector.exact and body are required' });
  }

  if (selector.end < selector.start) {
    return res.status(400).json({ message: 'selector.end must be greater than selector.start' });
  }

  const document = await Document.findById(documentId);
  if (!document) {
    return res.status(404).json({ message: 'Document not found' });
  }

  const rangeHash = Annotation.buildRangeHash({
    documentId,
    selector,
    userId: req.user.sub,
  });

  try {
    const annotation = await Annotation.create({
      documentId,
      userId: req.user.sub,
      selector,
      quoteSelector,
      body,
      orphaned: Boolean(orphaned),
      rangeHash,
    });

    req.app.get('io')?.to(`doc:${documentId}`).emit('annotation.created', annotation);

    res.status(201).json({ annotation });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate annotation for this range' });
    }
    throw error;
  }
};

const updateAnnotation = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const annotation = await Annotation.findById(id);
  if (!annotation) {
    return res.status(404).json({ message: 'Annotation not found' });
  }

  if (!canEditAnnotation(annotation, req.user)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  if (updates.selector) {
    if (updates.selector.end < updates.selector.start) {
      return res.status(400).json({ message: 'selector.end must be greater than selector.start' });
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

  req.app.get('io')?.to(`doc:${annotation.documentId}`).emit('annotation.updated', annotation);

  res.json({ annotation });
};

const deleteAnnotation = async (req, res) => {
  const { id } = req.params;
  const annotation = await Annotation.findById(id);
  if (!annotation) {
    return res.status(404).json({ message: 'Annotation not found' });
  }

  if (!canEditAnnotation(annotation, req.user)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await Annotation.deleteOne({ _id: id });

  req.app.get('io')?.to(`doc:${annotation.documentId}`).emit('annotation.deleted', { id });

  res.status(204).send();
};

module.exports = {
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
};
