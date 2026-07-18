const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');

// import routes
const authRoutes = require('./src/modules/auth/auth.routes');

const app = express();
// import routes
const authRoutes = require('./src/modules/auth/auth.routes');
const usersRoutes = require('./src/modules/users/users.routes');  // ADD THIS


// connect database
connectDB();

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);   // ADD THIS

// health check
app.get('/', (req, res) => {
  res.json({ message: '🚀 Dating App API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});