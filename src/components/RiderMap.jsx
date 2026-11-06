import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icons
const scooterIcon = new L.Icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/2830/2830305.png", iconSize: [40, 40], iconAnchor: [20, 40] });
const houseIcon = new L.Icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/25/25694.png", iconSize: [35, 35], iconAnchor: [17, 35] });
const restaurantIcon = new L.Icon({ iconUrl: "https://cdn-icons-png.flaticon.com/512/3170/3170733.png", iconSize: [35, 35], iconAnchor: [17, 35] });

const RiderMap = ({ 
  mode = "route", // "route" or "heatmap"
  riderLocation, 
  customerLocation, 
  restaurantLocation,
  heatmapData = [] // Array of { lat, lng, intensity }
}) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const [mapCenter, setMapCenter] = useState([31.5204, 74.3587]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // 1. OSRM Route Fetching
  useEffect(() => {
    if (mode !== "route" || !customerLocation) return;

    const start = riderLocation || restaurantLocation;
    if (!start) return;

    setLoadingRoute(true);
    // Fetch route from OSRM
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${customerLocation.lng},${customerLocation.lat}?overview=full&geometries=geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          // OSRM returns [lng, lat], Leaflet needs [lat, lng]
          const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoords(coords);
        }
      })
      .catch(err => console.error("OSRM Route Error:", err))
      .finally(() => setLoadingRoute(false));

  }, [mode, riderLocation, restaurantLocation, customerLocation]);

  // 2. Map Centering Logic
  useEffect(() => {
    if (mode === "heatmap" && heatmapData.length > 0) {
      // Center on the hottest zone
      const hottest = heatmapData.reduce((max, item) => item.intensity > max.intensity ? item : max, heatmapData[0]);
      setMapCenter([hottest.lat, hottest.lng]);
    } else if (riderLocation) {
      setMapCenter([riderLocation.lat, riderLocation.lng]);
    } else if (customerLocation) {
      setMapCenter([customerLocation.lat, customerLocation.lng]);
    } else if (restaurantLocation) {
      setMapCenter([restaurantLocation.lat, restaurantLocation.lng]);
    }
  }, [mode, riderLocation, customerLocation, restaurantLocation, heatmapData]);

  return (
    <div style={{ height: "300px", width: "100%", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
      {loadingRoute && (
        <div style={{ position: "absolute", top: 10, left: 10, background: "#fff", padding: "5px 10px", borderRadius: "5px", zIndex: 1000, fontSize: "12px", fontWeight: "bold" }}>
          Calculating Route... ⏳
        </div>
      )}
      <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ROUTE MODE PINS */}
        {mode === "route" && (
          <>
            {restaurantLocation && (
              <Marker position={[restaurantLocation.lat, restaurantLocation.lng]} icon={restaurantIcon}>
                <Popup>Restaurant Pickup</Popup>
              </Marker>
            )}
            {customerLocation && (
              <Marker position={[customerLocation.lat, customerLocation.lng]} icon={houseIcon}>
                <Popup>Customer Dropoff</Popup>
              </Marker>
            )}
            {riderLocation && (
              <Marker position={[riderLocation.lat, riderLocation.lng]} icon={scooterIcon}>
                <Popup>You are here</Popup>
              </Marker>
            )}
            {routeCoords.length > 0 && (
              <Polyline positions={routeCoords} color="#d70f64" weight={5} opacity={0.8} />
            )}
          </>
        )}

        {/* HEATMAP MODE PINS */}
        {mode === "heatmap" && heatmapData.map((zone, idx) => (
          <Circle
            key={idx}
            center={[zone.lat, zone.lng]}
            radius={zone.intensity * 200} // Scale radius based on intensity
            pathOptions={{
              color: zone.intensity > 5 ? "red" : zone.intensity > 2 ? "orange" : "yellow",
              fillColor: zone.intensity > 5 ? "red" : zone.intensity > 2 ? "orange" : "yellow",
              fillOpacity: 0.3
            }}
          >
            <Popup>Demand Zone: {zone.intensity} active orders</Popup>
          </Circle>
        ))}

      </MapContainer>
    </div>
  );
};

export default RiderMap;