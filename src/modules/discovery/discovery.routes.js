const express                        = require('express');
const router                         = express.Router();
const { protect, requireDiscoveryReady } = require('../../middleware/auth');
const { swipeLimiter }               = require('../../middleware/rateLimit');
const { getDiscoveryFeed, swipe, getMyMatches } = require('./discovery.controller');

router.use(protect);

router.get('/matches',       getMyMatches);
router.get('/',              requireDiscoveryReady, getDiscoveryFeed);
router.post('/swipe',        requireDiscoveryReady, swipeLimiter, swipe);

module.exports = router;