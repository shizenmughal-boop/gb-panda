import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, MapPin, ShoppingCart, User, Heart, LogOut } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { cartItems } = useCart();
  const { currentUser, userData, logout } = useAuth();
  const { restaurants } = useApp();
  
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const suggestions = restaurants
    .filter(r => 
      r.status === "approved" && 
      r.isBlocked !== true && 
      (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       r.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/restaurants?search=${searchTerm}`);
      setShowDropdown(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <nav style={{ background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 30px", maxWidth: "1400px", margin: "0 auto", gap: "20px" }}>
        
        {/* Logo */}
        <Link to="/" style={{ fontSize: "24px", fontWeight: "900", color: "#d70f64", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          🐼 GB Panda
        </Link>

        {/* Location */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#666", fontSize: "14px", cursor: "pointer" }}>
          <MapPin size={18} color="#d70f64" />
          <span>{userData?.address ? userData.address.split(',')[0] : "Select Location"}</span>
        </div>

        {/* Search Bar */}
        <div ref={dropdownRef} style={{ position: "relative", flex: 1, maxWidth: "500px" }}>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", background: "#f5f5f5", padding: "10px 15px", borderRadius: "30px" }}>
            <Search size={20} color="#999" />
            <input
              type="text"
              placeholder="Search for restaurants or cuisines..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(e.target.value.length > 0);
              }}
              onFocus={() => setShowDropdown(searchTerm.length > 0)}
              style={{ border: "none", background: "transparent", outline: "none", width: "100%", marginLeft: "10px", fontSize: "14px" }}
            />
          </form>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ position: "absolute", top: "110%", left: 0, right: 0, background: "#fff", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", overflow: "hidden", zIndex: 100 }}
              >
                {suggestions.length === 0 ? (
                  <div style={{ padding: "15px", color: "#666", textAlign: "center" }}>No results found</div>
                ) : (
                  suggestions.map(rest => (
                    <Link
                      key={rest.id}
                      to={`/restaurant/${rest.id}`}
                      onClick={() => { setSearchTerm(""); setShowDropdown(false); }}
                      style={{ display: "flex", alignItems: "center", gap: "15px", padding: "12px 15px", borderBottom: "1px solid #eee", textDecoration: "none", color: "#333" }}
                    >
                      <img src={rest.imageUrl} alt={rest.name} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: "14px" }}>{rest.name}</h4>
                        <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>{rest.category}</p>
                      </div>
                    </Link>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
          <Link to="/favorites" style={{ color: "#333", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px", fontWeight: "600" }}>
            <Heart size={20} /> Favorites
          </Link>
          
          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <Link to="/profile" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#333", fontWeight: "600" }}>
                <div style={{ background: "#f0f0f0", padding: "8px", borderRadius: "50%" }}>
                  <User size={18} />
                </div>
                {userData?.name?.split(" ")[0] || "Profile"}
              </Link>
              <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#d63031", display: "flex", alignItems: "center", gap: "5px", fontWeight: "bold", cursor: "pointer" }}>
                <LogOut size={18} /> Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" style={{ color: "#d70f64", fontWeight: "bold", textDecoration: "none" }}>Log In</Link>
          )}

          <Link to="/cart" style={{ position: "relative", color: "#d70f64" }}>
            <ShoppingCart size={24} />
            {totalItems > 0 && (
              <span style={{ position: "absolute", top: "-8px", right: "-10px", background: "#d70f64", color: "#fff", fontSize: "12px", fontWeight: "bold", width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;