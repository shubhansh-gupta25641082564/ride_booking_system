import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, DollarSign, Star } from 'lucide-react';
import Map from '../components/Map';
import API from '../api/axios';
import socket from '../socket/socket';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function RiderDashboard() {
  const { user, currentRide, setCurrentRide, driverLocation, setDriverLocation } = useStore();
  const [riderPos, setRiderPos] = useState(null);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [selectMode, setSelectMode] = useState('pickup'); // 'pickup' or 'dropoff'
  const [estimate, setEstimate] = useState(null);
  const [rideStatus, setRideStatus] = useState('idle'); // idle, searching, driver_found, in_progress, completed

  useEffect(() => {
    // Get rider's current location
    navigator.geolocation.getCurrentPosition((pos) => {
      setRiderPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });

    socket.connect();

    socket.on('no_drivers_found', () => {
      toast.error('No drivers nearby. Try again in a bit!');
      setRideStatus('idle');
    });

    socket.on('ride_accepted', ({ driverId }) => {
      toast.success('Driver is on the way! 🚗');
      setRideStatus('driver_found');
    });

    socket.on('driver_moved', ({ lat, lng }) => {
      setDriverLocation({ lat, lng });
    });

    socket.on('trip_status', ({ status, fare }) => {
      setRideStatus(status);
      if (status === 'completed') {
        toast.success(`Trip Complete! Fare: ₹${fare} 🎉`);
      }
    });

    return () => socket.disconnect();
  }, []);

  const handleMapClick = (latlng) => {
    if (selectMode === 'pickup') {
      setPickup(latlng);
      toast.success('Pickup set!');
      setSelectMode('dropoff');
    } else {
      setDropoff(latlng);
      toast.success('Dropoff set!');
    }
  };

  const getEstimate = async () => {
    if (!pickup || !dropoff) return toast.error('Set pickup and dropoff first!');
    const { data } = await API.post('/rides/estimate', { pickup, dropoff });
    setEstimate(data);
  };

  const requestRide = async () => {
    if (!estimate) return toast.error('Get fare estimate first!');
    setRideStatus('searching');
    toast.loading('Finding your driver...', { id: 'searching' });

    const { data: ride } = await API.post('/rides/create', {
      pickup: { address: 'Selected Location', coordinates: pickup },
      dropoff: { address: 'Destination', coordinates: dropoff },
      fare: estimate.fare,
      distance: estimate.distance,
    });

    setCurrentRide(ride);
    socket.emit('request_ride', {
      rideId: ride._id,
      riderId: user.id,
      pickup: { lat: pickup.lat, lng: pickup.lng }
    });
    toast.dismiss('searching');
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      {/* Top Navbar */}
      <div className="bg-brand-card px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚖</span>
          <span className="text-brand-yellow font-bold text-xl">Uber Lite</span>
        </div>
        <span className="text-gray-300">Hi, {user?.name} 👋</span>
      </div>

      <div className="flex flex-1 gap-0 md:gap-4 p-0 md:p-4 flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-brand-card rounded-2xl p-5 space-y-4 m-2 md:m-0">
          <h2 className="text-white font-semibold text-lg">Book Your Ride</h2>

          {/* Select Mode Buttons */}
          <div className="flex gap-2">
            {['pickup', 'dropoff'].map(mode => (
              <button key={mode} onClick={() => setSelectMode(mode)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  selectMode === mode ? 'bg-brand-yellow text-brand-dark' : 'bg-brand-dark text-white'
                }`}>
                {mode === 'pickup' ? '📍 Pickup' : '🏁 Dropoff'}
              </button>
            ))}
          </div>
          <p className="text-gray-400 text-sm">👆 Click on map to set {selectMode} point</p>

          {/* Location Display */}
          {pickup && (
            <div className="bg-brand-dark rounded-xl p-3 flex items-center gap-2">
              <MapPin size={16} className="text-green-400" />
              <span className="text-sm text-gray-300">Pickup: {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}</span>
            </div>
          )}
          {dropoff && (
            <div className="bg-brand-dark rounded-xl p-3 flex items-center gap-2">
              <Navigation size={16} className="text-red-400" />
              <span className="text-sm text-gray-300">Dropoff: {dropoff.lat.toFixed(4)}, {dropoff.lng.toFixed(4)}</span>
            </div>
          )}

          {/* Fare Estimate */}
          {estimate && (
            <div className="bg-brand-dark rounded-xl p-4 border border-brand-yellow/30">
              <h3 className="text-brand-yellow font-semibold mb-2">Fare Estimate</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1"><Navigation size={12}/> Distance</span>
                  <span className="text-white">{estimate.distance} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1"><Clock size={12}/> ETA</span>
                  <span className="text-white">{estimate.duration} mins</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-300 flex items-center gap-1"><DollarSign size={14}/> Fare</span>
                  <span className="text-brand-yellow text-lg">₹{estimate.fare}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Badge */}
          {rideStatus !== 'idle' && (
            <div className={`text-center py-2 rounded-xl text-sm font-semibold ${
              rideStatus === 'driver_found' ? 'bg-green-500/20 text-green-400' :
              rideStatus === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
              rideStatus === 'completed' ? 'bg-purple-500/20 text-purple-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {rideStatus === 'searching' && '🔍 Finding Driver...'}
              {rideStatus === 'driver_found' && '🚗 Driver is Coming!'}
              {rideStatus === 'in_progress' && '🛣️ Trip in Progress'}
              {rideStatus === 'completed' && '✅ Trip Completed!'}
            </div>
          )}

          {/* Action Buttons */}
          {rideStatus === 'idle' && (
            <>
              <button onClick={getEstimate}
                className="w-full bg-brand-light text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all">
                Get Fare Estimate
              </button>
              {estimate && (
                <button onClick={requestRide}
                  className="w-full bg-brand-yellow text-brand-dark py-3 rounded-xl font-bold hover:opacity-90 transition-all">
                  Book Ride 🚀
                </button>
              )}
            </>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 h-64 md:h-auto m-2 md:m-0 rounded-2xl overflow-hidden" style={{minHeight: '400px'}}>
          <Map
            riderPos={riderPos}
            driverPos={driverLocation}
            pickupPos={pickup}
            dropoffPos={dropoff}
            onMapClick={handleMapClick}
          />
        </div>
      </div>
    </div>
  );
}
