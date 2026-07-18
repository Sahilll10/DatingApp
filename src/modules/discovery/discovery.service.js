const User  = require('../../models/User');
const Swipe = require('../../models/Swipe');
const Match = require('../../models/Match');

// ─────────────────────────────────────────
// GET /discovery
// ─────────────────────────────────────────
const getDiscoveryFeed = async (currentUser, page = 1, limit = 10) => {

  // Step 1 — get all user IDs this person has already swiped
  const alreadySwiped = await Swipe.find({
    swiper_id: currentUser._id
  }).select('swiped_id');

  const swipedIds = alreadySwiped.map(s => s.swiped_id);

  // always exclude self
  swipedIds.push(currentUser._id);

  // Step 2 — build the discovery filter
  const filter = {
    _id:        { $nin: swipedIds },   // not already swiped
    status:     'APPROVED',            // admin approved only
    is_blocked: false,                 // not blocked
    is_profile_complete: true,         // complete profiles only
    isAdmin:    false                  // never show admin accounts
  };

  // gender preference filter
  if (currentUser.gender_pref !== 'both') {
    filter.gender = currentUser.gender_pref;
  }

  // Step 3 — if user has a location, sort by distance
  let users;

  const hasLocation = (
    currentUser.location &&
    currentUser.location.coordinates &&
    currentUser.location.coordinates[0] !== 0 &&
    currentUser.location.coordinates[1] !== 0
  );

  if (hasLocation) {
    // use MongoDB $geoNear aggregation to sort by distance
    const skip = (page - 1) * limit;

    users = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: currentUser.location.coordinates
          },
          distanceField: 'distance_meters',
          maxDistance: 100000,   // 100 km radius
          spherical: true,
          query: filter
        }
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name:       1,
          age:        1,
          gender:     1,
          bio:        1,
          interests:  1,
          photos:     1,
          location:   1,
          distance_meters: 1
        }
      }
    ]);

    // convert meters to km for readability
    users = users.map(u => ({
      ...u,
      distance_km: (u.distance_meters / 1000).toFixed(1)
    }));

  } else {
    // no location — just return approved users
    const skip = (page - 1) * limit;

    users = await User.find(filter)
      .select('name age gender bio interests photos')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  // Step 4 — empty feed fallback
  if (users.length === 0) {
    return {
      users: [],
      message: 'No more profiles nearby. Check back later!',
      pagination: { page, limit, hasMore: false }
    };
  }

  return {
    users,
    pagination: {
      page:    parseInt(page),
      limit:   parseInt(limit),
      hasMore: users.length === limit   // if we got full page, there may be more
    }
  };
};

// ─────────────────────────────────────────
// POST /swipe
// ─────────────────────────────────────────
const swipe = async (swiperId, swipedId, direction) => {

  // Edge case 1 — prevent self swipe
  if (swiperId.toString() === swipedId.toString()) {
    throw new Error('You cannot swipe on yourself');
  }

  // Edge case 2 — check swiped user exists and is approved
  const swipedUser = await User.findById(swipedId);
  if (!swipedUser) {
    throw new Error('User not found');
  }
  if (swipedUser.status !== 'APPROVED' || swipedUser.is_blocked) {
    throw new Error('This user is not available');
  }

  // Edge case 3 — prevent duplicate swipe
  const existingSwipe = await Swipe.findOne({
    swiper_id: swiperId,
    swiped_id: swipedId
  });
  if (existingSwipe) {
    throw new Error('You have already swiped on this user');
  }

  // save the swipe
  await Swipe.create({
    swiper_id:  swiperId,
    swiped_id:  swipedId,
    direction
  });

  // check for match — only if current swipe is LIKE
  let matchCreated = false;
  let matchData    = null;

  if (direction === 'LIKE') {
    // check if the other person already liked us back
    const reverseSwipe = await Swipe.findOne({
      swiper_id:  swipedId,
      swiped_id:  swiperId,
      direction:  'LIKE'
    });

    if (reverseSwipe) {
      // IT'S A MATCH — store with smaller ID as user1 for consistency
      const [user1_id, user2_id] = [swiperId, swipedId].sort();

      const match = await Match.create({
        user1_id,
        user2_id,
        is_active: true
      });

      matchCreated = true;
      matchData    = {
        match_id:    match._id,
        matched_with: {
          id:     swipedUser._id,
          name:   swipedUser.name,
          photos: swipedUser.photos
        }
      };
    }
  }

  return {
    direction,
    match: matchCreated,
    matchData
  };
};

// ─────────────────────────────────────────
// GET /discovery/matches — get all my matches
// ─────────────────────────────────────────
const getMyMatches = async (userId) => {
  const matches = await Match.find({
    $or: [
      { user1_id: userId },
      { user2_id: userId }
    ],
    is_active: true
  }).populate([
    {
      path: 'user1_id',
      select: 'name photos age bio'
    },
    {
      path: 'user2_id',
      select: 'name photos age bio'
    }
  ]).sort({ createdAt: -1 });

  // return the OTHER person's info in each match
  const result = matches.map(match => {
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

  return result;
};

module.exports = {
  getDiscoveryFeed,
  swipe,
  getMyMatches
};