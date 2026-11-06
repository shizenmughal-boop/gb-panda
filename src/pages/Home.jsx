import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Hero from "../components/Hero";
import CategoryCard from "../components/CategoryCard";
import RestaurantCard from "../components/RestaurantCard";
import { db } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

const Home = () => {
  const { restaurants, categories } = useApp();
  const { currentUser, userData } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const [banners, setBanners] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);

  // Fetch active banners
  useEffect(() => {
    const q = query(collection(db, "banners"), where("isActive", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Fetch active order for floating tracker
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "orders"), 
      where("customerId", "==", currentUser.uid),
      where("status", "in", ["Pending", "Preparing", "Ready", "Out for Delivery"])
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setActiveOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setActiveOrder(null);
      }
    });
    return () => unsub();
  }, [currentUser]);

  const approvedRestaurants = restaurants.filter(r => r.status === "approved" && !r.isBlocked);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      
      {/* Floating Active Order Tracker */}
      {activeOrder && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={() => navigate(`/track/${activeOrder.id}`)}
          style={{ background: "#1a1a2e", color: "#fff", padding: "15px 20px", borderRadius: "12px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.15)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingBag size={20} color="#d70f64" />
            <span style={{ fontWeight: "bold" }}>You have an active order #{activeOrder.displayId}</span>
          </div>
          <span style={{ background: "#d70f64", padding: "5px 15px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
            {activeOrder.status} • Track Now →
          </span>
        </motion.div>
      )}

      <Hero />

      {/* Promo Banners */}
      {banners.length > 0 && (
        <div style={{ display: "flex", gap: "20px", overflowX: "auto", marginBottom: "40px", paddingBottom: "10px" }}>
          {banners.map(banner => (
            <img key={banner.id} src={banner.imageUrl} alt={banner.title} style={{ height: "150px", borderRadius: "16px", objectFit: "cover" }} />
          ))}
        </div>
      )}

      {/* Categories */}
      <h2 style={{ fontSize: "24px", marginBottom: "20px", color: "#1a1a2e" }}>What's on your mind? 🤔</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "15px", marginBottom: "50px" }}>
        {categories.filter(c => c.isActive !== false).map(cat => (
          <CategoryCard key={cat.id} category={cat} onClick={() => navigate(`/restaurants?category=${cat.name}`)} />
        ))}
      </div>

      {/* Popular Restaurants */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", color: "#1a1a2e" }}>Popular Restaurants 🔥</h2>
        <span onClick={() => navigate("/restaurants")} style={{ color: "#d70f64", fontWeight: "bold", cursor: "pointer" }}>See All →</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" }}>
        {approvedRestaurants.slice(0, 8).map(rest => (
          <RestaurantCard key={rest.id} restaurant={rest} />
        ))}
      </div>

    </div>
  );
};

export default Home;