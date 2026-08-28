const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a stop name'],
  },
  lat: {
    type: Number,
    required: [true, 'Please add latitude'],
  },
  lng: {
    type: Number,
    required: [true, 'Please add longitude'],
  },
});

const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: [true, 'Please add a route name'],
      unique: true,
    },
    stops: [stopSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Route', routeSchema);
