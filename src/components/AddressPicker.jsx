import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Navigation } from "lucide-react";

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom house icon
const houseIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/25/25694.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Component to handle map clicks and marker placement
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      icon={houseIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          setPosition(e.target.getLatLng());
        },
      }}
    />
  );
}

// Component to auto-detect GPS
function LocateUser({ setPosition }) {
  const map = useMap();
  
  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPos = { lat: latitude, lng: longitude };
          setPosition(newPos);
          map.flyTo(newPos, 16);
        },
        (error) => {
          console.error("GPS Error:", error);
          alert("Could not get your location. Please check browser permissions.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      style={{
        position: "absolute", top: "10px", right: "10px", zIndex: 1000,
        background: "#d70f64", color: "#fff", border: "none", padding: "10px 15px",
        borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex",
        alignItems: "center", gap: "5px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
      }}
    >
      <Navigation size={16} /> Locate Me
    </button>
  );
}

const AddressPicker = ({ position, setPosition }) => {
  const defaultCenter = [31.5204, 74.3587]; // Lahore center fallback
  const mapCenter = position ? [position.lat, position.lng] : defaultCenter;

  return (
    <div style={{ height: "300px", width: "100%", borderRadius: "12px", overflow: "hidden", position: "relative", border: "1px solid #ddd" }}>
      <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocateUser setPosition={setPosition} />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  );
};

export default AddressPicker;