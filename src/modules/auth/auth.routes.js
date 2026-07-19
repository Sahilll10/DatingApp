const express          = require('express');
const router           = express.Router();
const { authLimiter }  = require('../../middleware/rateLimit');
const { googleLogin, refreshToken } = require('./auth.controller');

router.post('/google',        authLimiter, googleLogin);
router.post('/refresh-token', authLimiter, refreshToken);

module.exports = router;