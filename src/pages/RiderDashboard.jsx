import { useApp } from "../context/AppContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const RiderDashboard = () => {
  const navigate = useNavigate();
  const { orders, updateOrderStatus } = useApp();

  // Riders only see orders that are "Ready" or "Out for Delivery"
  const availableOrders = orders.filter(o => o.status === "Ready");
  const myDeliveries = orders.filter(o => o.status === "Out for Delivery");

  return (
    <div style={{ padding: "40px", background: "#f4f7f6", minHeight: "100vh" }}>
      <button 
        onClick={() => navigate("/")} 
        style={{ marginBottom: "20px", cursor: "pointer", border: "none", background: "none", color: "#d70f64", fontWeight: "bold", fontSize: "16px" }}
      >
        ← Logout
      </button>
      
      <motion.h1 initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: "30px" }}>
        Rider Dashboard 🛵
      </motion.h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        
        {/* Available Deliveries */}
        <div>
          <h2>Available for Pickup</h2>
          <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", marginTop: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
            {availableOrders.length === 0 ? <p style={{ color: "#888" }}>No orders ready for pickup right now.</p> : null}
            {availableOrders.map(o => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", padding: "15px 0" }}>
                <div>
                  <strong>Order #{o.id}</strong> - {o.customer} <br />
                  <small style={{ color: "#666" }}>{o.items}</small>
                </div>
                <div>
                  <button 
                    onClick={() => updateOrderStatus(o.id, "Out for Delivery")} 
                    style={{ cursor: "pointer", padding: "8px 15px", borderRadius: "5px", border: "none", background: "#0056b3", color: "#fff", fontWeight: "bold" }}
                  >
                    Accept & Pick Up
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Active Deliveries */}
        <div>
          <h2>My Active Deliveries</h2>
          <div style={{ background: "#fff", borderRadius: "10px", padding: "20px", marginTop: "15px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
            {myDeliveries.length === 0 ? <p style={{ color: "#888" }}>You have no active deliveries.</p> : null}
            {myDeliveries.map(o => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", padding: "15px 0" }}>
                <div>
                  <strong>Order #{o.id}</strong> - {o.customer} <br />
                  <small style={{ color: "#666" }}>{o.items}</small>
                </div>
                <div>
                  <button 
                    onClick={() => updateOrderStatus(o.id, "Delivered")} 
                    style={{ cursor: "pointer", padding: "8px 15px", borderRadius: "5px", border: "none", background: "green", color: "#fff", fontWeight: "bold" }}
                  >
                    Mark as Delivered
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RiderDashboard;