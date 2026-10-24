import { useState } from "react";
import { Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import Toast from "./Toast";

const FoodCard = ({ item }) => {
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);

  const handleAdd = () => {
    addToCart(item);
    setShowToast(true);
    // Hide the toast after 3 seconds
    setTimeout(() => setShowToast(false), 3000); 
  };

  return (
    <>
      <div className="food-card">
        <img src={item.image} alt={item.name} />
        <div className="food-info">
          <h4>{item.name}</h4>
          <p className="food-price">Rs {item.price}</p>
          <button className="add-btn" onClick={handleAdd}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
      
      {/* The Animated Toast */}
      <Toast 
        message={`${item.name} added to cart!`} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />
    </>
  );
};
export default FoodCard;