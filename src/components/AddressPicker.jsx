import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom component to handle map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

// Custom component to auto-detect location and center the map
function LocateUser({ setPosition }) {
  const map = useMap();
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPos = { lat: latitude, lng: longitude };
          setPosition(newPos); // Set the marker
          map.flyTo(newPos, 15); // Center the map on user's location
        },
        (error) => {
          console.warn("Location access denied or unavailable. Using default center.");
        },
        { enableHighAccuracy: true }
      );
    }
  }, [map, setPosition]);

  return null;
}

const AddressPicker = ({ position, setPosition }) => {
  return (
    <div style={{ height: "250px", width: "100%", borderRadius: "8px", overflow: "hidden", marginBottom: "15px" }}>
      <MapContainer center={[31.5204, 74.3587]} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Auto-detect on load */}
        <LocateUser setPosition={setPosition} />
        
        {/* Click to move marker */}
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  );
};

export default AddressPicker;