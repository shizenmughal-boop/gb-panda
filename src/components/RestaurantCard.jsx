import { Link } from "react-router-dom";
import { Star, Clock, Bike } from "lucide-react";
import { motion } from "framer-motion";

const RestaurantCard = ({ restaurant }) => {
  return (
    <Link to={`/restaurant/${restaurant.id}`} style={{ textDecoration: "none" }}>
      <motion.div
        className="restaurant-card"
        whileHover={{ 
          y: -10, 
          scale: 1.02, 
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)" 
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ cursor: "pointer" }}
      >
        <div style={{ overflow: "hidden" }}>
          <motion.img 
            src={restaurant.image} 
            alt={restaurant.name} 
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="restaurant-info">
          <h3>{restaurant.name}</h3>
          <p className="cuisine">{restaurant.cuisine}</p>
          <div className="restaurant-meta">
            <span>
              <Star size={14} fill="gold" color="gold" /> {restaurant.rating}
            </span>
            <span>
              <Clock size={14} /> {restaurant.deliveryTime}
            </span>
            <span>
              <Bike size={14} /> Rs {restaurant.deliveryFee}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default RestaurantCard;