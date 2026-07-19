require('dotenv').config();
const express          = require('express');
const cors             = require('cors');
const helmet           = require('helmet');
const swaggerUi        = require('swagger-ui-express');
const swaggerSpec      = require('./src/config/swagger');
const connectDB        = require('./src/config/db');
const { generalLimiter } = require('./src/middleware/rateLimit');

// routes
const authRoutes      = require('./src/modules/auth/auth.routes');
const usersRoutes     = require('./src/modules/users/users.routes');
const mediaRoutes     = require('./src/modules/media/media.routes');
const adminRoutes     = require('./src/modules/admin/admin.routes');
const discoveryRoutes = require('./src/modules/discovery/discovery.routes');
const chatRoutes      = require('./src/modules/chat/chat.routes');

const app = express();

// connect DB
connectDB();

// ── global middleware ──────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);  // apply to all routes

// ── swagger docs ───────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Dating App API Docs'
}));

// ── routes ─────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/media',     mediaRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/chat',      chatRoutes);

// ── health check ───────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Dating App API is running',
    docs:    'http://localhost:5000/api/docs',
    version: '1.0.0 — Beta'
  });
});

// ── 404 handler ────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// ── multer errors ──────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum 5MB allowed.'
    });
  }
  if (err.message?.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next(err);
});

// ── global error handler ───────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📄 Swagger docs: http://localhost:5000/api/docs`);
});