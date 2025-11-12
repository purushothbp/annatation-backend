const User = require('../models/User');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const register = async (request, reply) => {
  const { name, email, password, role } = request.body;

  if (!name || !email || !password) {
    return reply.code(400).send({ message: 'name, email and password are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return reply.code(409).send({ message: 'Email already registered' });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role });
  const token = await reply.jwtSign({ sub: user.id, role: user.role });

  reply.code(201).send({ user: sanitizeUser(user), token });
};

const login = async (request, reply) => {
  const { email, password } = request.body;

  if (!email || !password) {
    return reply.code(400).send({ message: 'email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return reply.code(401).send({ message: 'Invalid credentials' });
  }

  const token = await reply.jwtSign({ sub: user.id, role: user.role });
  reply.send({ user: sanitizeUser(user), token });
};

const me = async (request, reply) => {
  const user = await User.findById(request.user.sub);
  if (!user) {
    return reply.code(404).send({ message: 'User not found' });
  }
  reply.send({ user: sanitizeUser(user) });
};

module.exports = {
  register,
  login,
  me,
};
