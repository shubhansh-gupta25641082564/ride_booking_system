const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

// Fare Calculator: ₹30 base + ₹12/km
const calculateFare = (distanceKm) => Math.round(30 + distanceKm * 12);

// Haversine formula to calculate distance between two lat/lng points
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

router.post('/estimate', auth, (req, res) => {
  const { pickup, dropoff } = req.body;
  const distance = getDistanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  const fare = calculateFare(distance);
  const duration = Math.round(distance * 3); // rough estimate: 3 mins/km
  res.json({ fare, distance: distance.toFixed(2), duration });
});

router.get('/history', auth, async (req, res) => {
  const rides = await Ride.find({ rider: req.user.id }).sort({ createdAt: -1 }).limit(10);
  res.json(rides);
});

module.exports = router;
