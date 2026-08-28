require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// -- Route imports ------------------------------------------------------------
const authRoutes = require('./routes/authRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const { chatRouter, conversationRouter } = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const trackingRoutes = require('./routes/trackingRoutes');

// -- Swagger ------------------------------------------------------------------
const { swaggerUi, swaggerSpec } = require('./swagger/swagger');

const app = express();

// -- Database -----------------------------------------------------------------
// Tests connect themselves against an in-memory MongoDB (see tests/helpers.js).
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// -- Security headers ---------------------------------------------------------
app.use(helmet());

// -- CORS ---------------------------------------------------------------------
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : '*';

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Channel'],
    credentials: true,
  })
);

// -- Body parsing -------------------------------------------------------------
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// -- HTTP logging -------------------------------------------------------------
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// -- Rate limiters ------------------------------------------------------------
// Limiters share process-wide state, so they are disabled under test where a
// suite legitimately performs hundreds of registrations in a few seconds.
const skipInTest = () => process.env.NODE_ENV === 'test';

const makeLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    message: { success: false, message },
  });

// Credential endpoints only - /api/auth/me is called on every app load and is
// covered by the general limiter instead.
const authLimiter = makeLimiter(
  15 * 60 * 1000,
  10,
  'Too many authentication attempts, please try again after 15 minutes.'
);

const recommendationLimiter = makeLimiter(
  15 * 60 * 1000,
  50,
  'Too many recommendation requests. Please slow down.'
);

const chatLimiter = makeLimiter(60 * 1000, 30, 'Too many chat requests. Please slow down.');

// -- Swagger docs -------------------------------------------------------------
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// -- Health check -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'OK', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV },
  });
});

// -- API routes ---------------------------------------------------------------
// The strict credential limiter guards register/login only; /api/auth/me is
// hit on every app load and must not burn that budget.
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/recommendation', recommendationLimiter, recommendationRoutes);
app.use('/api/chat', chatLimiter, chatRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/tracking', trackingRoutes);

// -- 404 handler --------------------------------------------------------------
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// -- Centralized error handler ------------------------------------------------
app.use(errorHandler);

// -- Start server (not in test) -----------------------------------------------
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`API docs: http://localhost:${PORT}/api/docs`);
  });
}

module.exports = app;
