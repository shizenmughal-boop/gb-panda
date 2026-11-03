import { useLocation } from "react-router-dom";
import RestaurantCard from "../components/RestaurantCard";
import { useApp } from "../context/AppContext";

const Restaurants = () => {
  const { restaurants } = useApp();
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("search")?.toLowerCase() || "";

  // Filter logic: Must be approved AND match the search query
  const filtered = restaurants.filter(r => {
    const isApproved = r.status === "approved" || !r.status;
    const matchesSearch = r.name.toLowerCase().includes(query) || r.cuisine.toLowerCase().includes(query);
    return isApproved && matchesSearch;
  });

  return (
    <div className="section">
      <h1>{query ? `Search Results for "${query}"` : "All Restaurants"}</h1>
      
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: "12px" }}>
          <h2>😕 No restaurants found</h2>
          <p style={{ color: "#666", marginTop: "10px" }}>Try searching for something else like "Pizza" or "Burger".</p>
        </div>
      ) : (
        <div className="restaurant-grid">
          {filtered.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
        </div>
      )}
    </div>
  );
};

export default Restaurants;