import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Package, CheckCircle, Clock, Bike } from "lucide-react";

const TrackOrder = () => {
  const { id } = useParams();
  const { orders, loading } = useApp(); 
  const [searchId, setSearchId] = useState(id || "");
  const [waiting, setWaiting] = useState(true); // New waiting state

  // If the URL changes, update the input
  useEffect(() => {
    if (id) setSearchId(id);
  }, [id]);

  // If we have an ID from the URL, give Firebase 2 seconds to sync before showing "Not Found"
  useEffect(() => {
    setWaiting(true);
    const timer = setTimeout(() => setWaiting(false), 2500);
    return () => clearTimeout(timer);
  }, [searchId]);

  const order = orders.find(o => o.displayId === Number(searchId));

  return (
    <div className="section" style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center", paddingTop: "50px" }}>
      <h1>Track Your Order 📦</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>Enter your Order ID to see the current status.</p>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "40px", maxWidth: "400px", margin: "0 auto 40px" }}>
        <input 
          type="number" 
          placeholder="Enter Order ID (e.g., 1042)" 
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          style={{ flex: 1, padding: "12px 20px", borderRadius: "30px", border: "2px solid #eee", outline: "none" }}
        />
        <Link to={`/track/${searchId}`} className="btn-primary" style={{ width: "auto", padding: "12px 30px", marginTop: 0 }}>
          Track
        </Link>
      </div>

      {/* Show Loading if Firebase is loading OR if we are waiting for a new order to appear */}
      {(loading || waiting) && searchId && !order && (
        <div style={{ padding: "20px" }}>
          <p style={{ color: "#d70f64", fontWeight: "bold", fontSize: "18px" }}>Searching for Order #{searchId}... ⏳</p>
          <p style={{ color: "#888", fontSize: "14px" }}>Syncing with the live database...</p>
        </div>
      )}

      {/* Show error ONLY if we are not loading, not waiting, and it's still not found */}
      {!loading && !waiting && searchId && searchId.length >= 3 && !order && (
        <div style={{ padding: "20px", background: "#ffe5e5", borderRadius: "10px" }}>
          <p style={{ color: "red", fontWeight: "bold" }}>Order #{searchId} not found.</p>
          <p style={{ color: "#666", fontSize: "14px" }}>Please check if the ID is correct.</p>
        </div>
      )}

      {order && (
        <div style={{ background: "#fff", padding: "40px", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          <h2 style={{ marginBottom: "10px" }}>Order #{order.displayId}</h2>
          <p style={{ color: "#666", marginBottom: "40px" }}>Customer: {order.customer} | Total: Rs {order.total}</p>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: "15px", left: "12%", right: "12%", height: "4px", background: "#eee", zIndex: 1 }}></div>
            <div style={{ 
              position: "absolute", top: "15px", left: "12%", 
              width: order.status === "Delivered" || order.status === "Out for Delivery" ? "76%" : order.status === "Ready" ? "50%" : order.status === "Preparing" ? "25%" : "0%", 
              height: "4px", background: "#d70f64", zIndex: 1, transition: "all 0.5s" 
            }}></div>

            <div style={{ zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#d70f64", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={18} />
              </div>
              <span style={{ fontSize: "12px", fontWeight: "bold" }}>Pending</span>
            </div>

            <div style={{ zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: ["Preparing", "Ready", "Out for Delivery", "Delivered"].includes(order.status) ? "#d70f64" : "#eee", color: ["Preparing", "Ready", "Out for Delivery", "Delivered"].includes(order.status) ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Package size={18} />
              </div>
              <span style={{ fontSize: "12px", fontWeight: "bold" }}>Preparing</span>
            </div>

            <div style={{ zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: ["Out for Delivery", "Delivered"].includes(order.status) ? "#d70f64" : "#eee", color: ["Out for Delivery", "Delivered"].includes(order.status) ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bike size={18} />
              </div>
              <span style={{ fontSize: "12px", fontWeight: "bold" }}>On the Way</span>
            </div>

            <div style={{ zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: order.status === "Delivered" ? "#d70f64" : "#eee", color: order.status === "Delivered" ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={18} />
              </div>
              <span style={{ fontSize: "12px", fontWeight: "bold" }}>Delivered</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;