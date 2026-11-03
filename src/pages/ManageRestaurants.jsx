import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { ArrowLeft, Ban, CheckCircle, Eye } from "lucide-react";
import { motion } from "framer-motion";

const ManageRestaurants = () => {
  const navigate = useNavigate();
  const { restaurants, menuItems } = useApp();
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "restaurants", id), { status: newStatus });
      alert(`Restaurant status updated to: ${newStatus}`);
    } catch (error) {
      console.error("Error updating status: ", error);
    }
  };

  if (selectedRestaurant) {
    const items = menuItems.filter(i => String(i.restaurantId) === String(selectedRestaurant.id));
    return (
      <div style={{ padding: "40px", background: "#eef2f5", minHeight: "100vh" }}>
        <button onClick={() => setSelectedRestaurant(null)} style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "20px", cursor: "pointer", border: "none", background: "none", color: "#0056b3", fontWeight: "bold", fontSize: "16px" }}>
          <ArrowLeft size={18} /> Back to Restaurants
        </button>
        
        <h1>{selectedRestaurant.name} Menu 🍽️</h1>
        <p style={{ color: "#666", marginBottom: "20px" }}>Total Items: {items.length}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
          {items.length === 0 && <p>No menu items added yet.</p>}
          {items.map(item => (
            <div key={item.id} style={{ background: "#fff", padding: "15px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
              <img src={item.image} alt={item.name} style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px" }} />
              <h3>{item.name}</h3>
              <p style={{ color: "#d70f64", fontWeight: "bold" }}>Rs {item.price}</p>
              <p style={{ fontSize: "12px", color: "#666" }}>{item.category}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", background: "#eef2f5", minHeight: "100vh" }}>
      <button onClick={() => navigate("/admin-dashboard")} style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "20px", cursor: "pointer", border: "none", background: "none", color: "#0056b3", fontWeight: "bold", fontSize: "16px" }}>
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "30px", color: "#0056b3" }}>
        Manage All Restaurants 🏪
      </motion.h1>

      <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
        {restaurants.map(rest => (
          <div key={rest.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", padding: "15px 0" }}>
            <div>
              <h3>{rest.name}</h3>
              <p style={{ fontSize: "14px", color: "#666" }}>{rest.cuisine}</p>
              <span style={{ 
                padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold",
                background: rest.status === "approved" || !rest.status ? "#55efc4" : rest.status === "pending" ? "#ffeaa7" : "#ff7675"
              }}>
                {rest.status || "approved"}
              </span>
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setSelectedRestaurant(rest)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 12px", borderRadius: "5px", border: "none", background: "#74b9ff", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>
                <Eye size={16} /> View Menu
              </button>
              
              {(rest.status === "approved" || !rest.status) ? (
                <button onClick={() => handleStatusChange(rest.id, "blocked")} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 12px", borderRadius: "5px", border: "none", background: "#d63031", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>
                  <Ban size={16} /> Block
                </button>
              ) : (
                <button onClick={() => handleStatusChange(rest.id, "approved")} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 12px", borderRadius: "5px", border: "none", background: "#00b894", color: "#fff", cursor: "pointer", fontWeight: "bold" }}>
                  <CheckCircle size={16} /> Unblock
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageRestaurants;