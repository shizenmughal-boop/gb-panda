import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus } from "lucide-react";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const navigate = useNavigate(); // Add navigation hook

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty 🛒</h2>
        <Link to="/restaurants" className="btn-primary" style={{ display: "inline-block", width: "auto", textDecoration: "none" }}>
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Your Cart ({totalItems} items)</h1>
      <div className="cart-items">
        {cart.map((item) => (
          <div key={item.id} className="cart-item">
            <img src={item.image} alt={item.name} />
            <div className="cart-item-info">
              <h4>{item.name}</h4>
              <p>Rs {item.price}</p>
            </div>
            <div className="quantity-controls">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={16} /></button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={16} /></button>
            </div>
            <p className="item-total">Rs {item.price * item.quantity}</p>
            <button onClick={() => removeFromCart(item.id)} className="delete-btn"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
      
      <div className="cart-summary">
        <div><span>Subtotal</span><span>Rs {totalPrice}</span></div>
        <div><span>Delivery Fee</span><span>Rs 50</span></div>
        <div className="total"><span>Total</span><span>Rs {totalPrice + 50}</span></div>
        
        {/* We changed this to a BUTTON with an onClick event */}
        <button 
          onClick={() => navigate("/checkout")} 
          className="btn-primary" 
          style={{ display: "block", width: "100%", marginTop: "20px", border: "none" }}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;