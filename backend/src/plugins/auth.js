const fp = require('fastify-plugin');

async function authPlugin(fastify) {
  fastify.decorate('authenticate', async function authenticate(request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ message: 'Unauthorized' });
      // return reply;
    }
  });
}

module.exports = fp(authPlugin);
