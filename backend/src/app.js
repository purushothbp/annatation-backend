const path = require('path');
const express = require('express');
const cors = require('cors');
require('express-async-errors');
const { env } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const annotationRoutes = require('./routes/annotationRoutes');

const app = express();

const corsOrigins =
  env.corsOrigin === '*'
    ? true
    : env.corsOrigin
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    exposedHeaders: ['Content-Disposition'],
    maxAge: 86400,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/files', express.static(path.join(__dirname, '../storage/documents')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/annotations', annotationRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

module.exports = app;
