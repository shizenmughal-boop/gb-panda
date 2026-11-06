import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { Package, CheckCircle, Clock, Bike, XCircle, Star } from "lucide-react";
import LiveTrackingMap from "../components/LiveTrackingMap";
import LiveChat from "../components/LiveChat";

const TrackOrder = () => {
  const { id } = useParams();
  const { restaurants } = useApp();
  const { showToast } = useToast();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riderRating, setRiderRating] = useState(0);
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);

  // Real-time order listener
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "orders", id), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setOrder(data);
        if (data.isRiderRated) setIsRatingSubmitted(true);
      } else {
        showToast("Order not found.", "error");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [id, showToast]);

  // Cancel Order
  const handleCancel = async () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        await updateDoc(doc(db, "orders", id), { status: "Cancelled", updatedAt: new Date() });
        showToast("Order cancelled.", "success");
      } catch (error) {
        showToast("Failed to cancel order.", "error");
      }
    }
  };

  // Rate Rider
  const handleRateRider = async () => {
    if (riderRating === 0) return showToast("Select a star rating.", "error");
    try {
      await updateDoc(doc(db, "orders", id), { isRiderRated: true, riderRating: riderRating });
      showToast("Thank you for your feedback! ⭐", "success");
      setIsRatingSubmitted(true);
    } catch (error) {
      showToast("Failed to submit rating.", "error");
    }
  };

  const getEstimatedTime = (status) => {
    switch (status) {
      case "Pending": return "Waiting for restaurant to confirm your order (Est. 30–40 mins)";
      case "Preparing": return "The kitchen is preparing your food (Est. 25–35 mins)";
      case "Ready": return "Your order is packed and waiting for rider pickup (Est. 15–20 mins)";
      case "Out for Delivery": return "Your rider is on the way! Track live on the map below (Est. 10–15 mins)";
      case "Delivered": return "Order delivered! Enjoy your meal 🎉";
      case "Cancelled": return "This order was cancelled ❌";
      default: return "";
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "50px" }}>Loading order details...</div>;
  if (!order) return <div style={{ textAlign: "center", padding: "50px" }}>Order not found.</div>;

  const restaurant = restaurants.find(r => r.id === order.restaurantId);

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
      
      <div style={{ background: "#fff", padding: "30px", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", color: "#1a1a2e" }}>Order #{order.id.slice(-4).toUpperCase()}</h1>
          <span style={{ background: order.status === "Delivered" ? "#e6fced" : order.status === "Cancelled" ? "#ffe5e5" : "#fff3cd", color: order.status === "Delivered" ? "green" : order.status === "Cancelled" ? "#d63031" : "#856404", padding: "6px 12px", borderRadius: "20px", fontWeight: "bold", fontSize: "14px" }}>
            {order.status}
          </span>
        </div>

        {/* Dynamic ETA Banner */}
        <div style={{ background: "#e6f0fa", color: "#0056b3", padding: "15px", borderRadius: "10px", fontWeight: "bold", marginBottom: "30px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Clock size={20} /> {getEstimatedTime(order.status)}
        </div>

        {/* 5-Stage Progress Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", marginBottom: "40px" }}>
          <div style={{ position: "absolute", top: "15px", left: "10%", right: "10%", height: "4px", background: "#eee", zIndex: 1 }}></div>
          <div style={{ 
            position: "absolute", top: "15px", left: "10%", 
            width: order.status === "Delivered" || order.status === "Out for Delivery" ? "80%" : order.status === "Ready" ? "60%" : order.status === "Preparing" ? "40%" : order.status === "Pending" ? "20%" : "0%", 
            height: "4px", background: "#d70f64", zIndex: 1, transition: "all 0.5s" 
          }}></div>

          {["Pending", "Preparing", "Ready", "Out for Delivery", "Delivered"].map((stage, idx) => {
            const isActive = ["Pending", "Preparing", "Ready", "Out for Delivery", "Delivered"].indexOf(order.status) >= idx;
            return (
              <div key={stage} style={{ zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: isActive ? "#d70f64" : "#eee", color: isActive ? "#fff" : "#aaa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {idx === 0 && <Clock size={18} />}
                  {idx === 1 && <Package size={18} />}
                  {idx === 2 && <CheckCircle size={18} />}
                  {idx === 3 && <Bike size={18} />}
                  {idx === 4 && <CheckCircle size={18} />}
                </div>
                <span style={{ fontSize: "10px", fontWeight: "bold", textAlign: "center", color: isActive ? "#d70f64" : "#888" }}>{stage}</span>
              </div>
            );
          })}
        </div>

        {/* Live Map */}
        {order.status === "Out for Delivery" && (
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>Live Rider Tracking 🗺️</h3>
            <LiveTrackingMap 
              riderLocation={order.riderLocation} 
              customerLocation={order.customerLocation} 
              restaurantLocation={restaurant?.location}
            />
          </div>
        )}

        {/* Cancel Button (Pending Only) */}
        {order.status === "Pending" && (
          <button onClick={handleCancel} style={{ width: "100%", background: "#ffe5e5", color: "#d63031", border: "none", padding: "15px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "30px" }}>
            <XCircle size={18} /> Cancel Order
          </button>
        )}

        {/* Golden Rider Rating Box */}
        {order.status === "Delivered" && !isRatingSubmitted && (
          <div style={{ background: "#fffbea", border: "1px solid #ffeaa7", padding: "20px", borderRadius: "12px", textAlign: "center", marginTop: "20px" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#d4a017" }}>Rate Your Rider 🛵</h3>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>How was your delivery experience?</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "15px" }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={32} fill={star <= riderRating ? "gold" : "none"} color={star <= riderRating ? "gold" : "#ccc"} style={{ cursor: "pointer" }} onClick={() => setRiderRating(star)} />
              ))}
            </div>
            <button onClick={handleRateRider} style={{ background: "#d4a017", color: "#fff", border: "none", padding: "10px 25px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>Submit Rating</button>
          </div>
        )}

      </div>

      {/* Live Chat Widget */}
      <LiveChat orderId={order.id} />
    </div>
  );
};

export default TrackOrder;