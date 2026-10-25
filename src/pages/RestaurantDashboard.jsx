import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { logout, currentUser, restaurantId } = useAuth(); 
  const { orders, updateOrderStatus, addMenuItem, menuItems, uploadImage } = useApp();
  
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "", imageFile: null });
  const [isUploading, setIsUploading] = useState(false);

  // Filter menu items and orders by the restaurant's ID
  const myMenuItems = menuItems.filter(item => item.restaurantId === restaurantId);
  const myOrders = orders.filter(o => o.restaurantId === restaurantId);

  const handleAddFood = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return alert("Please fill name and price");
    
    setIsUploading(true);
    
    let imageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"; // Default fallback
    
    // If the user selected a file, upload it to Firebase Storage
    if (newItem.imageFile) {
      const uploadedUrl = await uploadImage(newItem.imageFile);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    addMenuItem({
      name: newItem.name,
      price: Number(newItem.price),
      category: newItem.category,
      restaurantId: restaurantId, 
      image: imageUrl
    });
    
    alert("Food item added to your menu!");
    setNewItem({ name: "", price: "", category: "", imageFile: null });
    setIsUploading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <div style={{ padding: "40px", background: "#f4f7f6", minHeight: "100vh" }}>
      <button onClick={handleLogout} style={{ marginBottom: "20px", cursor: "pointer", border: "none", background: "none", color: "#d70f64", fontWeight: "bold", fontSize: "16px" }}>
        ← Logout
      </button>
      
      <motion.h1 initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: "30px" }}>
        Restaurant Dashboard 🍳 <span style={{ fontSize: "16px", color: "#666", marginLeft: "10px" }}>({currentUser?.email})</span>
      </motion.h1>
      
      <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", flex: 1, boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
          <h3>Today's Sales</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "green" }}>Rs 24,500</p>
        </div>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", flex: 1, boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
          <h3>Active Orders</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#d70f64" }}>
            {myOrders.filter(o => o.status !== "Delivered").length}
          </p>
        </div>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", flex: 1, boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
          <h3>Menu Items</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#0056b3" }}>{myMenuItems.length}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "30px" }}>
        
        {/* 1. Live Orders */}
        <div>
          <h2>Live Orders</h2>
          <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", marginTop: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", maxHeight: "500px", overflowY: "auto" }}>
            {myOrders.length === 0 && <p style={{color: "#888"}}>No orders for your restaurant yet.</p>}
            {myOrders.map(o => (
              <div key={o.id} style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid #eee", padding: "15px 0", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>#{o.displayId || o.id}</strong>
                  <span style={{ 
                    padding: "2px 8px", borderRadius: "12px", fontSize: "12px", 
                    background: o.status === "Pending" ? "#ffeaa7" : o.status === "Preparing" ? "#74b9ff" : o.status === "Ready" ? "#a29bfe" : "#55efc4" 
                  }}>
                    {o.status}
                  </span>
                </div>
                <small style={{ color: "#666" }}>{o.items}</small>
                <div style={{ display: "flex", gap: "10px" }}>
                  {o.status === "Pending" && (
                    <button onClick={() => updateOrderStatus(o.id, "Preparing")} style={{ flex: 1, cursor: "pointer", padding: "5px", borderRadius: "5px", border: "none", background: "#333", color: "#fff" }}>
                      Accept
                    </button>
                  )}
                  {o.status === "Preparing" && (
                    <button onClick={() => updateOrderStatus(o.id, "Ready")} style={{ flex: 1, cursor: "pointer", padding: "5px", borderRadius: "5px", border: "none", background: "#6c5ce7", color: "#fff" }}>
                      Mark Ready
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Add New Food Form */}
        <div>
          <h2>Add New Food</h2>
          <form onSubmit={handleAddFood} style={{ background: "#fff", borderRadius: "10px", padding: "20px", marginTop: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "15px" }}>
            <input placeholder="Food Name" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} required />
            <input placeholder="Price (Rs)" type="number" value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} required />
            <input placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
            
            <div>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "5px" }}>Upload Food Image:</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setNewItem({...newItem, imageFile: e.target.files[0]})} 
                style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", width: "100%" }} 
              />
            </div>

            <button type="submit" disabled={isUploading} className="btn-primary" style={{ marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
              {isUploading ? "Uploading..." : <><Plus size={18} /> Add to Menu</>}
            </button>
          </form>
        </div>

        {/* 3. My Current Menu */}
        <div>
          <h2>My Menu Items</h2>
          <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", marginTop: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", maxHeight: "500px", overflowY: "auto" }}>
            {myMenuItems.length === 0 && <p style={{color: "#888"}}>No items on your menu yet.</p>}
            {myMenuItems.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "15px", borderBottom: "1px solid #eee", padding: "10px 0" }}>
                <img src={item.image} alt={item.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "5px" }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "14px" }}>{item.name}</h4>
                  <p style={{ fontSize: "12px", color: "#d70f64", fontWeight: "bold" }}>Rs {item.price}</p>
                </div>
                <button style={{ background: "none", border: "none", color: "red", cursor: "pointer" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RestaurantDashboard;