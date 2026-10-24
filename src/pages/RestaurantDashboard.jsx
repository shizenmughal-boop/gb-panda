import { useState } from "react";
import { useApp } from "../context/AppContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { orders, updateOrderStatus, addMenuItem } = useApp();
  
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "", image: "" });

  const handleAddFood = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return alert("Please fill name and price");
    
    addMenuItem({
      ...newItem,
      price: Number(newItem.price),
      restaurantId: 1, 
      image: newItem.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"
    });
    
    alert("Food item added successfully! Check the customer menu.");
    setNewItem({ name: "", price: "", category: "", image: "" });
  };

  return (
    <div style={{ padding: "40px", background: "#f4f7f6", minHeight: "100vh" }}>
      <button 
        onClick={() => navigate("/")} 
        style={{ marginBottom: "20px", cursor: "pointer", border: "none", background: "none", color: "#d70f64", fontWeight: "bold", fontSize: "16px" }}
      >
        ← Logout
      </button>
      
      <motion.h1 initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: "30px" }}>
        Restaurant Dashboard 🍳
      </motion.h1>
      
      <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", flex: 1, boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
          <h3>Today's Sales</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "green" }}>Rs 24,500</p>
        </div>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", flex: 1, boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
          <h3>Active Orders</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#d70f64" }}>
            {orders.filter(o => o.status !== "Delivered").length}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        
        {/* Live Orders */}
        <div>
          <h2>Live Orders</h2>
          <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", marginTop: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", maxHeight: "500px", overflowY: "auto" }}>
            {orders.map(o => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", padding: "15px 0" }}>
                <div>
                  <strong>Order #{o.id}</strong> - {o.customer} (Rs {o.total}) <br />
                  <small style={{ color: "#666" }}>{o.items}</small>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ 
                    display: "inline-block", marginBottom: "8px", padding: "5px 10px", borderRadius: "20px", fontSize: "12px", 
                    background: o.status === "Pending" ? "#ffeaa7" : o.status === "Preparing" ? "#74b9ff" : o.status === "Ready" ? "#a29bfe" : o.status === "Out for Delivery" ? "#fab1a0" : "#55efc4" 
                  }}>
                    {o.status}
                  </span>
                  <br />
                  {o.status === "Pending" && (
                    <button onClick={() => updateOrderStatus(o.id, "Preparing")} style={{ cursor: "pointer", padding: "5px 10px", borderRadius: "5px", border: "none", background: "#333", color: "#fff" }}>
                      Accept Order
                    </button>
                  )}
                  {o.status === "Preparing" && (
                    <button onClick={() => updateOrderStatus(o.id, "Ready")} style={{ cursor: "pointer", padding: "5px 10px", borderRadius: "5px", border: "none", background: "#6c5ce7", color: "#fff" }}>
                      Mark as Ready
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Food Form */}
        <div>
          <h2>Add New Menu Item</h2>
          <form onSubmit={handleAddFood} style={{ background: "#fff", borderRadius: "10px", padding: "20px", marginTop: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "15px" }}>
            <input placeholder="Food Name" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} required />
            <input placeholder="Price (Rs)" type="number" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} required />
            <input placeholder="Category (e.g., Burgers)" value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
            <input placeholder="Image URL (optional)" value={newItem.image} onChange={(e) => setNewItem({...newItem, image: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
            <button type="submit" className="btn-primary" style={{ marginTop: "10px" }}>Add Item to Menu</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;