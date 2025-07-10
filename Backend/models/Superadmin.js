const mongoose = require('mongoose');

const SuperadminSchema = new mongoose.Schema(
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
    }, 

    role: {
      type: String,
      enum: ['superadmin'],
      default: 'superadmin',
    },

    location: {
      type: String,
      trim: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Superadmin', SuperadminSchema);
