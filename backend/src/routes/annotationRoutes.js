const {
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
} = require('../controllers/annotationController');

module.exports = async function annotationRoutes(fastify) {
  fastify.addHook('preValidation', fastify.authenticate);

  fastify.post('/', createAnnotation);
  fastify.patch('/:id', updateAnnotation);
  fastify.delete('/:id', deleteAnnotation);
};
