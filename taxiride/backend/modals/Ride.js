const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  pickup: {
    address: String,
    coordinates: { lat: Number, lng: Number }
  },
  dropoff: {
    address: String,
    coordinates: { lat: Number, lng: Number }
  },
  status: {
    type: String,
    enum: ['searching', 'driver_found', 'arriving', 'in_progress', 'completed', 'cancelled'],
    default: 'searching'
  },
  fare: { type: Number },
  distance: { type: Number }, // in km
  duration: { type: Number }, // in minutes
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ride', rideSchema);
