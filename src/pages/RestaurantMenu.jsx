import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import FoodCard from "../components/FoodCard";
import ReviewSection from "../components/ReviewSection";
import { Star, Clock, MapPin, AlertTriangle } from "lucide-react";

const RestaurantMenu = () => {
  const { id } = useParams(); 
  const { restaurants, menuItems } = useApp();
  
  const [selectedCategory, setSelectedCategory] = useState("All");

  const restaurant = restaurants.find((r) => String(r.id) === String(id));
  
  // Filter strictly by restaurantId, matching string formats
  const items = menuItems.filter((i) => String(i.restaurantId) === String(id));

  if (!restaurant) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Restaurant not found 😕</h2>
        <Link to="/" className="btn-primary" style={{ display: "inline-block", width: "auto", marginTop: "20px" }}>
          Back to Home
        </Link>
      </div>
    );
  }

  const isClosed = restaurant.isOpen === false || restaurant.isBlocked === true;
  const categories = ["All", ...new Set(items.map(item => item.category).filter(Boolean))];
  const filteredItems = selectedCategory === "All" ? items : items.filter(i => i.category === selectedCategory);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      
      <div style={{ background: "#fff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "30px" }}>
        <img src={restaurant.imageUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500"} alt={restaurant.name} style={{ width: "100%", height: "250px", objectFit: "cover" }} />
        <div style={{ padding: "25px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
            <div>
              <h1 style={{ margin: "0 0 10px 0", fontSize: "32px", color: "#1a1a2e" }}>{restaurant.name}</h1>
              <p style={{ margin: 0, color: "#666", fontSize: "16px" }}>{restaurant.cuisine}</p>
            </div>
            <div style={{ background: "#f0f0f0", padding: "10px 15px", borderRadius: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "900", color: "#1a1a2e", display: "flex", alignItems: "center", gap: "5px" }}>
                <Star fill="gold" color="gold" size={20} /> {restaurant.rating || "New"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px", color: "#555", fontSize: "14px", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Clock size={16} /> {restaurant.prepTime || "25-35 min"}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><MapPin size={16} /> {restaurant.address}</span>
          </div>
        </div>
      </div>

      {isClosed && (
        <div style={{ background: "#ffe5e5", borderLeft: "5px solid #d63031", padding: "20px", borderRadius: "12px", marginBottom: "30px", display: "flex", alignItems: "center", gap: "15px" }}>
          <AlertTriangle color="#d63031" size={28} />
          <div>
            <h3 style={{ margin: 0, color: "#d63031" }}>Currently Not Accepting Orders</h3>
            <p style={{ margin: "5px 0 0 0", color: "#555" }}>This restaurant is closed or busy.</p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", overflowX: "auto", marginBottom: "25px", paddingBottom: "5px" }}>
        {categories.map(cat => (
          <button 
            key={cat} onClick={() => setSelectedCategory(cat)}
            style={{ padding: "10px 20px", borderRadius: "20px", border: "none", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap", background: selectedCategory === cat ? "#d70f64" : "#fff", color: selectedCategory === cat ? "#fff" : "#333", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
          >
            {cat}
          </button>
        ))}
      </div>

      <h2 style={{ fontSize: "22px", marginBottom: "20px", color: "#1a1a2e" }}>{selectedCategory} Menu</h2>
      {filteredItems.length === 0 ? (
        <div style={{ padding: "40px", background: "#fff", borderRadius: "12px", textAlign: "center" }}>
          <p style={{ color: "#666" }}>No items available in this category.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {filteredItems.map(item => (
            <FoodCard key={item.id} item={item} restaurant={restaurant} />
          ))}
        </div>
      )}

      <ReviewSection restaurantId={id} />
    </div>
  );
};

export default RestaurantMenu;