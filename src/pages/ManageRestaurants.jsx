import { useState } from "react";
import { useApp } from "../context/AppContext";
import { db } from "../firebase";
import { doc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Store, Ban, CheckCircle, Settings, Eye, X, 
  Clock, MapPin, Tag, AlertTriangle 
} from "lucide-react";

const ManageRestaurants = () => {
  const { restaurants, menuItems } = useApp();
  
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals & Drawers
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  
  // Config State
  const [configData, setConfigData] = useState({ commissionRate: 20, minOrder: 200, prepTime: 25, deliveryRadius: 5 });

  // Filtering Logic
  const filteredRestaurants = restaurants.filter(rest => {
    const matchesSearch = rest.name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "All") return matchesSearch;
    if (activeTab === "Approved") return matchesSearch && rest.status === "approved" && !rest.isBlocked;
    if (activeTab === "Pending") return matchesSearch && rest.status === "pending";
    if (activeTab === "Blocked") return matchesSearch && (rest.isBlocked || rest.status === "blocked");
    if (activeTab === "Busy/Closed") return matchesSearch && rest.isOpen === false;
    return matchesSearch;
  });

  // Actions
  const handleBlockToggle = async (rest) => {
    const isCurrentlyBlocked = rest.isBlocked || rest.status === "blocked";
    await updateDoc(doc(db, "restaurants", rest.id), {
      isBlocked: !isCurrentlyBlocked,
      status: !isCurrentlyBlocked ? "blocked" : "approved"
    });
    alert(`Restaurant ${isCurrentlyBlocked ? "unblocked" : "blocked"} successfully.`);
  };

  const handleOpenToggle = async (rest) => {
    const currentStatus = rest.isOpen !== false; 
    await updateDoc(doc(db, "restaurants", rest.id), { isOpen: !currentStatus });
  };

  const handleSaveConfig = async () => {
    if (!selectedRestaurant) return;
    await updateDoc(doc(db, "restaurants", selectedRestaurant.id), {
      commissionRate: Number(configData.commissionRate),
      minOrder: Number(configData.minOrder),
      prepTime: Number(configData.prepTime),
      deliveryRadius: Number(configData.deliveryRadius)
    });
    setIsConfigModalOpen(false);
    alert("Commercial settings saved.");
  };

  const openConfigModal = (rest) => {
    setSelectedRestaurant(rest);
    setConfigData({
      commissionRate: rest.commissionRate ?? 20,
      minOrder: rest.minOrder ?? 200,
      prepTime: rest.prepTime ?? 25,
      deliveryRadius: rest.deliveryRadius ?? 5
    });
    setIsConfigModalOpen(true);
  };

  const openMenuDrawer = (rest) => {
    setSelectedRestaurant(rest);
    setIsMenuDrawerOpen(true);
  };

  const restMenuItems = menuItems.filter(item => String(item.restaurantId) === String(selectedRestaurant?.id));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "#1a1a2e", margin: 0 }}>Manage Restaurants</h1>
        <div style={{ position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
          <input 
            type="text" 
            placeholder="Search restaurant..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "10px 10px 10px 40px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", width: "250px" }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
        {["All", "Approved", "Pending", "Blocked", "Busy/Closed"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "bold",
              background: activeTab === tab ? "#1a1a2e" : "transparent",
              color: activeTab === tab ? "#fff" : "#666"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Directory Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
        {filteredRestaurants.map(rest => {
          const isBlocked = rest.isBlocked || rest.status === "blocked";
          const isOpen = rest.isOpen !== false;

          return (
            <motion.div key={rest.id} whileHover={{ y: -5 }} style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderTop: `4px solid ${isBlocked ? '#d63031' : (rest.status === 'pending' ? '#fdcb6e' : '#00b894')}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px" }}>{rest.name}</h3>
                  <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "13px" }}>{rest.cuisine || "Uncategorized"}</p>
                </div>
                <span style={{ background: isBlocked ? "#ffe5e5" : (rest.status === 'pending' ? "#fff3cd" : "#e6fced"), color: isBlocked ? "#d63031" : (rest.status === 'pending' ? "#856404" : "green"), padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                  {isBlocked ? "Blocked" : rest.status || "Approved"}
                </span>
              </div>

              <div style={{ background: "#f9f9f9", padding: "10px", borderRadius: "8px", marginBottom: "15px", fontSize: "13px", color: "#555", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>Comm: <strong>{rest.commissionRate ?? 20}%</strong></div>
                <div>Prep: <strong>{rest.prepTime ?? 25} min</strong></div>
                <div>Min: <strong>Rs {rest.minOrder ?? 200}</strong></div>
                <div>Radius: <strong>{rest.deliveryRadius ?? 5} km</strong></div>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button onClick={() => openMenuDrawer(rest)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "8px", borderRadius: "8px", border: "none", background: "#e6f0fa", color: "#0056b3", fontWeight: "bold", cursor: "pointer" }}>
                  <Eye size={16} /> Menu
                </button>
                <button onClick={() => openConfigModal(rest)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "8px", borderRadius: "8px", border: "none", background: "#f0f0f0", color: "#333", fontWeight: "bold", cursor: "pointer" }}>
                  <Settings size={16} /> Config
                </button>
                <button onClick={() => handleBlockToggle(rest)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", padding: "8px", borderRadius: "8px", border: "none", background: isBlocked ? "#e6fced" : "#ffe5e5", color: isBlocked ? "green" : "#d63031", fontWeight: "bold", cursor: "pointer" }}>
                  {isBlocked ? <CheckCircle size={16} /> : <Ban size={16} />} {isBlocked ? "Unblock" : "Block"}
                </button>
                <button onClick={() => handleOpenToggle(rest)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: isOpen ? "#fff3cd" : "#f0f0f0", color: isOpen ? "#856404" : "#666", fontWeight: "bold", cursor: "pointer" }}>
                  {isOpen ? "Set Busy" : "Set Open"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CONFIG MODAL */}
      <AnimatePresence>
        {isConfigModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ background: "#fff", padding: "30px", borderRadius: "16px", width: "400px" }}>
              <h2 style={{ marginBottom: "20px" }}>Commercial Settings: {selectedRestaurant?.name}</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "20px" }}>
                <label>Platform Commission (%)</label>
                <input type="number" value={configData.commissionRate} onChange={e => setConfigData({...configData, commissionRate: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
                
                <label>Minimum Order Value (Rs)</label>
                <input type="number" value={configData.minOrder} onChange={e => setConfigData({...configData, minOrder: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
                
                <label>Average Prep Time (mins)</label>
                <input type="number" value={configData.prepTime} onChange={e => setConfigData({...configData, prepTime: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
                
                <label>Delivery Radius (km)</label>
                <input type="number" value={configData.deliveryRadius} onChange={e => setConfigData({...configData, deliveryRadius: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button onClick={() => setIsConfigModalOpen(false)} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#f0f0f0", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSaveConfig} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#0056b3", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>Save Settings</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MENU DRAWER */}
      <AnimatePresence>
        {isMenuDrawerOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "450px", background: "#fff", zIndex: 1000, boxShadow: "-10px 0 30px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0 }}>Menu: {selectedRestaurant?.name}</h2>
                <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>{restMenuItems.length} items total</p>
              </div>
              <button onClick={() => setIsMenuDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {restMenuItems.length === 0 ? <p>No items added yet.</p> : null}
              {restMenuItems.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "15px", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
                  <img src={item.image} alt={item.name} style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover" }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: "15px" }}>{item.name}</h4>
                    <p style={{ margin: "5px 0", color: "#d70f64", fontWeight: "bold", fontSize: "14px" }}>Rs {item.price}</p>
                    <span style={{ background: item.inStock !== false ? "#e6fced" : "#ffe5e5", color: item.inStock !== false ? "green" : "#d63031", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}>
                      {item.inStock !== false ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                  <button onClick={() => updateDoc(doc(db, "menuItems", item.id), { inStock: item.inStock === false })} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#f0f0f0", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                    Toggle Stock
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageRestaurants;