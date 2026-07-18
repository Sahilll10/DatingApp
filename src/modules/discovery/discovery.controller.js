const discoveryService = require('./discovery.service');

// GET /discovery
const getDiscoveryFeed = async (req, res) => {
  try {
    const { page, limit } = req.query;

    const result = await discoveryService.getDiscoveryFeed(
      req.user,
      page  || 1,
      limit || 10
    );

    return res.status(200).json({
      success: true,
      data:    result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// POST /discovery/swipe
const swipe = async (req, res) => {
  try {
    const { swiped_user_id, direction } = req.body;

    // validate required fields
    if (!swiped_user_id || !direction) {
      return res.status(400).json({
        success: false,
        message: 'swiped_user_id and direction are required'
      });
    }

    // validate direction
    if (!['LIKE', 'DISLIKE'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: 'direction must be LIKE or DISLIKE'
      });
    }

    const result = await discoveryService.swipe(
      req.user._id,
      swiped_user_id,
      direction
    );

    // build response message
    let message = direction === 'LIKE' ? 'Liked!' : 'Passed.';
    if (result.match) message = "🎉 It's a match!";

    return res.status(200).json({
      success: true,
      message,
      data: result
    });

  } catch (error) {
    // handle duplicate swipe from DB unique index
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already swiped on this user'
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET /discovery/matches
const getMyMatches = async (req, res) => {
  try {
    const matches = await discoveryService.getMyMatches(req.user._id);

    return res.status(200).json({
      success: true,
      data: {
        total: matches.length,
        matches
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { getDiscoveryFeed, swipe, getMyMatches };