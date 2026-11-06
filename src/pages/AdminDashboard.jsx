import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { Store, Users, ShoppingBag, TrendingUp, AlertTriangle, Play, Pause, Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['#d70f64', '#0056b3', '#00b894', '#fdcb6e'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { restaurants, orders, categories, addCategory } = useApp();
  
  // States
  const [users, setUsers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🍔");
  const [surgeMode, setSurgeMode] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // 1. Listen to Users & Riders
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubUsers();
  }, []);

  // Derived Data (Null-safe)
  const totalRestaurants = restaurants.filter(r => r.status === "approved").length;
  const pendingRestaurants = restaurants.filter(r => r.status === "pending");
  const totalCustomers = users.filter(u => u.role === "customer").length;
  const totalRiders = users.filter(u => u.role === "rider").length;
  const allRiders = users.filter(u => u.role === "rider"); // For fleet table
  
  const activeOrders = orders.filter(o => o.status !== "Delivered" && o.status !== "Cancelled");
  const totalRevenue = orders.reduce((sum, o) => o.status === "Delivered" ? sum + (o.total || 0) : sum, 0);

  // Order Funnel
  const funnelData = [
    { stage: "Pending", count: orders.filter(o => o.status === "Pending").length },
    { stage: "Preparing", count: orders.filter(o => o.status === "Preparing").length },
    { stage: "Ready", count: orders.filter(o => o.status === "Ready").length },
    { stage: "On the Way", count: orders.filter(o => o.status === "Out for Delivery").length },
  ];

  // Handlers
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return alert("Enter category name");
    await addCategory({ name: newCatName, icon: newCatIcon, isActive: true, order: categories.length + 1 });
    setNewCatName(""); setNewCatIcon("🍔");
    alert("Category added!");
  };

  const handleApprove = async (id) => {
    await updateDoc(doc(db, "restaurants", id), { status: "approved" });
  };

  const handleReject = async (id) => {
    if (window.confirm("Are you sure you want to reject this restaurant?")) {
      await updateDoc(doc(db, "restaurants", id), { status: "rejected" });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ color: "#1a1a2e", margin: 0, fontSize: "28px" }}>Command Center</h1>
          <p style={{ color: "#666", marginTop: "5px" }}>Live overview of all GB Panda operations.</p>
        </div>
        <div style={{ display: "flex", gap: "15px" }}>
          <button 
            onClick={() => setSurgeMode(!surgeMode)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "8px", border: "none", background: surgeMode ? "#ffeaa7" : "#f0f0f0", color: surgeMode ? "#d63031" : "#333", fontWeight: "bold", cursor: "pointer" }}
          >
            {surgeMode ? <Pause size={18} /> : <Play size={18} />} 
            {surgeMode ? "Surge Pricing ON" : "Surge Pricing OFF"}
          </button>
          <button 
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "8px", border: "none", background: maintenanceMode ? "#ff7675" : "#f0f0f0", color: maintenanceMode ? "#fff" : "#333", fontWeight: "bold", cursor: "pointer" }}
          >
            <AlertTriangle size={18} /> {maintenanceMode ? "Maintenance ON" : "Maintenance OFF"}
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <motion.div whileHover={{ y: -5, scale: 1.02 }} onClick={() => navigate("/manage-restaurants")} style={{ background: "#fff", padding: "20px", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderLeft: "5px solid #0056b3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, color: "#666", fontSize: "14px" }}>Total Restaurants</h3>
            <Store size={24} color="#0056b3" />
          </div>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#1a1a2e" }}>{totalRestaurants}</p>
          {pendingRestaurants.length > 0 && <span style={{ fontSize: "12px", color: "#d63031", fontWeight: "bold" }}>{pendingRestaurants.length} pending approval</span>}
        </motion.div>

        <motion.div whileHover={{ y: -5, scale: 1.02 }} onClick={() => navigate("/admin-users")} style={{ background: "#fff", padding: "20px", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderLeft: "5px solid #00b894" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, color: "#666", fontSize: "14px" }}>Total Users</h3>
            <Users size={24} color="#00b894" />
          </div>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#1a1a2e" }}>{users.length}</p>
          <span style={{ fontSize: "12px", color: "#666" }}>{totalCustomers} Customers • {totalRiders} Riders</span>
        </motion.div>

        <motion.div whileHover={{ y: -5, scale: 1.02 }} onClick={() => navigate("/admin-orders")} style={{ background: "#fff", padding: "20px", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderLeft: "5px solid #d70f64" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, color: "#666", fontSize: "14px" }}>Active Orders</h3>
            <ShoppingBag size={24} color="#d70f64" />
          </div>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#1a1a2e" }}>{activeOrders.length}</p>
          <span style={{ fontSize: "12px", color: "#d63031", fontWeight: "bold" }}>Live in-progress</span>
        </motion.div>

        <motion.div whileHover={{ y: -5, scale: 1.02 }} onClick={() => navigate("/admin-revenue")} style={{ background: "#fff", padding: "20px", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderLeft: "5px solid #fdcb6e" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h3 style={{ margin: 0, color: "#666", fontSize: "14px" }}>Total Revenue</h3>
            <TrendingUp size={24} color="#fdcb6e" />
          </div>
          <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0, color: "#1a1a2e" }}>Rs {totalRevenue.toLocaleString()}</p>
          <span style={{ fontSize: "12px", color: "#666" }}>Net GMV</span>
        </motion.div>
      </div>

      {/* MIDDLE SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "30px" }}>
        {/* Live Funnel */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "20px", color: "#1a1a2e" }}>Live Dispatch Funnel</h2>
          <div style={{ height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#d70f64" radius={[5, 5, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Manager */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "20px", color: "#1a1a2e" }}>Category Manager</h2>
          <form onSubmit={handleAddCategory} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input placeholder="Name (e.g. Sushi)" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={{ flex: 2, padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} required />
            <input placeholder="🍣" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd", textAlign: "center" }} required />
            <button type="submit" style={{ background: "#1a1a2e", color: "#fff", border: "none", borderRadius: "8px", padding: "0 15px", cursor: "pointer" }}><Plus size={18} /></button>
          </form>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {categories.map(c => (
              <span key={c.id} style={{ background: "#f0f0f0", padding: "8px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}>
                {c.icon} {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        
        {/* Pending Restaurants */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "20px", color: "#1a1a2e" }}>Pending Restaurant Approvals</h2>
          {pendingRestaurants.length === 0 ? <p style={{ color: "#888" }}>No pending requests.</p> : null}
          {pendingRestaurants.map(req => (
            <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
              <div>
                <strong>{req.name}</strong>
                <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#666" }}>{req.cuisine}</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => handleApprove(req.id)} style={{ background: "#00b894", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Approve</button>
                <button onClick={() => handleReject(req.id)} style={{ background: "#ff7675", color: "#fff", border: "none", padding: "8px 15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Reject</button>
              </div>
            </div>
          ))}
        </div>

        {/* Rider Fleet Snapshot */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "20px", color: "#1a1a2e" }}>Rider Fleet Snapshot</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee", textAlign: "left", color: "#666", fontSize: "14px" }}>
                <th style={{ paddingBottom: "10px" }}>Rider Name</th>
                <th style={{ paddingBottom: "10px" }}>Status</th>
                <th style={{ paddingBottom: "10px" }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {allRiders.slice(0, 5).map(rider => (
                <tr key={rider.id} style={{ borderBottom: "1px solid #eee", fontSize: "14px" }}>
                  <td style={{ padding: "12px 0" }}>{rider.name || "Unnamed Rider"}</td>
                  <td style={{ padding: "12px 0" }}>
                    <span style={{ background: rider.status === "online" ? "#e6fced" : "#f0f0f0", color: rider.status === "online" ? "green" : "#666", padding: "3px 8px", borderRadius: "12px", fontWeight: "bold", fontSize: "12px" }}>
                      {rider.status || "offline"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 0" }}>⭐ {rider.averageRating || "5.0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;