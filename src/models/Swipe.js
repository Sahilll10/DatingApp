const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({
  swiper_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  swiped_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  direction: {
    type: String,
    enum: ['LIKE', 'DISLIKE'],
    required: true
  }
}, {
  timestamps: true
});

// compound index — fast lookup + prevents duplicate swipes at DB level
swipeSchema.index({ swiper_id: 1, swiped_id: 1 }, { unique: true });

module.exports = mongoose.model('Swipe', swipeSchema);