const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    // get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Access denied.'
      });
    }

    const token = authHeader.split(' ')[1];

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // attach user to request
    const user = await User.findById(decoded.userId).select('-__v');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    // handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh.'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// admin only middleware
const adminOnly = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }
  next();
};
// gate: block user from discovery if not ready
const requireDiscoveryReady = (req, res, next) => {
  const user = req.user;

  if (user.photos.length === 0) {
    return res.status(403).json({
      success: false,
      message: 'Upload at least one photo to access discovery.'
    });
  }

  if (!user.kyc_url) {
    return res.status(403).json({
      success: false,
      message: 'Upload your KYC document to access discovery.'
    });
  }

  if (user.status !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      message: `Your account is ${user.status}. Wait for admin approval.`
    });
  }

  next();
};

// update module.exports at bottom of the file
module.exports = { protect, adminOnly, requireDiscoveryReady };
