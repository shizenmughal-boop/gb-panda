import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { Tag, MapPin, CheckCircle } from "lucide-react";

const Checkout = () => {
  const { cart, totalPrice, clearCart, restaurantId } = useCart(); 
  const { placeOrder } = useApp();
  const { userProfile } = useAuth(); 
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ 
    name: userProfile?.name || "", 
    phone: userProfile?.phone || "", 
    address: userProfile?.address || "" 
  });
  
  const [payment] = useState("COD"); // Locked to COD for now
  const [promoCode, setPromoCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [discount, setDiscount] = useState(0);
  
  const [showToast, setShowToast] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);

  // --- PROMO CODE LOGIC ---
  const applyPromo = () => {
    const code = promoCode.toUpperCase();
    
    if (code === "WELCOME50") {
      if (totalPrice < 300) {
        alert("Minimum order of Rs 300 required for WELCOME50.");
        return;
      }
      setDiscount(100);
      setAppliedCode(code);
      alert("Promo applied: Rs 100 off!");
    } else {
      setDiscount(0);
      setAppliedCode("");
      alert("Invalid Promo Code");
    }
  };

  const finalTotal = Math.max(0, totalPrice + 50 - discount);

  // --- SUBMIT ORDER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPlacing) return; 

    if (!form.name || !form.phone || !form.address) {
      return alert("Please fill all fields");
    }
    if (cart.length === 0) {
      return alert("Your cart is empty");
    }

    setIsPlacing(true);
    const itemsSummary = cart.map(item => `${item.quantity}x ${item.name}`).join(", ");

    try {
      const displayId = await placeOrder({
        customer: form.name,
        phone: form.phone,
        address: form.address,
        location: userProfile?.location || null, 
        total: finalTotal,
        items: itemsSummary,
        cartItems: cart, 
        restaurantId: restaurantId, 
        paymentMethod: "COD",
        promoCode: appliedCode,
        discountApplied: discount
      });

      setOrderId(displayId);
      setShowToast(true); 
      clearCart();

      setTimeout(() => {
        navigate(`/track/${displayId}`);
        setIsPlacing(false); 
      }, 1500);
    } catch (error) {
      console.error(error);
      alert("Failed to place order.");
      setIsPlacing(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <form onSubmit={handleSubmit} className="checkout-form">
        <h2>Delivery Details</h2>
        <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required disabled={isPlacing} />
        <input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required disabled={isPlacing} />
        <textarea placeholder="Complete Address" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} required disabled={isPlacing} />
        
        <h2>Payment Method</h2>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "15px", borderRadius: "8px", marginBottom: "20px", color: "#166534", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
          <CheckCircle size={20} /> Cash on Delivery
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          {cart.map((item) => (
            <div key={item.id}>
              <span>{item.name} x {item.quantity}</span>
              <span>Rs {item.price * item.quantity}</span>
            </div>
          ))}
          
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "14px", color: "#666" }}>
            <span>Delivery Fee</span>
            <span>Rs 50</span>
          </div>

          {/* PROMO CODE INPUT */}
          <div style={{ display: "flex", gap: "10px", marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Tag size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
              <input 
                placeholder="Promo Code (e.g. WELCOME50)" 
                value={promoCode} 
                onChange={(e) => setPromoCode(e.target.value)} 
                style={{ width: "100%", padding: "10px 10px 10px 35px", borderRadius: "5px", border: "1px solid #ccc" }} 
                disabled={isPlacing || appliedCode !== ""}
              />
            </div>
            <button type="button" onClick={applyPromo} disabled={isPlacing || appliedCode !== ""} style={{ padding: "8px 15px", background: appliedCode ? "#00b894" : "#333", color: "#fff", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: appliedCode ? "default" : "pointer" }}>
              {appliedCode ? "Applied" : "Apply"}
            </button>
          </div>

          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", color: "#d63031", fontWeight: "bold" }}>
              <span>Promo Discount</span>
              <span>- Rs {discount}</span>
            </div>
          )}

          <div className="total" style={{ marginTop: "15px" }}>
            <span>Total to Pay</span>
            <span>Rs {finalTotal}</span>
          </div>
        </div>
        
        <button type="submit" className="btn-primary" disabled={isPlacing} style={{ opacity: isPlacing ? 0.7 : 1, cursor: isPlacing ? "not-allowed" : "pointer" }}>
          {isPlacing ? "Placing Order... ⏳" : "Place Order (Cash on Delivery)"}
        </button>
      </form>

      <Toast 
        message={`Order #${orderId} placed successfully! 🎉`} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />
    </div>
  );
};

export default Checkout;