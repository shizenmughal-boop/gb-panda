import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext"; 
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const revenueData = [
  { name: "Mon", sales: 4000 }, { name: "Tue", sales: 3000 },
  { name: "Wed", sales: 5000 }, { name: "Thu", sales: 4500 },
  { name: "Fri", sales: 7000 }, { name: "Sat", sales: 9000 },
  { name: "Sun", sales: 8500 },
];

const COLORS = ['#d70f64', '#0056b3', '#00b894', '#fdcb6e'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth(); 
  const { restaurants, orders } = useApp();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, "restaurants", id), { status: "approved" });
      alert("Restaurant Approved successfully!");
    } catch (error) {
      console.error("Error approving restaurant: ", error);
    }
  };

  const pieData = restaurants.slice(0, 4).map((r, index) => ({
    name: r.name,
    value: 4000 - (index * 500) + Math.random() * 1000
  }));

  return (
    <div style={{ padding: "40px", background: "#eef2f5", minHeight: "100vh" }}>
      <button onClick={handleLogout} style={{ marginBottom: "20px", cursor: "pointer", border: "none", background: "none", color: "#0056b3", fontWeight: "bold", fontSize: "16px" }}>← Logout</button>
      
      <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "30px", color: "#0056b3" }}>
        GB Panda Admin ⚙️ <span style={{ fontSize: "16px", color: "#666", marginLeft: "10px" }}>({currentUser?.email})</span>
      </motion.h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "40px" }}>
        
        {/* Clickable Total Restaurants Card */}
        <motion.div 
          whileHover={{ scale: 1.05, cursor: "pointer" }} 
          onClick={() => navigate("/manage-restaurants")}
          style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}
        >
          <h3>Total Restaurants</h3>
          <p style={{ fontSize: "28px", fontWeight: "bold" }}>{restaurants.filter(r => r.status === "approved" || !r.status).length}</p>
          <span style={{ fontSize: "12px", color: "#0056b3", fontWeight: "bold" }}>Click to manage →</span>
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

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "40px" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h2>Pending Restaurant Approvals</h2>
          <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", marginTop: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
            {restaurants.filter(r => r.status === "pending").length === 0 ? (
              <p style={{ color: "#888" }}>No pending requests.</p>
            ) : (
              restaurants.filter(r => r.status === "pending").map(req => (
                <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", padding: "15px 0" }}>
                  <div>
                    <strong>{req.name}</strong> <br />
                    <small style={{ color: "#666" }}>Cuisine: {req.cuisine}</small>
                  </div>
                  <button 
                    onClick={() => handleApprove(req.id)} 
                    style={{ cursor: "pointer", padding: "8px 15px", borderRadius: "5px", border: "none", background: "green", color: "#fff", fontWeight: "bold" }}
                  >
                    Approve
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2>Live Rider Activity</h2>
          <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", marginTop: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "10px", fontWeight: "bold", color: "#666" }}>
              <span>Rider Name</span>
              <span>Status</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
              <span>🛵 Ahmed</span>
              <span style={{ color: "green", fontWeight: "bold" }}>Delivering #102</span>
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