const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { env } = require('../config/env');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: '7d' }
  );

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role });
  const token = createToken(user);

  res.status(201).json({ user: sanitizeUser(user), token });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = createToken(user);
  res.json({ user: sanitizeUser(user), token });
};

const me = async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ user: sanitizeUser(user) });
};

module.exports = {
  register,
  login,
  me,
};
