import { useState, useEffect } from 'react';
import { Power, Navigation } from 'lucide-react';
import Map from '../components/Map';
import socket from '../socket/socket';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function DriverDashboard() {
  const { user } = useStore();
  const [isOnline, setIsOnline] = useState(false);
  const [driverPos, setDriverPos] = useState(null);
  const [rideRequest, setRideRequest] = useState(null);
  const [timer, setTimer] = useState(15);
  const [currentRideId, setCurrentRideId] = useState(null);
  const [tripStatus, setTripStatus] = useState('idle');

  useEffect(() => {
    // Simulate driver movement by watching GPS position
    const watchId = navigator.geolocation.watchPosition((pos) => {
      const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setDriverPos(newPos);
      if (isOnline) {
        socket.emit('driver_location_update', {
          driverId: user.driverId,
          lat: newPos.lat,
          lng: newPos.lng,
          rideId: currentRideId
        });
      }
    });

    socket.connect();

    socket.on('new_ride_request', ({ rideId, pickup }) => {
      setRideRequest({ rideId, pickup });
      setTimer(15);
      toast('New ride request! 🚨', { icon: '🚖' });
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [isOnline, currentRideId]);

  // 15-second timer for ride request
  useEffect(() => {
    if (!rideRequest) return;
    if (timer <= 0) {
      setRideRequest(null);
      toast.error('Request expired');
      return;
    }
    const t = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [rideRequest, timer]);

  const toggleOnline = () => {
    const newState = !isOnline;
    setIsOnline(newState);
    if (newState) {
      socket.emit('driver_online', { driverId: user.driverId });
      toast.success("You're Online! Looking for riders 🟢");
    } else {
      toast('You went Offline', { icon: '🔴' });
    }
  };

  const acceptRide = () => {
    socket.emit('accept_ride', { rideId: rideRequest.rideId, driverId: user.driverId });
    setCurrentRideId(rideRequest.rideId);
    setTripStatus('accepted');
    setRideRequest(null);
    toast.success('Ride accepted! Head to pickup 🚗');
  };

  const rejectRide = () => {
    setRideRequest(null);
    toast('Ride rejected', { icon: '❌' });
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      <div className="bg-brand-card px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚗</span>
          <span className="text-brand-yellow font-bold text-xl">Driver Mode</span>
        </div>
        <button onClick={toggleOnline}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all ${
            isOnline ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'
          }`}>
          <Power size={16} />
          {isOnline ? 'Online' : 'Offline'}
        </button>
      </div>

      <div className="flex flex-1 gap-4 p-4 flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-72 space-y-4">
          <div className="bg-brand-card rounded-2xl p-5 text-center">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl mb-3 ${
              isOnline ? 'bg-green-500/20 border-2 border-green-500' : 'bg-gray-600/20 border-2 border-gray-600'
            }`}>
              🚗
            </div>
            <p className="text-white font-semibold text-lg">{user?.name}</p>
            <p className={`text-sm font-semibold mt-1 ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
              {isOnline ? '● Online — Accepting Rides' : '○ Offline'}
            </p>
          </div>

          {/* Trip Controls */}
          {tripStatus === 'accepted' && (
            <div className="bg-brand-card rounded-2xl p-4 space-y-3">
              <p className="text-brand-yellow font-semibold">Active Ride</p>
              <button onClick={() => { socket.emit('trip_started', { rideId: currentRideId }); setTripStatus('in_progress'); }}
                className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold">
                🚦 Start Trip
              </button>
            </div>
          )}
          {tripStatus === 'in_progress' && (
            <div className="bg-brand-card rounded-2xl p-4 space-y-3">
              <p className="text-blue-400 font-semibold">Trip in Progress 🛣️</p>
              <button onClick={() => { socket.emit('trip_completed', { rideId: currentRideId }); setTripStatus('idle'); setCurrentRideId(null); }}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold">
                ✅ Complete Trip
              </button>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden" style={{minHeight: '400px'}}>
          <Map riderPos={null} driverPos={driverPos} onMapClick={() => {}} />
        </div>
      </div>

      {/* Ride Request Popup — overlays the whole screen */}
      {rideRequest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card rounded-2xl p-6 w-full max-w-sm border border-brand-yellow shadow-2xl">
            <div className="text-center mb-4">
              <span className="text-5xl">🚨</span>
              <h2 className="text-white font-bold text-xl mt-2">New Ride Request!</h2>
            </div>
            <div className="bg-brand-dark rounded-xl p-4 mb-4 flex items-center gap-2">
              <Navigation size={16} className="text-green-400" />
              <span className="text-gray-300 text-sm">
                Pickup: {rideRequest.pickup.lat?.toFixed(4)}, {rideRequest.pickup.lng?.toFixed(4)}
              </span>
            </div>
            {/* Timer Ring */}
            <div className="text-center mb-4">
              <div className={`text-4xl font-bold ${timer <= 5 ? 'text-red-400' : 'text-brand-yellow'}`}>
                {timer}s
              </div>
              <p className="text-gray-400 text-sm">to accept</p>
            </div>
            <div className="flex gap-3">
              <button onClick={rejectRide}
                className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 py-3 rounded-xl font-semibold">
                ✕ Reject
              </button>
              <button onClick={acceptRide}
                className="flex-1 bg-brand-yellow text-brand-dark py-3 rounded-xl font-bold">
                ✓ Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
