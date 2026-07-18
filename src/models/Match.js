const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  user1_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_active: {
    type: Boolean,
    default: true   // false = unmatched
  }
}, {
  timestamps: true
});

// compound index — fast lookup of matches between two users
matchSchema.index({ user1_id: 1, user2_id: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);