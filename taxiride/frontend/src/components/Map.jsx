import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Custom icons
const riderIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
  iconSize: [35, 35]
});
const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/744/744465.png',
  iconSize: [35, 35]
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

export default function Map({ riderPos, driverPos, onMapClick, pickupPos, dropoffPos }) {
  const center = riderPos || [25.4358, 81.8463]; // Default: Prayagraj 🏠

  return (
    <MapContainer center={center} zoom={14} className="w-full h-full rounded-2xl z-10">
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      {riderPos && <Marker position={riderPos} icon={riderIcon}><Popup>You</Popup></Marker>}
      {driverPos && <Marker position={driverPos} icon={driverIcon}><Popup>Driver</Popup></Marker>}
      {pickupPos && <Marker position={pickupPos}><Popup>Pickup</Popup></Marker>}
      {dropoffPos && <Marker position={dropoffPos}><Popup>Dropoff</Popup></Marker>}
    </MapContainer>
  );
}
