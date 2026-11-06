import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import FoodCard from "../components/FoodCard";
import ReviewSection from "../components/ReviewSection";
import { Star, Clock, MapPin, AlertTriangle } from "lucide-react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const RestaurantMenu = () => {
  const { id } = useParams();
  const { restaurants } = useApp();
  
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const restaurant = restaurants.find(r => String(r.id) === String(id));

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "menuItems"), where("restaurantId", "==", id));
    const unsub = onSnapshot(q, (snap) => {
      setMenuItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [id]);

  if (!restaurant) return <div style={{ padding: "50px", textAlign: "center" }}>Restaurant not found.</div>;

  const isClosed = restaurant.isOpen === false || restaurant.isBlocked === true;

  // Extract unique categories from menu items
  const categories = ["All", ...new Set(menuItems.map(item => item.category).filter(Boolean))];

  const filteredItems = selectedCategory === "All" ? menuItems : menuItems.filter(i => i.category === selectedCategory);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      
      {/* Restaurant Header */}
      <div style={{ background: "#fff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "30px" }}>
        <img src={restaurant.imageUrl} alt={restaurant.name} style={{ width: "100%", height: "250px", objectFit: "cover" }} />
        <div style={{ padding: "25px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
            <div>
              <h1 style={{ margin: "0 0 10px 0", fontSize: "32px", color: "#1a1a2e" }}>{restaurant.name}</h1>
              <p style={{ margin: 0, color: "#666", fontSize: "16px" }}>{restaurant.category}</p>
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

      {/* Closed Banner */}
      {isClosed && (
        <div style={{ background: "#ffe5e5", borderLeft: "5px solid #d63031", padding: "20px", borderRadius: "12px", marginBottom: "30px", display: "flex", alignItems: "center", gap: "15px" }}>
          <AlertTriangle color="#d63031" size={28} />
          <div>
            <h3 style={{ margin: 0, color: "#d63031" }}>Currently Not Accepting Orders</h3>
            <p style={{ margin: "5px 0 0 0", color: "#555" }}>This restaurant is closed or busy. You cannot add items to your cart right now.</p>
          </div>
        </div>
      )}

      {/* Menu Categories */}
      <div style={{ display: "flex", gap: "10px", overflowX: "auto", marginBottom: "25px", paddingBottom: "5px" }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setSelectedCategory(cat)}
            style={{ 
              padding: "10px 20px", borderRadius: "20px", border: "none", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap",
              background: selectedCategory === cat ? "#d70f64" : "#fff",
              color: selectedCategory === cat ? "#fff" : "#333",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <h2 style={{ fontSize: "22px", marginBottom: "20px", color: "#1a1a2e" }}>{selectedCategory} Menu</h2>
      {filteredItems.length === 0 ? (
        <p style={{ color: "#666" }}>No items available in this category.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {filteredItems.map(item => (
            <FoodCard key={item.id} item={item} restaurant={restaurant} />
          ))}
        </div>
      )}

      {/* Reviews Section */}
      <ReviewSection restaurantId={id} />

    </div>
  );
};

export default RestaurantMenu;