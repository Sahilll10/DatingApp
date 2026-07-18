const User = require('../../models/User');
const { REJECTION_REASONS, USER_STATUS } = require('../../utils/constants');

// GET /admin/users — list users by status with pagination
const getUsers = async (status, page = 1, limit = 10) => {

  // validate status filter
  const validStatuses = Object.values(USER_STATUS);
  if (status && !validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email age gender status kyc_url photos interests createdAt last_login_at is_profile_complete')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  return {
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  };
};

// GET /admin/users/:id — get single user details
const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-__v');

  if (!user) throw new Error('User not found');

  return user;
};

// POST /admin/users/:id/approve
const approveUser = async (adminId, userId) => {
  const user = await User.findById(userId);

  if (!user) throw new Error('User not found');

  if (user.status === USER_STATUS.APPROVED) {
    throw new Error('User is already approved');
  }

  if (!user.kyc_url) {
    throw new Error('Cannot approve user without KYC uploaded');
  }

  if (user.photos.length === 0) {
    throw new Error('Cannot approve user without at least one photo');
  }

  user.status           = USER_STATUS.APPROVED;
  user.rejection_reason = null;   // clear any old rejection
  user.admin_remarks    = `Approved by admin on ${new Date().toISOString()}`;

  await user.save();

  return {
    id:             user._id,
    name:           user.name,
    email:          user.email,
    status:         user.status,
    admin_remarks:  user.admin_remarks
  };
};

// POST /admin/users/:id/reject
const rejectUser = async (adminId, userId, reason, remarks) => {
  const user = await User.findById(userId);

  if (!user) throw new Error('User not found');

  if (user.status === USER_STATUS.REJECTED) {
    throw new Error('User is already rejected');
  }

  // validate rejection reason
  const validReasons = Object.values(REJECTION_REASONS);
  if (!reason || !validReasons.includes(reason)) {
    throw new Error(`Invalid reason. Must be one of: ${validReasons.join(', ')}`);
  }

  user.status           = USER_STATUS.REJECTED;
  user.rejection_reason = reason;
  user.admin_remarks    = remarks || null;
  user.is_blocked       = true;   // block the user immediately

  await user.save();

  return {
    id:               user._id,
    name:             user.name,
    email:            user.email,
    status:           user.status,
    rejection_reason: user.rejection_reason,
    admin_remarks:    user.admin_remarks
  };
};

// POST /admin/users/:id/block — block an already approved user
const blockUser = async (adminId, userId, remarks) => {
  const user = await User.findById(userId);

  if (!user) throw new Error('User not found');
  if (user.isAdmin) throw new Error('Cannot block an admin account');
  if (user.is_blocked) throw new Error('User is already blocked');

  user.is_blocked    = true;
  user.status        = USER_STATUS.REJECTED;
  user.admin_remarks = remarks || 'Blocked by admin';

  await user.save();

  return {
    id:          user._id,
    name:        user.name,
    is_blocked:  user.is_blocked,
    status:      user.status
  };
};

// POST /admin/users/:id/unblock
const unblockUser = async (adminId, userId) => {
  const user = await User.findById(userId);

  if (!user) throw new Error('User not found');
  if (!user.is_blocked) throw new Error('User is not blocked');

  user.is_blocked       = false;
  user.status           = USER_STATUS.APPROVED;
  user.rejection_reason = null;
  user.admin_remarks    = `Unblocked by admin on ${new Date().toISOString()}`;

  await user.save();

  return {
    id:         user._id,
    name:       user.name,
    is_blocked: user.is_blocked,
    status:     user.status
  };
};

// GET /admin/stats — dashboard numbers
const getStats = async () => {
  const [total, pending, underReview, approved, rejected] = await Promise.all([
    User.countDocuments({ isAdmin: false }),
    User.countDocuments({ status: USER_STATUS.PENDING }),
    User.countDocuments({ status: USER_STATUS.UNDER_REVIEW }),
    User.countDocuments({ status: USER_STATUS.APPROVED }),
    User.countDocuments({ status: USER_STATUS.REJECTED })
  ]);

  return { total, pending, underReview, approved, rejected };
};

module.exports = {
  getUsers,
  getUserById,
  approveUser,
  rejectUser,
  blockUser,
  unblockUser,
  getStats
};