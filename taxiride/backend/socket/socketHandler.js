const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // Driver goes online
    socket.on('driver_online', async ({ driverId }) => {
      await Driver.findByIdAndUpdate(driverId, { isOnline: true, socketId: socket.id });
      socket.join('drivers');
    });

    // Driver updates location (called frequently from driver app)
    socket.on('driver_location_update', async ({ driverId, lat, lng, rideId }) => {
      await Driver.findByIdAndUpdate(driverId, {
        location: { type: 'Point', coordinates: [lng, lat] }
      });
      // Broadcast to rider if on a ride
      if (rideId) {
        io.to(`ride_${rideId}`).emit('driver_moved', { lat, lng });
      }
    });

    // Rider requests a ride
    socket.on('request_ride', async ({ rideId, riderId, pickup }) => {
      socket.join(`ride_${rideId}`);

      // Find nearest driver within 5km using MongoDB $near
      const nearbyDrivers = await Driver.find({
        isOnline: true,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [pickup.lng, pickup.lat] },
            $maxDistance: 5000 // 5km in meters
          }
        }
      }).limit(1);

      if (nearbyDrivers.length === 0) {
        socket.emit('no_drivers_found');
        return;
      }

      const driver = nearbyDrivers[0];
      // Send ride request to driver (with 15s timeout on frontend)
      io.to(driver.socketId).emit('new_ride_request', { rideId, pickup });
    });

    // Driver accepts ride
    socket.on('accept_ride', async ({ rideId, driverId }) => {
      await Ride.findByIdAndUpdate(rideId, { driver: driverId, status: 'driver_found' });
      io.to(`ride_${rideId}`).emit('ride_accepted', { driverId });
      socket.join(`ride_${rideId}`);
    });

    // Trip lifecycle events
    socket.on('trip_started', async ({ rideId }) => {
      await Ride.findByIdAndUpdate(rideId, { status: 'in_progress' });
      io.to(`ride_${rideId}`).emit('trip_status', { status: 'in_progress' });
    });

    socket.on('trip_completed', async ({ rideId }) => {
      const ride = await Ride.findByIdAndUpdate(rideId, { status: 'completed' }, { new: true });
      io.to(`ride_${rideId}`).emit('trip_status', { status: 'completed', fare: ride.fare });
    });

    socket.on('disconnect', async () => {
      await Driver.findOneAndUpdate({ socketId: socket.id }, { isOnline: false, socketId: null });
    });
  });
};
