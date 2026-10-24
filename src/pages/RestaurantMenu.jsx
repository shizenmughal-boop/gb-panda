import { useParams, Link } from "react-router-dom";
import FoodCard from "../components/FoodCard";
import { restaurants, menuItems } from "../data/mockData";

const RestaurantMenu = () => {
  const { id } = useParams();
  const restaurant = restaurants.find((r) => r.id === Number(id));
  const items = menuItems.filter((i) => i.restaurantId === Number(id));

  if (!restaurant) return <p>Restaurant not found</p>;

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
      <h2>Menu</h2>
      <div className="food-grid">
        {items.map((item) => <FoodCard key={item.id} item={item} />)}
      </div>
      <Link to="/cart" className="view-cart-btn">View Cart 🛒</Link>
    </div>
  );
};
export default RestaurantMenu;