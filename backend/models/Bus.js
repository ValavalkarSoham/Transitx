const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, 'Please add a bus number'],
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Please add capacity'],
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      default: null,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'inactive',
    },
    currentLocation: {
      lat: {
        type: Number,
        default: 0.0,
      },
      lng: {
        type: Number,
        default: 0.0,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Bus', busSchema);
