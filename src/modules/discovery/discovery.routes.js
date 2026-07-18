const express = require('express');
const router  = express.Router();
const { protect, requireDiscoveryReady } = require('../../middleware/auth');
const {
  getDiscoveryFeed,
  swipe,
  getMyMatches
} = require('./discovery.controller');

// all routes need valid JWT
router.use(protect);

// matches — no discovery gate needed, just login
router.get('/matches', getMyMatches);

// discovery feed + swipe — must have photo, KYC, and be APPROVED
router.get('/',      requireDiscoveryReady, getDiscoveryFeed);
router.post('/swipe', requireDiscoveryReady, swipe);

module.exports = router;