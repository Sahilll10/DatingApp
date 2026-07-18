const usersService = require('./users.service');

// GET /users/me
const getMyProfile = async (req, res) => {
  try {
    const user = await usersService.getMyProfile(req.user._id);

    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// PUT /users/me
const updateProfile = async (req, res) => {
  try {
    const { name, dob, gender, gender_pref, bio } = req.body;

    // at least one field must be present
    if (!name && !dob && !gender && !gender_pref && !bio) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update'
      });
    }

    // validate gender
    if (gender && !['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'gender must be male, female, or other'
      });
    }

    // validate gender_pref
    if (gender_pref && !['male', 'female', 'both'].includes(gender_pref)) {
      return res.status(400).json({
        success: false,
        message: 'gender_pref must be male, female, or both'
      });
    }

    // validate dob — must be at least 18 years old
    if (dob) {
      const today = new Date();
      const birth = new Date(dob);
      const age = today.getFullYear() - birth.getFullYear();
      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: 'You must be at least 18 years old'
        });
      }
    }

    const user = await usersService.updateProfile(req.user._id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        name: user.name,
        dob: user.dob,
        age: user.age,
        gender: user.gender,
        gender_pref: user.gender_pref,
        bio: user.bio,
        is_profile_complete: user.is_profile_complete
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// POST /users/location
const updateLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'longitude and latitude are required'
      });
    }

    // validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'latitude must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'longitude must be between -180 and 180'
      });
    }

    const result = await usersService.updateLocation(
      req.user._id,
      longitude,
      latitude
    );

    return res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// POST /users/interests
const updateInterests = async (req, res) => {
  try {
    const { interests } = req.body;

    if (!interests || !Array.isArray(interests)) {
      return res.status(400).json({
        success: false,
        message: 'interests must be an array'
      });
    }

    if (interests.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Select at least 1 interest'
      });
    }

    if (interests.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 interests allowed'
      });
    }

    const result = await usersService.updateInterests(req.user._id, interests);

    return res.status(200).json({
      success: true,
      message: 'Interests updated successfully',
      data: result
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getMyProfile,
  updateProfile,
  updateLocation,
  updateInterests
};