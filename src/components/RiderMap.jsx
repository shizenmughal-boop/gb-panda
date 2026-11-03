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

// Custom red icon for the Customer's house
const customerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const RiderMap = ({ customerLocation }) => {
  const center = customerLocation ? [customerLocation.lat, customerLocation.lng] : [31.5204, 74.3587];

  return (
    <div style={{ height: "250px", width: "100%", borderRadius: "8px", overflow: "hidden", marginTop: "10px" }}>
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {customerLocation && (
          <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
            <Popup>Drop-off Location 🏠</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default RiderMap;