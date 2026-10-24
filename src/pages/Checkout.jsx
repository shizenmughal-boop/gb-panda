import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const Checkout = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const { placeOrder } = useApp();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [payment, setPayment] = useState("cod");
  const [showToast, setShowToast] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Made this function ASYNC
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name || !form.phone || !form.address) {
      return alert("Please fill all fields");
    }
    if (cart.length === 0) {
      return alert("Your cart is empty");
    }

    const itemsSummary = cart.map(item => `${item.quantity}x ${item.name}`).join(", ");

    // WAIT for Firebase to save the order and return the ID
    const displayId = await placeOrder({
      customer: form.name,
      total: totalPrice + 50,
      items: itemsSummary,
    });

    setOrderId(displayId);
    setShowToast(true); 
    clearCart();

    // Redirect to the track page using the 4-digit ID
    setTimeout(() => {
      navigate(`/track/${displayId}`);
    }, 1500);
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <form onSubmit={handleSubmit} className="checkout-form">
        <h2>Delivery Details</h2>
        <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
        <input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
        <textarea placeholder="Complete Address" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
        
        <h2>Payment Method</h2>
        <div className="payment-options">
          <label><input type="radio" value="cod" checked={payment === "cod"} onChange={(e) => setPayment(e.target.value)} /> Cash on Delivery</label>
          <label><input type="radio" value="card" checked={payment === "card"} onChange={(e) => setPayment(e.target.value)} /> Credit/Debit Card</label>
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          {cart.map((item) => (
            <div key={item.id}>
              <span>{item.name} x {item.quantity}</span>
              <span>Rs {item.price * item.quantity}</span>
            </div>
          ))}
          <div className="total"><span>Total</span><span>Rs {totalPrice + 50}</span></div>
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