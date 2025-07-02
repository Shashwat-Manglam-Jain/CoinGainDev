const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    plainPassword: {
      type: String,
      select: false, // hidden by default
    },

    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },

    points: {
      type: Number,
      default: 0,
      min: 0,
    },

    location: {
      type: String,
      trim: true,
    },

    // For admin/superadmin
    uniqueCode: {
      type: String,
      unique: true,
      sparse: true,
      required: function () {
        return this.role === 'admin' || this.role === 'superadmin';
      },
      trim: true,
    },

    // For users
    userUniqueCode: {
      type: String,
      unique: true,
      sparse: true,
      required: function () {
        return this.role === 'user';
      },
      trim: true,
    },

    validate: {
      type: Boolean,
      default: false,
      required: function () {
        return this.role === 'admin';
      },
    },

    // Admin reference for each user
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
      default: 0,
      min: 0,
    },

    rewardProgress: [
      {
        rewardId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Reward',
        },
        pointsEarned: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],

    paymentHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentHistory',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
