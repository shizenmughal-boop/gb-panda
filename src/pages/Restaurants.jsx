import { useLocation } from "react-router-dom";
import RestaurantCard from "../components/RestaurantCard";
import { useApp } from "../context/AppContext";

const Restaurants = () => {
  const { restaurants } = useApp();
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("search") || "";

  // Filter restaurants by name or cuisine based on the search query
  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(query.toLowerCase()) || 
    r.cuisine.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="section">
      <h1>{query ? `Search Results for "${query}"` : "All Restaurants"}</h1>
      
      {filteredRestaurants.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: "12px" }}>
          <h2>😕 No restaurants found</h2>
          <p style={{ color: "#666", marginTop: "10px" }}>Try searching for something else like "Pizza" or "Burger".</p>
        </div>
      ) : (
        <div className="restaurant-grid">
          {filteredRestaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
        </div>
      )}
    </div>
  );
};
export default Restaurants;