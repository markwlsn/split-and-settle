const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({ origin: true, credentials: true }));

// Body parser with payload size protection
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Rate limiting on authentication endpoints to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' },
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route registration
app.use('/auth', authLimiter, require('./routes/auth.routes'));
app.use('/groups', require('./routes/groups.routes'));
app.use('/', require('./routes/receipts.routes'));
app.use('/', require('./routes/settlements.routes'));

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
