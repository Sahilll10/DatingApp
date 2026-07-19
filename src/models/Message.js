const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  match_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  is_read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// fast lookup of all messages in a match thread
messageSchema.index({ match_id: 1, createdAt: 1 });

// fast lookup of unread messages for a user
messageSchema.index({ receiver_id: 1, is_read: 1 });

module.exports = mongoose.model('Message', messageSchema);