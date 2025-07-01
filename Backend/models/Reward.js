const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: String,
  price: Number,
  pointsRequired: Number,
  image: String, // base64 or URL
}, { timestamps: true });

module.exports = mongoose.model('Reward', rewardSchema);
