const {
  listDocuments,
  uploadDocument,
  getDocument,
  getDocumentText,
  getDocumentTextMetadata,
  getAnnotations,
} = require('../controllers/documentController');

module.exports = async function documentRoutes(fastify) {
  fastify.addHook('preValidation', fastify.authenticate);

  fastify.get('/', listDocuments);
  fastify.post('/', uploadDocument);
  fastify.get('/:id', getDocument);
  fastify.get('/:id/text', getDocumentText);
  fastify.get('/:id/text-metadata', getDocumentTextMetadata);
  fastify.get('/:id/annotations', getAnnotations);
};
