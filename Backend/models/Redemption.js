const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rewardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
    pointsRequired: { 
      type: Number, 
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value'
      }
    },
    redeemedAt: { type: Date, default: Date.now },
    status: { 
      type: String,  
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model('Redemption', redemptionSchema);
