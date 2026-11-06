import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Clock, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useState, useEffect } from "react";

const RestaurantCard = ({ restaurant }) => {
  const { currentUser, userData } = useAuth();
  const { showToast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (userData?.favoriteRestaurants) {
      setIsFavorited(userData.favoriteRestaurants.includes(restaurant.id));
    }
  }, [userData, restaurant.id]);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast("Please log in to save favorites.", "error");
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    try {
      if (isFavorited) {
        await updateDoc(userRef, { favoriteRestaurants: arrayRemove(restaurant.id) });
        showToast("Removed from favorites", "success");
      } else {
        await updateDoc(userRef, { favoriteRestaurants: arrayUnion(restaurant.id) });
        showToast("Added to favorites ❤️", "success");
      }
    } catch (error) {
      console.error("Fav error:", error);
    }
  };

  const isClosed = restaurant.isOpen === false || restaurant.isBlocked === true;

  return (
    <Link to={`/restaurant/${restaurant.id}`} style={{ textDecoration: "none" }}>
      <motion.div
        whileHover={{ y: -8, rotateX: 2, rotateY: -2, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        style={{
          background: "#fff", borderRadius: "16px", overflow: "hidden",
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)", position: "relative",
          cursor: isClosed ? "not-allowed" : "pointer", opacity: isClosed ? 0.7 : 1
        }}
      >
        {/* Image Section */}
        <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
          <img src={restaurant.imageUrl} alt={restaurant.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          
          {/* Closed Overlay */}
          {isClosed && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: "bold", border: "2px solid #fff", padding: "5px 15px", borderRadius: "20px" }}>Currently Closed</span>
            </div>
          )}

          {/* Favorite Button */}
          <button 
            onClick={toggleFavorite}
            style={{ position: "absolute", top: "15px", right: "15px", background: "#fff", border: "none", borderRadius: "50%", width: "35px", height: "35px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.15)" }}
          >
            <Heart size={18} fill={isFavorited ? "#d70f64" : "none"} color={isFavorited ? "#d70f64" : "#666"} />
          </button>
        </div>

        {/* Info Section */}
        <div style={{ padding: "15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#1a1a2e" }}>{restaurant.name}</h3>
            <span style={{ display: "flex", alignItems: "center", gap: "3px", background: "#f0f0f0", padding: "3px 8px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold" }}>
              <Star size={12} fill="gold" color="gold" /> {restaurant.rating || "New"}
            </span>
          </div>
          <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#666" }}>{restaurant.category} • {restaurant.address}</p>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#444", borderTop: "1px solid #eee", paddingTop: "10px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Clock size={14} /> {restaurant.prepTime || "25-35 min"}</span>
            <span>Min. Rs {restaurant.minOrder || 250}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default RestaurantCard;