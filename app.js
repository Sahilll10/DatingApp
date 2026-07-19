const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./src/config/db");

// Import routes
const authRoutes = require("./src/modules/auth/auth.routes");
const usersRoutes = require("./src/modules/users/users.routes");

const app = express();
// import routes
const mediaRoutes  = require('./src/modules/media/media.routes');  // ADD
const adminRoutes = require('./src/modules/admin/admin.routes');  // ADD

const discoveryRoutes = require('./src/modules/discovery/discovery.routes'); 
const chatRoutes      = require('./src/modules/chat/chat.routes');  // ADD


// Connect database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/discovery', discoveryRoutes);
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
// routes
app.use('/api/media', mediaRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/chat',  chatRoutes);  

// Health check
app.get("/", (req, res) => {
  res.json({ message: "🚀 Dating App API is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// multer error handler
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB."
    });
  }

  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});