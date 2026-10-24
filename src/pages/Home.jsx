import Hero from "../components/Hero";
import CategoryCard from "../components/CategoryCard";
import RestaurantCard from "../components/RestaurantCard";
import { categories, restaurants } from "../data/mockData";

const Home = () => (
  <div className="home">
    <Hero />
    <section className="section">
      <h2>What's on your mind? 🤔</h2>
      <div className="category-grid">
        {categories.map((cat) => <CategoryCard key={cat.id} category={cat} />)}
      </div>
    </section>
    <section className="section">
      <h2>Popular Restaurants 🔥</h2>
      <div className="restaurant-grid">
        {restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
      </div>
    </section>
  </div>
);
export default Home;