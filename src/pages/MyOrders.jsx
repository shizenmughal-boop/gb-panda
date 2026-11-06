import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { Package, RefreshCcw, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MyOrders = () => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dispute Modal State
  const [disputeOrder, setDisputeOrder] = useState(null);
  const [issueType, setIssueType] = useState("Missing Item");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "orders"), where("customerId", "==", currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid needing a composite index
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  const handleOrderAgain = (order) => {
    if (!order.items || order.items.length === 0) return;
    
    // In a real app, you'd fetch the restaurant first to pass it to addToCart
    // For this implementation, we assume the cart context handles it if the restaurant exists
    let addedCount = 0;
    order.items.forEach(item => {
      // Mock restaurant object since we only have IDs in history
      const mockRestaurant = { id: order.restaurantId, name: order.restaurantName, deliveryFee: order.deliveryFee };
      if (addToCart(item, mockRestaurant)) addedCount++;
    });
    
    if (addedCount > 0) {
      showToast("Items added to cart!", "success");
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!disputeOrder) return;
    
    try {
      await addDoc(collection(db, "disputes"), {
        orderId: disputeOrder.id,
        customerId: currentUser.uid,
        customerName: disputeOrder.customerName,
        restaurantId: disputeOrder.restaurantId,
        restaurantName: disputeOrder.restaurantName,
        issueType,
        description,
        requestedRefund: disputeOrder.total,
        status: "open",
        createdAt: serverTimestamp()
      });
      showToast("Issue reported. Our team will contact you.", "success");
      setDisputeOrder(null);
      setDescription("");
    } catch (error) {
      showToast("Failed to submit report.", "error");
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "50px" }}>Loading orders...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "30px 20px" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "20px", color: "#1a1a2e" }}>My Orders</h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px", background: "#fff", borderRadius: "16px" }}>
          <Package size={50} color="#ccc" style={{ marginBottom: "15px" }} />
          <h3>No orders yet</h3>
          <Link to="/" style={{ color: "#d70f64", fontWeight: "bold", textDecoration: "none" }}>Start ordering now</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px" }}>{order.restaurantName}</h3>
                  <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#666" }}>
                    {new Date(order.createdAt?.toMillis() || Date.now()).toLocaleDateString()} • {order.items?.length} items
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontWeight: "bold", color: "#d70f64", fontSize: "16px" }}>Rs {order.total}</span><br />
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: order.status === "Delivered" ? "green" : order.status === "Cancelled" ? "#d63031" : "#856404" }}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #eee", paddingTop: "15px", marginTop: "15px" }}>
                <Link to={`/track/${order.id}`} style={{ flex: 1, textAlign: "center", background: "#e6f0fa", color: "#0056b3", padding: "10px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px" }}>
                  Track Order
                </Link>
                
                <button onClick={() => handleOrderAgain(order)} style={{ flex: 1, background: "#e6fced", color: "green", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                  <RefreshCcw size={16} /> Order Again
                </button>

                {order.status === "Delivered" && (
                  <button onClick={() => setDisputeOrder(order)} style={{ flex: 1, background: "#ffe5e5", color: "#d63031", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                    <AlertTriangle size={16} /> Report Issue
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispute Modal */}
      <AnimatePresence>
        {disputeOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: "#fff", padding: "25px", borderRadius: "16px", width: "400px", maxWidth: "90%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0 }}>Report an Issue</h3>
                <button onClick={() => setDisputeOrder(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
              </div>
              <form onSubmit={handleReportIssue}>
                <select value={issueType} onChange={(e) => setIssueType(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "15px" }}>
                  <option>Missing Item</option>
                  <option>Wrong Order</option>
                  <option>Quality Issue</option>
                  <option>Never Arrived</option>
                </select>
                <textarea placeholder="Describe the issue..." value={description} onChange={(e) => setDescription(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", minHeight: "80px", marginBottom: "15px", outline: "none" }} />
                <button type="submit" style={{ width: "100%", background: "#d63031", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Submit Report</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyOrders;