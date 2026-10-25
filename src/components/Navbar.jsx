import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, MapPin, Search, LogOut, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { totalItems } = useCart();
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim()) navigate(`/restaurants?search=${value}`);
    else navigate(`/restaurants`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Helper to get dashboard link based on role
  const getDashboardLink = () => {
    if (role === "admin") return "/admin-dashboard";
    if (role === "restaurant") return "/restaurant-dashboard";
    if (role === "rider") return "/rider-dashboard";
    return null;
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo" onClick={() => setSearchTerm("")}>🐼 <span>GB Panda</span></Link>
      
      <div className="nav-location">
        <MapPin size={18} />
        <span>Gulberg, Lahore</span>
      </div>

      <div className="nav-search">
        <Search size={18} />
        <input 
          placeholder="Search restaurants..." 
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="nav-links">
        <Link to="/restaurants">Restaurants</Link>
        
        {currentUser ? (
          <>
            <Link to="/my-orders" style={{ fontWeight: "600", color: "#333" }}>My Orders</Link>
            
            {/* Dashboard Link (Only if not a customer) */}
            {role !== "customer" && (
              <Link to={getDashboardLink()} style={{ fontWeight: "bold", color: "#0056b3" }}>
                {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
              </Link>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "10px", paddingLeft: "20px", borderLeft: "1px solid #ddd" }}>
              <span style={{ fontSize: "14px", color: "#666", display: "flex", alignItems: "center", gap: "5px" }}>
                <User size={16} /> {currentUser.email.split("@")[0]}
              </span>
              <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "red", display: "flex", alignItems: "center", gap: "5px", fontWeight: "bold" }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </>
        ) : (
          <Link to="/auth" className="btn-primary" style={{ padding: "8px 20px", width: "auto", marginTop: 0, borderRadius: "20px" }}>
            Login / Sign Up
          </Link>
        )}

        <Link to="/cart" className="cart-btn">
          <ShoppingCart size={20} />
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;