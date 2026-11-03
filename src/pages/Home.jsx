import { useNavigate } from "react-router-dom";
import Hero from "../components/Hero";
import CategoryCard from "../components/CategoryCard";
import RestaurantCard from "../components/RestaurantCard";
import { useApp } from "../context/AppContext";

const Home = () => {
  const { categories, restaurants } = useApp();
  const navigate = useNavigate();

  // ONLY SHOW APPROVED RESTAURANTS
  const approvedRestaurants = restaurants.filter(r => r.status === "approved" || !r.status);

  return (
    <div className="home">
      <Hero />
      <section className="section">
        <h2>What's on your mind? 🤔</h2>
        <div className="category-grid">
          {categories.map((cat) => (
            <div key={cat.id} onClick={() => navigate(`/restaurants?search=${cat.name}`)}>
              <CategoryCard category={cat} />
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <h2>Popular Restaurants 🔥</h2>
        {approvedRestaurants.length === 0 ? (
          <p style={{ color: "#666" }}>No restaurants available right now.</p>
        ) : (
          <div className="restaurant-grid">
            {approvedRestaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;