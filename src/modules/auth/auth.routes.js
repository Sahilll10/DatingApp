const express = require('express');
const router = express.Router();
const { googleLogin, refreshToken } = require('./auth.controller');

router.post('/google', googleLogin);
router.post('/refresh-token', refreshToken);

module.exports = router;