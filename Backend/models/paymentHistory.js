const mongoose = require('mongoose');

const paymentSchemaHistory = new mongoose.Schema(
  {
    invoice: {
      type: Number,
      required: true,
      unique: true, // Ensures no duplicate invoice numbers
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
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields automatically
  }
);

module.exports = mongoose.model('PaymentHistory', paymentSchemaHistory);
