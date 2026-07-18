const User = require('../../models/User');
const { calculateAge } = require('../../utils/helpers');

// check if profile is complete and update the flag
const checkProfileComplete = (user) => {
  if (
    user.name &&
    user.dob &&
    user.photos.length > 0 &&
    user.interests.length > 0
  ) {
    return true;
  }
  return false;
};

// PUT /users/me — update basic profile info
const updateProfile = async (userId, data) => {
  const user = await User.findById(userId);

  if (!user) throw new Error('User not found');

  const { name, dob, gender, gender_pref, bio } = data;

  if (name) user.name = name;
  if (gender) user.gender = gender;
  if (gender_pref) user.gender_pref = gender_pref;
  if (bio) user.bio = bio;

  // if dob is provided, calculate age automatically
  if (dob) {
    user.dob = new Date(dob);
    user.age = calculateAge(dob);
  }

  // check if profile is now complete
  user.is_profile_complete = checkProfileComplete(user);

  await user.save();

  return user;
};

// POST /users/location — update user location
const updateLocation = async (userId, longitude, latitude) => {
  const user = await User.findById(userId);

  if (!user) throw new Error('User not found');

  // MongoDB GeoJSON format requires [longitude, latitude]
  user.location = {
    type: 'Point',
    coordinates: [parseFloat(longitude), parseFloat(latitude)]
  };

  await user.save();

  return {
    location: user.location
  };
};

// POST /users/interests — set user interests
const updateInterests = async (userId, interests) => {
  const user = await User.findById(userId);

  if (!user) throw new Error('User not found');

  if (!Array.isArray(interests) || interests.length === 0) {
    throw new Error('Please select at least one interest');
  }

  user.interests = interests;

  // check if profile is now complete after adding interests
  user.is_profile_complete = checkProfileComplete(user);

  await user.save();

  return {
    interests: user.interests,
    is_profile_complete: user.is_profile_complete
  };
};

// GET /users/me — get my profile
const getMyProfile = async (userId) => {
  const user = await User.findById(userId).select('-__v');

  if (!user) throw new Error('User not found');

  return user;
};

module.exports = {
  updateProfile,
  updateLocation,
  updateInterests,
  getMyProfile
};