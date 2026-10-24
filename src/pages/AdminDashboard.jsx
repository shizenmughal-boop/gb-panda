import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

// Mock data for the charts
const revenueData = [
  { name: "Mon", sales: 4000 }, { name: "Tue", sales: 3000 },
  { name: "Wed", sales: 5000 }, { name: "Thu", sales: 4500 },
  { name: "Fri", sales: 7000 }, { name: "Sat", sales: 9000 },
  { name: "Sun", sales: 8500 },
];

const COLORS = ['#d70f64', '#0056b3', '#00b894', '#fdcb6e'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { restaurants, addRestaurant, orders } = useApp();
  
  const [newRest, setNewRest] = useState({ name: "", cuisine: "", image: "", deliveryTime: "30-40 min", deliveryFee: 50, rating: 4.5, minOrder: 200 });

  const handleAddRestaurant = (e) => {
    e.preventDefault();
    if (!newRest.name || !newRest.cuisine) return alert("Please fill required fields");
    addRestaurant({
      ...newRest,
      deliveryFee: Number(newRest.deliveryFee),
      image: newRest.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500"
    });
    alert("Restaurant added successfully!");
    setNewRest({ name: "", cuisine: "", image: "", deliveryTime: "30-40 min", deliveryFee: 50, rating: 4.5, minOrder: 200 });
  };

  // Prepare data for the Donut Chart based on the actual restaurants in state
  const pieData = restaurants.slice(0, 4).map((r, index) => ({
    name: r.name,
    value: 4000 - (index * 500) + Math.random() * 1000 // Mock sales data per restaurant
  }));

  return (
    <div style={{ padding: "40px", background: "#eef2f5", minHeight: "100vh" }}>
      <button onClick={() => navigate("/")} style={{ marginBottom: "20px", cursor: "pointer", border: "none", background: "none", color: "#0056b3", fontWeight: "bold", fontSize: "16px" }}>← Logout</button>
      
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "30px", color: "#0056b3" }}>GB Panda Admin ⚙️</motion.h1>
      
      {/* Top Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "40px" }}>
        <motion.div whileHover={{ scale: 1.02 }} style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
          <h3>Total Restaurants</h3>
          <p style={{ fontSize: "28px", fontWeight: "bold" }}>{restaurants.length}</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
          <h3>Total Users</h3>
          <p style={{ fontSize: "28px", fontWeight: "bold" }}>12,450</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
          <h3>Active Orders</h3>
          <p style={{ fontSize: "28px", fontWeight: "bold", color: "#d70f64" }}>{orders.filter(o => o.status !== "Delivered").length}</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
          <h3>Revenue</h3>
          <p style={{ fontSize: "28px", fontWeight: "bold", color: "green" }}>Rs 1.2M</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "40px" }}>
        
        {/* Area Chart */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
          <h2>Weekly Platform Revenue</h2>
          <div style={{ height: "300px", marginTop: "20px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#0056b3" fill="#74b9ff" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
          <h2>Restaurant Market Share</h2>
          <div style={{ height: "300px", marginTop: "20px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Add Restaurant & Live Riders */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        
        {/* Add Restaurant Form */}
        <div>
          <h2>Onboard New Restaurant</h2>
          <form onSubmit={handleAddRestaurant} style={{ background: "#fff", borderRadius: "10px", padding: "20px", marginTop: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "15px" }}>
            <input placeholder="Restaurant Name" value={newRest.name} onChange={(e) => setNewRest({...newRest, name: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} required />
            <input placeholder="Cuisine (e.g., Fast Food)" value={newRest.cuisine} onChange={(e) => setNewRest({...newRest, cuisine: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} required />
            <input placeholder="Image URL (optional)" value={newRest.image} onChange={(e) => setNewRest({...newRest, image: e.target.value})} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
            <button type="submit" className="btn-primary" style={{ background: "#0056b3" }}>Add Restaurant</button>
          </form>
        </div>

        {/* Live Riders List */}
        <div>
          <h2>Live Rider Activity</h2>
          <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", marginTop: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "10px", fontWeight: "bold", color: "#666" }}>
              <span>Rider Name</span>
              <span>Status</span>
            </div>
            {/* Mock Riders */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
              <span>🛵 Ahmed</span>
              <span style={{ color: "green", fontWeight: "bold" }}>Delivering #102</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
              <span>🛵 Bilal</span>
              <span style={{ color: "#f39c12", fontWeight: "bold" }}>Waiting for Pickup</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
              <span>🛵 Zain</span>
              <span style={{ color: "#888", fontWeight: "bold" }}>Offline</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;