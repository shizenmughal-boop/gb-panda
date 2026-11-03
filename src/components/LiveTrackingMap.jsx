import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom scooter icon for the rider
const scooterIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const LiveTrackingMap = ({ riderLocation }) => {
  // Default to Lahore if rider location isn't available yet
  const center = riderLocation ? [riderLocation.lat, riderLocation.lng] : [31.5204, 74.3587];

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "12px", overflow: "hidden", marginTop: "20px" }}>
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Rider Marker */}
        {riderLocation && (
          <Marker position={[riderLocation.lat, riderLocation.lng]} icon={scooterIcon}>
            <Popup>Your Rider is here! 🛵</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;