import { useParams, Link } from "react-router-dom";
import FoodCard from "../components/FoodCard";
import { useApp } from "../context/AppContext";

const RestaurantMenu = () => {
  const { id } = useParams(); 
  const { restaurants, menuItems } = useApp();
  
  // Match the string ID (like "rest_123456789")
  const restaurant = restaurants.find((r) => String(r.id) === String(id));
  const items = menuItems.filter((i) => String(i.restaurantId) === String(id));

  if (!restaurant) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Restaurant not found 😕</h2>
        <Link to="/" className="btn-primary" style={{ display: "inline-block", width: "auto", marginTop: "20px" }}>
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="menu-page">
      <div className="menu-header">
        <img src={restaurant.image} alt={restaurant.name} />
        <div>
          <h1>{restaurant.name}</h1>
          <p>{restaurant.cuisine}</p>
          <p>⭐ {restaurant.rating} | 🕒 {restaurant.deliveryTime}</p>
        </div>
      </div>
      
      <h2>Menu ({items.length} items)</h2>
      
      {items.length === 0 ? (
        <p style={{ color: "#666", marginTop: "20px" }}>This restaurant hasn't added any food yet.</p>
      ) : (
        <div className="food-grid">
          {items.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      )}
      
      <Link to="/cart" className="view-cart-btn" style={{ display: "inline-block", marginTop: "40px" }}>
        View Cart 🛒
      </Link>
    </div>
  );
};

export default RestaurantMenu;