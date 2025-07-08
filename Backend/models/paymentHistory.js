const mongoose = require('mongoose');

const paymentSchemaHistory = new mongoose.Schema(
  {
    invoice: {
      type: Number,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    rewardPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    expiryMonth: {
      type: Date,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    remainingPointsToDeduct: {
  type: Number,
  default: null,
},
status: {
  type: String,
  enum: ['valid', 'expired'],
  default: 'valid',
},

  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model('PaymentHistory', paymentSchemaHistory);
