const mongoose = require('mongoose');
const { env } = require('./env');

mongoose.set('strictQuery', false);

const connectDB = async () => {
  if (!env.mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }

  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: env.nodeEnv !== 'production',
    });
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

module.exports = {
  connectDB,
};
