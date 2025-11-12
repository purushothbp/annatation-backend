const { register, login, me } = require('../controllers/authController');

module.exports = async function authRoutes(fastify) {
  fastify.post('/register', register);
  fastify.post('/login', login);
  fastify.get('/me', { preValidation: [fastify.authenticate] }, me);
};
