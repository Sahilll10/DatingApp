const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebase_uid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    default: null
  },
  dob: {
    type: Date,
    default: null
  },
  age: {
    type: Number,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: null
  },
  gender_pref: {
    type: String,
    enum: ['male', 'female', 'both'],
    default: 'both'
  },
  bio: {
    type: String,
    default: null,
    maxlength: 300
  },
  interests: {
    type: [String],
    default: []
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],  // [longitude, latitude]
      default: [0, 0]
    }
  },
  photos: {
    type: [String],  // array of S3 URLs
    default: []
  },
  kyc_url: {
    type: String,
    default: null
  },
  is_profile_complete: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  rejection_reason: {
    type: String,
    default: null
  },
  admin_remarks: {
    type: String,
    default: null
  },
  is_blocked: {
    type: Boolean,
    default: false
  },
  last_login_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true  // adds createdAt and updatedAt automatically
});

// index for geospatial queries (used in discovery)
userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);