import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import RestaurantCard from "../components/RestaurantCard";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Favorites = () => {
  const { userData } = useAuth();
  const { restaurants } = useApp();

  const favoriteIds = userData?.favoriteRestaurants || [];
  const favoriteRestaurants = restaurants.filter(r => favoriteIds.includes(r.id) && r.status === "approved");

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "30px", color: "#1a1a2e", display: "flex", alignItems: "center", gap: "10px" }}>
        <Heart fill="#d70f64" color="#d70f64" /> My Favorites
      </h1>

      {favoriteRestaurants.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "60px", marginBottom: "20px" }}>💔</div>
          <h2 style={{ color: "#333", marginBottom: "10px" }}>No favorites yet</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>Tap the heart icon on any restaurant to save it here.</p>
          <Link to="/restaurants" style={{ background: "#d70f64", color: "#fff", padding: "12px 25px", borderRadius: "25px", textDecoration: "none", fontWeight: "bold" }}>
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" }}>
          {favoriteRestaurants.map(rest => <RestaurantCard key={rest.id} restaurant={rest} />)}
        </div>
      )}
    </div>
  );
};

export default Favorites;