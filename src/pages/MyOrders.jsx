import { useApp } from "../context/AppContext";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";

const MyOrders = () => {
  const { orders } = useApp();

  return (
    <div className="section" style={{ maxWidth: "800px", margin: "0 auto", paddingTop: "40px" }}>
      <h1>My Orders 📦</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>View and track your recent orders.</p>

      {orders.length === 0 ? (
        <div style={{ background: "#fff", padding: "40px", textAlign: "center", borderRadius: "12px" }}>
          <h3>No orders yet!</h3>
          <Link to="/restaurants" className="btn-primary" style={{ display: "inline-block", width: "auto", marginTop: "20px" }}>
            Order Food Now
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
              <div>
                {/* Using displayId instead of the long Firebase ID */}
                <h3 style={{ marginBottom: "5px" }}>Order #{order.displayId || order.id}</h3>
                <p style={{ color: "#666", fontSize: "14px" }}>{order.items}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Rs {order.total}</p>
                <span style={{ 
                  display: "inline-block", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold",
                  background: order.status === "Pending" ? "#ffeaa7" : order.status === "Preparing" ? "#74b9ff" : order.status === "Ready" ? "#a29bfe" : order.status === "Out for Delivery" ? "#fab1a0" : "#55efc4",
                  color: "#333"
                }}>
                  {order.status}
                </span>
              </div>
              {/* Link using displayId */}
              <Link to={`/track/${order.displayId || order.id}`} style={{ background: "#d70f64", color: "#fff", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                <Package size={16} /> Track Order
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;