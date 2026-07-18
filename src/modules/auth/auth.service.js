const User = require('../../models/User');
const { generateAccessToken, generateRefreshToken } = require('../../utils/helpers');
const jwt = require('jsonwebtoken');

const googleLogin = async (firebase_uid, email, name) => {
  let user = await User.findOne({ firebase_uid });

  if (!user) {
    user = await User.create({
      firebase_uid,
      email,
      name: name || null,
      last_login_at: new Date()
    });
  } else {
    user.last_login_at = new Date();
    await user.save();
  }
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      is_profile_complete: user.is_profile_complete,
      status: user.status
    }
  };
};

const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAccessToken(decoded.userId);
    return { accessToken: newAccessToken };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

module.exports = { googleLogin, refreshAccessToken };