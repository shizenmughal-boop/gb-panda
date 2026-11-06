import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { MapPin, User, Phone, Tag, Wallet, CheckCircle } from "lucide-react";
import AddressPicker from "../components/AddressPicker";

const Checkout = () => {
  const { cartItems, restaurantId, restaurantName, deliveryFee, subtotal, discount, walletUsed, total, promoCode, applyPromoCode, setWalletUsed, clearCart } = useCart();
  const { currentUser, userData } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState(userData?.name || "");
  const [phone, setPhone] = useState(userData?.phone || "");
  const [address, setAddress] = useState(userData?.address || "");
  const [location, setLocation] = useState(userData?.location || null);
  
  // Promo & Wallet State
  const [promoInput, setPromoInput] = useState("");
  const [useWallet, setUseWallet] = useState(false);
  
  // Submission State
  const [isPlacing, setIsPlacing] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0 && !isPlacing) {
      navigate("/cart");
    }
  }, [cartItems.length, isPlacing, navigate]);

  // Handle Promo Code
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    const res = await applyPromoCode(promoInput);
    if (res.success) {
      showToast(res.message, "success");
      setPromoInput("");
    } else {
      showToast(res.message, "error");
    }
  };

  // Handle Wallet Toggle
  const handleWalletToggle = () => {
    const balance = userData?.walletBalance || 0;
    if (balance <= 0) return showToast("You have no wallet balance.", "error");
    
    if (!useWallet) {
      // Apply maximum possible wallet balance
      const maxWalletToUse = Math.min(balance, total);
      setWalletUsed(maxWalletToUse);
      setUseWallet(true);
    } else {
      setWalletUsed(0);
      setUseWallet(false);
    }
  };

  // Submit Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (isPlacing) return; // Prevent double click

    if (!name || !phone || !address || !location) {
      return showToast("Please fill all details and pin your location.", "error");
    }

    setIsPlacing(true);

    try {
      // 1. Create Order Document
      const orderData = {
        customerId: currentUser.uid,
        customerName: name,
        customerPhone: phone,
        deliveryAddress: address,
        customerLocation: location,
        restaurantId,
        restaurantName,
        restaurantLocation: null, // Assuming restaurant location is fetched or optional
        items: cartItems,
        subtotal,
        deliveryFee,
        discount,
        promoCode: promoCode ? promoCode.code : null,
        walletUsed,
        total: total,
        paymentMethod: "COD",
        status: "Pending",
        isRiderRated: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const orderRef = await addDoc(collection(db, "orders"), orderData);

      // 2. Deduct Wallet Balance (if used)
      if (walletUsed > 0) {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          walletBalance: (userData.walletBalance || 0) - walletUsed
        });
      }

      // 3. Clear Cart & Redirect
      clearCart();
      showToast("Order placed successfully! 🎉", "success");
      navigate(`/track/${orderRef.id}`);

    } catch (error) {
      console.error("Order Error:", error);
      showToast("Failed to place order. Please try again.", "error");
      setIsPlacing(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "30px 20px" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "20px", color: "#1a1a2e" }}>Checkout</h1>

      <form onSubmit={handlePlaceOrder} style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "30px" }}>
        
        {/* Left Column: Details & Map */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>Delivery Details</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f5f5f5", padding: "12px", borderRadius: "8px" }}>
                <User size={20} color="#666" />
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ border: "none", background: "transparent", outline: "none", width: "100%" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f5f5f5", padding: "12px", borderRadius: "8px" }}>
                <Phone size={20} color="#666" />
                <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ border: "none", background: "transparent", outline: "none", width: "100%" }} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "#f5f5f5", padding: "12px", borderRadius: "8px" }}>
                <MapPin size={20} color="#666" style={{ marginTop: "2px" }} />
                <textarea placeholder="Complete Address" value={address} onChange={(e) => setAddress(e.target.value)} required style={{ border: "none", background: "transparent", outline: "none", width: "100%", minHeight: "60px", resize: "vertical" }} />
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>Pin Your Exact Location</h3>
            <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#666" }}>Drag the map or click to set your exact house location for the rider.</p>
            <AddressPicker position={location} setPosition={setLocation} />
          </div>

        </div>

        {/* Right Column: Summary & Payment */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>Order Summary</h3>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px", color: "#555" }}>
              <span>Subtotal</span>
              <span>Rs {subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px", color: "#555" }}>
              <span>Delivery Fee</span>
              <span>Rs {deliveryFee}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px", color: "#00b894", fontWeight: "bold" }}>
                <span>Promo Discount</span>
                <span>- Rs {discount}</span>
              </div>
            )}
            {walletUsed > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "14px", color: "#00b894", fontWeight: "bold" }}>
                <span>Wallet Applied</span>
                <span>- Rs {walletUsed}</span>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #eee", fontWeight: "bold", fontSize: "18px" }}>
              <span>Total to Pay</span>
              <span style={{ color: "#d70f64" }}>Rs {total}</span>
            </div>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>Apply Promo Code</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <input type="text" placeholder="e.g. WELCOME50" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd", outline: "none" }} />
              <button type="button" onClick={handleApplyPromo} style={{ background: "#1a1a2e", color: "#fff", border: "none", padding: "0 15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Apply</button>
            </div>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px" }}>Payment Method</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#e6fced", padding: "15px", borderRadius: "8px", border: "1px solid #b8e9c8" }}>
              <CheckCircle color="#00b894" size={20} />
              <span style={{ fontWeight: "bold", color: "#00b894" }}>Cash on Delivery (COD)</span>
            </div>
            
            {(userData?.walletBalance || 0) > 0 && (
              <div style={{ marginTop: "15px", display: "flex", alignItems: "center", gap: "10px", background: "#f5f5f5", padding: "15px", borderRadius: "8px", cursor: "pointer" }} onClick={handleWalletToggle}>
                <input type="checkbox" checked={useWallet} readOnly />
                <Wallet size={20} color="#666" />
                <div>
                  <p style={{ margin: 0, fontWeight: "bold" }}>Use PandaPay Wallet</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Balance: Rs {userData.walletBalance}</p>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isPlacing}
            style={{ 
              background: isPlacing ? "#ccc" : "#d70f64", 
              color: "#fff", border: "none", padding: "18px", 
              borderRadius: "12px", fontSize: "18px", fontWeight: "bold", 
              cursor: isPlacing ? "not-allowed" : "pointer",
              display: "flex", justifyContent: "center", alignItems: "center", gap: "10px"
            }}
          >
            {isPlacing ? "Processing Order..." : `Place Order • Rs ${total}`}
          </button>

        </div>

      </form>
    </div>
  );
};

export default Checkout;