const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../../middleware/auth');
const {
  getUsers,
  getUserById,
  approveUser,
  rejectUser,
  blockUser,
  unblockUser,
  getStats
} = require('./admin.controller');

// ALL admin routes need:
// 1. valid JWT (protect)
// 2. isAdmin flag (adminOnly)
router.use(protect);
router.use(adminOnly);

router.get('/stats',              getStats);
router.get('/users',              getUsers);
router.get('/users/:id',          getUserById);
router.post('/users/:id/approve', approveUser);
router.post('/users/:id/reject',  rejectUser);
router.post('/users/:id/block',   blockUser);
router.post('/users/:id/unblock', unblockUser);

module.exports = router;