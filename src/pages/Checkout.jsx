import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext"; // <-- Imported Auth
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const Checkout = () => {
  const { cart, totalPrice, clearCart, restaurantId } = useCart(); 
  const { placeOrder } = useApp();
  const { profile } = useAuth(); // <-- Get the user's profile
  const navigate = useNavigate();
  
  // Pre-fill the form with the user's saved profile data
  const [form, setForm] = useState({ 
    name: profile?.name || "", 
    phone: profile?.phone || "", 
    address: profile?.address || "" 
  });
  
  const [payment, setPayment] = useState("cod");
  const [showToast, setShowToast] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.phone || !form.address) {
      return alert("Please fill all fields");
    }
    if (cart.length === 0) {
      return alert("Your cart is empty");
    }

    const itemsSummary = cart.map(item => `${item.quantity}x ${item.name}`).join(", ");

    // Include the restaurantId so it routes to the correct dashboard
    const displayId = await placeOrder({
      customer: form.name,
      phone: form.phone,
      address: form.address,
      location: profile?.location, // Save the pinned map location from sign-up
      total: totalPrice + 50,
      items: itemsSummary,
      restaurantId: restaurantId, 
      paymentMethod: payment,
    });

    setOrderId(displayId);
    setShowToast(true); 
    clearCart();

    setTimeout(() => {
      navigate(`/track/${displayId}`);
    }, 1500);
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <form onSubmit={handleSubmit} className="checkout-form">
        <h2>Delivery Details</h2>
        
        {/* These inputs will now automatically contain the user's saved data */}
        <input 
          placeholder="Full Name" 
          value={form.name} 
          onChange={(e) => setForm({...form, name: e.target.value})} 
          required
        />
        <input 
          placeholder="Phone Number" 
          value={form.phone} 
          onChange={(e) => setForm({...form, phone: e.target.value})} 
          required
        />
        <textarea 
          placeholder="Complete Address" 
          value={form.address} 
          onChange={(e) => setForm({...form, address: e.target.value})} 
          required
        />
        
        <h2>Payment Method</h2>
        <div className="payment-options">
          <label>
            <input 
              type="radio" 
              value="cod" 
              checked={payment === "cod"} 
              onChange={(e) => setPayment(e.target.value)} 
            /> Cash on Delivery
          </label>
          <label>
            <input 
              type="radio" 
              value="card" 
              checked={payment === "card"} 
              onChange={(e) => setPayment(e.target.value)} 
            /> Credit/Debit Card
          </label>
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          {cart.map((item) => (
            <div key={item.id}>
              <span>{item.name} x {item.quantity}</span>
              <span>Rs {item.price * item.quantity}</span>
            </div>
          ))}
          <div className="total">
            <span>Total</span>
            <span>Rs {totalPrice + 50}</span>
          </div>
        </div>
        
        <button type="submit" className="btn-primary">Place Order</button>
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