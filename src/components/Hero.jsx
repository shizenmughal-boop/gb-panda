import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

const Hero = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/restaurants?search=${search}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ 
        background: "linear-gradient(135deg, #d70f64, #b50c52)", 
        color: "#fff", padding: "60px 30px", borderRadius: "20px", 
        marginBottom: "40px", display: "flex", flexDirection: "column", 
        alignItems: "center", textAlign: "center" 
      }}
    >
      <h1 style={{ fontSize: "48px", fontWeight: "900", margin: "0 0 15px 0", lineHeight: "1.1" }}>
        Hungry? 🐼
      </h1>
      <p style={{ fontSize: "20px", margin: "0 0 30px 0", opacity: 0.9 }}>
        Get your favorite meals delivered in minutes.
      </p>
      
      <form onSubmit={handleSearch} style={{ display: "flex", width: "100%", maxWidth: "600px", background: "#fff", padding: "8px", borderRadius: "50px" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", paddingLeft: "15px" }}>
          <Search color="#999" size={22} />
          <input 
            type="text" 
            placeholder="Search for restaurants or cuisines..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "15px", border: "none", outline: "none", fontSize: "16px", color: "#333", background: "transparent" }}
          />
        </div>
        <button type="submit" style={{ background: "#1a1a2e", color: "#fff", border: "none", padding: "15px 35px", borderRadius: "50px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
          Find Food
        </button>
      </form>
    </motion.div>
  );
};

export default Hero;