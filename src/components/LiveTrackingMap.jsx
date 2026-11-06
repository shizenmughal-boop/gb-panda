import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icons
const scooterIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2830/2830305.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const houseIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/25/25694.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const restaurantIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3170/3170733.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const LiveTrackingMap = ({ riderLocation, customerLocation, restaurantLocation }) => {
  const [mapCenter, setMapCenter] = useState([31.5204, 74.3587]); // Lahore fallback

  useEffect(() => {
    // Center map on rider if available, else customer, else restaurant
    if (riderLocation) {
      setMapCenter([riderLocation.lat, riderLocation.lng]);
    } else if (customerLocation) {
      setMapCenter([customerLocation.lat, customerLocation.lng]);
    } else if (restaurantLocation) {
      setMapCenter([restaurantLocation.lat, restaurantLocation.lng]);
    }
  }, [riderLocation, customerLocation, restaurantLocation]);

  return (
    <div style={{ height: "350px", width: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid #ddd" }}>
      <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Restaurant Marker */}
        {restaurantLocation && (
          <Marker position={[restaurantLocation.lat, restaurantLocation.lng]} icon={restaurantIcon}>
            <Popup>Restaurant Pickup Location</Popup>
          </Marker>
        )}

        {/* Customer House Marker */}
        {customerLocation && (
          <Marker position={[customerLocation.lat, customerLocation.lng]} icon={houseIcon}>
            <Popup>Your Delivery Address</Popup>
          </Marker>
        )}

        {/* Live Rider Marker */}
        {riderLocation && (
          <Marker position={[riderLocation.lat, riderLocation.lng]} icon={scooterIcon}>
            <Popup>Rider is on the way! 🛵</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;