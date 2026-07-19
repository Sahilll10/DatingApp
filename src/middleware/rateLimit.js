const rateLimit = require('express-rate-limit');

// general API limiter — 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.'
  }
});

// auth routes — stricter: 10 login attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  }
});

// swipe limiter — 200 swipes per hour (like real apps)
const swipeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      200,
  message: {
    success: false,
    message: 'Swipe limit reached. Come back in an hour!'
  }
});

// upload limiter — 20 uploads per hour
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      20,
  message: {
    success: false,
    message: 'Upload limit reached. Try again in an hour.'
  }
});

// chat limiter — 60 messages per minute
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  message: {
    success: false,
    message: 'Slow down! Too many messages per minute.'
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  swipeLimiter,
  uploadLimiter,
  chatLimiter
};