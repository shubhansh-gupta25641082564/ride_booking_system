const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isOnline: { type: Boolean, default: false },
  socketId: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  rating: { type: Number, default: 5.0 },
  vehicle: {
    model: String,
    plateNumber: String
  }
});

// THIS INDEX is what makes the 5km radius search fast [file:1]
driverSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Driver', driverSchema);
