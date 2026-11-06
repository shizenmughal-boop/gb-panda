import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import RestaurantCard from "../components/RestaurantCard";
import CategoryCard from "../components/CategoryCard";
import { Filter, SlidersHorizontal } from "lucide-react";

const Restaurants = () => {
  const { restaurants, categories } = useApp();
  const location = useLocation();
  
  // Extract query params
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get("search") || "";
  const initialCategory = queryParams.get("category") || "";

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState("Recommended"); // Recommended, Top Rated, Fastest
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setSearchTerm(initialSearch);
    setSelectedCategory(initialCategory);
  }, [initialSearch, initialCategory]);

  // Filter Logic
  let filtered = restaurants.filter(r => r.status === "approved" && !r.isBlocked);

  if (searchTerm) {
    filtered = filtered.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (selectedCategory) {
    filtered = filtered.filter(r => r.category?.toLowerCase() === selectedCategory.toLowerCase());
  }

  if (filterOpen) {
    filtered = filtered.filter(r => r.isOpen !== false);
  }

  // Sort Logic
  if (sortBy === "Top Rated") {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortBy === "Fastest") {
    // Assuming prepTime is a string like "25-35 min", we sort by the first number
    filtered.sort((a, b) => parseInt(a.prepTime) - parseInt(b.prepTime));
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "20px", color: "#1a1a2e" }}>
        {searchTerm ? `Search results for "${searchTerm}"` : "All Restaurants"}
      </h1>

      {/* Filter Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setFilterOpen(!filterOpen)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "20px", border: filterOpen ? "2px solid #d70f64" : "1px solid #ddd", background: filterOpen ? "#ffe5ec" : "#fff", color: filterOpen ? "#d70f64" : "#333", fontWeight: "bold", cursor: "pointer" }}>
            <Filter size={16} /> Open Now
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <SlidersHorizontal size={18} color="#666" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", fontWeight: "bold" }}>
            <option>Recommended</option>
            <option>Top Rated</option>
            <option>Fastest</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px", background: "#fff", borderRadius: "12px" }}>
          <h2>😕 No restaurants found</h2>
          <p style={{ color: "#666" }}>Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" }}>
          {filtered.map(rest => <RestaurantCard key={rest.id} restaurant={rest} />)}
        </div>
      )}
    </div>
  );
};

export default Restaurants;