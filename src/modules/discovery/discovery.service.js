const User  = require('../../models/User');
const Swipe = require('../../models/Swipe');
const Match = require('../../models/Match');
const redis = require('../../config/redis');

const CACHE_TTL = 60 * 5; // cache discovery feed for 5 minutes

// ─────────────────────────────────────────
// GET /discovery — with Redis caching
// ─────────────────────────────────────────
const getDiscoveryFeed = async (currentUser, page = 1, limit = 10) => {

  // build a unique cache key per user + page
  const cacheKey = `discovery:${currentUser._id}:page:${page}`;

  // check Redis cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('✅ Discovery served from cache');
    return JSON.parse(cached);
  }

  // not in cache — query MongoDB
  const alreadySwiped = await Swipe.find({
    swiper_id: currentUser._id
  }).select('swiped_id');

  const swipedIds = alreadySwiped.map(s => s.swiped_id);
  swipedIds.push(currentUser._id);

  const filter = {
    _id:                 { $nin: swipedIds },
    status:              'APPROVED',
    is_blocked:          false,
    is_profile_complete: true,
    isAdmin:             false
  };

  if (currentUser.gender_pref !== 'both') {
    filter.gender = currentUser.gender_pref;
  }

  let users;
  const hasLocation = (
    currentUser.location &&
    currentUser.location.coordinates &&
    currentUser.location.coordinates[0] !== 0
  );

  if (hasLocation) {
    const skip = (page - 1) * limit;

    users = await User.aggregate([
      {
        $geoNear: {
          near: {
            type:        'Point',
            coordinates: currentUser.location.coordinates
          },
          distanceField: 'distance_meters',
          maxDistance:   100000,
          spherical:     true,
          query:         filter
        }
      },
      { $skip:  skip  },
      { $limit: limit },
      {
        $project: {
          name:             1,
          age:              1,
          gender:           1,
          bio:              1,
          interests:        1,
          photos:           1,
          distance_meters:  1
        }
      }
    ]);

    users = users.map(u => ({
      ...u,
      distance_km: (u.distance_meters / 1000).toFixed(1)
    }));

  } else {
    const skip = (page - 1) * limit;

    users = await User.find(filter)
      .select('name age gender bio interests photos')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  const result = {
    users,
    pagination: {
      page:    parseInt(page),
      limit:   parseInt(limit),
      hasMore: users.length === limit
    },
    message: users.length === 0
      ? 'No more profiles nearby. Check back later!'
      : undefined
  };

  // store in Redis cache for 5 minutes
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));

  return result;
};

// ─────────────────────────────────────────
// clear discovery cache when user swipes
// so they don't see already-swiped users
// ─────────────────────────────────────────
const clearDiscoveryCache = async (userId) => {
  const keys = await redis.keys(`discovery:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

// POST /swipe
const swipe = async (swiperId, swipedId, direction) => {

  if (swiperId.toString() === swipedId.toString()) {
    throw new Error('You cannot swipe on yourself');
  }

  const swipedUser = await User.findById(swipedId);
  if (!swipedUser) throw new Error('User not found');

  if (swipedUser.status !== 'APPROVED' || swipedUser.is_blocked) {
    throw new Error('This user is not available');
  }

  const existingSwipe = await Swipe.findOne({
    swiper_id: swiperId,
    swiped_id: swipedId
  });
  if (existingSwipe) throw new Error('You have already swiped on this user');

  await Swipe.create({ swiper_id: swiperId, swiped_id: swipedId, direction });

  // clear discovery cache so fresh feed loads next time
  await clearDiscoveryCache(swiperId);

  let matchCreated = false;
  let matchData    = null;

  if (direction === 'LIKE') {
    const reverseSwipe = await Swipe.findOne({
      swiper_id: swipedId,
      swiped_id: swiperId,
      direction: 'LIKE'
    });

    if (reverseSwipe) {
      const [user1_id, user2_id] = [swiperId, swipedId].sort();

      const match = await Match.create({
        user1_id,
        user2_id,
        is_active: true
      });

      matchCreated = true;
      matchData    = {
        match_id:     match._id,
        matched_with: {
          id:     swipedUser._id,
          name:   swipedUser.name,
          photos: swipedUser.photos
        }
      };
    }
  }

  return { direction, match: matchCreated, matchData };
};

// GET /discovery/matches
const getMyMatches = async (userId) => {
  const matches = await Match.find({
    $or: [
      { user1_id: userId },
      { user2_id: userId }
    ],
    is_active: true
  })
  .populate([
    { path: 'user1_id', select: 'name photos age bio' },
    { path: 'user2_id', select: 'name photos age bio' }
  ])
  .sort({ createdAt: -1 });

  return matches.map(match => {
    const otherUser =
      match.user1_id._id.toString() === userId.toString()
        ? match.user2_id
        : match.user1_id;

    return {
      match_id:     match._id,
      matched_with: otherUser,
      matched_at:   match.createdAt
    };
  });
};

module.exports = { getDiscoveryFeed, swipe, getMyMatches };