const adminService = require('./admin.service');

// GET /admin/users?status=UNDER_REVIEW&page=1&limit=10
const getUsers = async (req, res) => {
  try {
    const { status, page, limit } = req.query;

    const result = await adminService.getUsers(
      status,
      page  || 1,
      limit || 10
    );

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET /admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await adminService.getUserById(req.params.id);

    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

// POST /admin/users/:id/approve
const approveUser = async (req, res) => {
  try {
    const result = await adminService.approveUser(
      req.user._id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: 'User approved successfully. They now appear in discovery.',
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// POST /admin/users/:id/reject
const rejectUser = async (req, res) => {
  try {
    const { reason, remarks } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'rejection reason is required'
      });
    }

    const result = await adminService.rejectUser(
      req.user._id,
      req.params.id,
      reason,
      remarks
    );

    return res.status(200).json({
      success: true,
      message: 'User rejected and blocked.',
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// POST /admin/users/:id/block
const blockUser = async (req, res) => {
  try {
    const { remarks } = req.body;

    const result = await adminService.blockUser(
      req.user._id,
      req.params.id,
      remarks
    );

    return res.status(200).json({
      success: true,
      message: 'User blocked successfully.',
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// POST /admin/users/:id/unblock
const unblockUser = async (req, res) => {
  try {
    const result = await adminService.unblockUser(
      req.user._id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: 'User unblocked successfully.',
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET /admin/stats
const getStats = async (req, res) => {
  try {
    const stats = await adminService.getStats();

    return res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
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