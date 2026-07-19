const express = require('express');
const router  = express.Router();
const { protect } = require('../../middleware/auth');
const {
  sendMessage,
  getMessages,
  getConversations,
  unmatch
} = require('./chat.controller');

// all chat routes require login
router.use(protect);

router.get('/conversations',          getConversations);
router.post('/send',                  sendMessage);
router.get('/messages/:userId',       getMessages);
router.delete('/unmatch/:matchId',    unmatch);

module.exports = router;