const authService = require('./auth.service');

const googleLogin = async (req, res) => {
  try {
    const { firebase_uid, email, name } = req.body;

    if (!firebase_uid || !email) {
      return res.status(400).json({
        success: false,
        message: 'firebase_uid and email are required'
      });
    }

    const result = await authService.googleLogin(firebase_uid, email, name);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { googleLogin, refreshToken };