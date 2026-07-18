const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const {
  getMyProfile,
  updateProfile,
  updateLocation,
  updateInterests
} = require('./users.controller');

// all routes below require login
router.use(protect);

router.get('/me', getMyProfile);
router.put('/me', updateProfile);
router.post('/location', updateLocation);
router.post('/interests', updateInterests);

module.exports = router;