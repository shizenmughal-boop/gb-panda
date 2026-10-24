import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, MapPin, Search, Store, ShieldCheck, Bike } from "lucide-react";
import { useCart } from "../context/CartContext";
import PortalModal from "./PortalModal";

const Navbar = () => {
  const { totalItems } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim()) {
      navigate(`/restaurants?search=${value}`);
    } else {
      navigate(`/restaurants`);
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo" onClick={() => setSearchTerm("")}>🐼 <span>GB Panda</span></Link>
        
        <div className="nav-location">
          <MapPin size={18} />
          <span>Gulberg, Lahore</span>
        </div>

        <div className="nav-search">
          <Search size={18} />
          <input 
            placeholder="Search restaurants or cuisines..." 
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="nav-links">
          <Link to="/restaurants">Restaurants</Link>
          <Link to="/my-orders" style={{ fontWeight: "600", color: "#333", display: "flex", alignItems: "center", gap: "4px" }}>
            My Orders
          </Link>

          <button onClick={() => setIsModalOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", color: "#666", fontWeight: "600" }}>
            <Store size={16} /> Restaurant
          </button>
          
          <button onClick={() => setIsModalOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", color: "#666", fontWeight: "600" }}>
            <ShieldCheck size={16} /> Admin
          </button>
          
          <button onClick={() => setIsModalOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", color: "#666", fontWeight: "600" }}>
            <Bike size={16} /> Rider
          </button>

          <Link to="/cart" className="cart-btn">
            <ShoppingCart size={20} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
        </div>
      </nav>

      <PortalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Navbar;