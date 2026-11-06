import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Cart = () => {
  const { cartItems, restaurantName, restaurantLocation, deliveryFee, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "20px" }}>
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ background: "#f9f9f9", padding: "40px", borderRadius: "50%", marginBottom: "20px" }}>
          <ShoppingBag size={60} color="#ccc" />
        </motion.div>
        <h2 style={{ fontSize: "24px", color: "#1a1a2e", marginBottom: "10px" }}>Your cart is empty</h2>
        <p style={{ color: "#666", marginBottom: "30px" }}>Looks like you haven't added anything yet.</p>
        <Link to="/restaurants" style={{ background: "#d70f64", color: "#fff", padding: "15px 30px", borderRadius: "30px", textDecoration: "none", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" }}>
          Browse Restaurants <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "30px 20px" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "20px", color: "#1a1a2e" }}>Your Cart</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
        
        {/* Restaurant Info */}
        <div style={{ background: "#fff", padding: "15px 20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, color: "#d70f64" }}>{restaurantName}</h3>
          <button onClick={clearCart} style={{ background: "none", border: "none", color: "#d63031", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>Clear Cart</button>
        </div>

        {/* Cart Items List */}
        <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <AnimatePresence>
            {cartItems.map(item => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                style={{ display: "flex", alignItems: "center", padding: "20px", borderBottom: "1px solid #eee" }}
              >
                <img src={item.imageUrl} alt={item.name} style={{ width: "70px", height: "70px", borderRadius: "8px", objectFit: "cover", marginRight: "15px" }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>{item.name}</h4>
                  <p style={{ margin: 0, color: "#d70f64", fontWeight: "bold" }}>Rs {item.price}</p>
                  {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                    <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#888" }}>
                      + {item.selectedAddOns.map(a => a.name).join(", ")}
                    </p>
                  )}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: "20px", padding: "5px" }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><Minus size={16} /></button>
                    <span style={{ margin: "0 15px", fontWeight: "bold" }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}><Plus size={16} /></button>
                  </div>
                  <span style={{ fontWeight: "bold", width: "70px", textAlign: "right" }}>Rs {item.price * item.quantity}</span>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: "#d63031", cursor: "pointer" }}><Trash2 size={20} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bill Summary */}
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Bill Details</h3>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#555" }}>
            <span>Item Subtotal</span>
            <span>Rs {subtotal}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#555" }}>
            <span>Delivery Fee</span>
            <span>Rs {deliveryFee}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #eee", fontWeight: "bold", fontSize: "18px" }}>
            <span>Total</span>
            <span style={{ color: "#d70f64" }}>Rs {subtotal + deliveryFee}</span>
          </div>

          <button 
            onClick={() => navigate("/checkout")}
            style={{ width: "100%", background: "#d70f64", color: "#fff", border: "none", padding: "15px", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", marginTop: "20px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Cart;