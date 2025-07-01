const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },

  mobile: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },

  password: { type: String, required: true },

  plainPassword: {
    type: String,
    select: false, // Do not expose it by default
  },

  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user',
  },

  points: { type: Number, default: 0 },

  location: { type: String, trim: true },

  uniqueCode: {
    type: String,
    unique: true,
    sparse: true,
    required: function () {
      return this.role === 'admin' || this.role === 'superadmin';
    },
  },

  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return this.role === 'user';
    },
    index: true,
  },

  userLimit: {
    type: Number,
    default: 0, // Only applicable to admins
  },

  rewardProgress: [
    {
      rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward' },
      pointsEarned: { type: Number, default: 0 },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
