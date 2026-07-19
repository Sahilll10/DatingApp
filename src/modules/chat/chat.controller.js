const chatService = require('./chat.service');

// POST /chat/send
const sendMessage = async (req, res) => {
  try {
    const { receiver_id, content } = req.body;

    if (!receiver_id) {
      return res.status(400).json({
        success: false,
        message: 'receiver_id is required'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty'
      });
    }

    // prevent messaging yourself
    if (receiver_id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a message to yourself'
      });
    }

    const message = await chatService.sendMessage(
      req.user._id,
      receiver_id,
      content
    );

    return res.status(201).json({
      success: true,
      message: 'Message sent',
      data:    message
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET /chat/messages/:userId
const getMessages = async (req, res) => {
  try {
    const { userId }      = req.params;
    const { page, limit } = req.query;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    const result = await chatService.getMessages(
      req.user._id,
      userId,
      page  || 1,
      limit || 20
    );

    return res.status(200).json({
      success: true,
      data:    result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// GET /chat/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await chatService.getConversations(req.user._id);

    return res.status(200).json({
      success: true,
      data: {
        total: conversations.length,
        conversations
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE /chat/unmatch/:matchId
const unmatch = async (req, res) => {
  try {
    const result = await chatService.unmatch(
      req.user._id,
      req.params.matchId
    );

    return res.status(200).json({
      success: true,
      message: 'Unmatched successfully',
      data:    result
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  unmatch
};