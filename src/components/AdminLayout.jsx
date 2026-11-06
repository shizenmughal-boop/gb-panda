import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { 
  LayoutDashboard, Store, ShoppingBag, Bike, Users, Tag, 
  TrendingUp, LifeBuoy, LogOut, Search, Bell, Menu, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AdminLayout = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { orders, restaurants } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const pendingApprovals = restaurants?.filter(r => r.status === "pending").length || 0;
  const activeOrdersCount = orders?.filter(o => o.status !== "Delivered" && o.status !== "Cancelled").length || 0;

  const menuItems = [
    { name: "Command Center", path: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Restaurants", path: "/admin/manage-restaurants", icon: <Store size={20} /> },
    { name: "Live Orders", path: "/admin/orders", icon: <ShoppingBag size={20} />, badge: activeOrdersCount },
    { name: "Rider Fleet", path: "/admin/riders", icon: <Bike size={20} /> },
    { name: "User CRM", path: "/admin/users", icon: <Users size={20} /> },
    { name: "Promotions", path: "/admin/promotions", icon: <Tag size={20} /> },
    { name: "Revenue & Finance", path: "/admin/revenue", icon: <TrendingUp size={20} /> },
    { name: "Support & Disputes", path: "/admin/support", icon: <LifeBuoy size={20} /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f4f7f6", overflow: "hidden" }}>
      
      {/* SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }} 
            animate={{ width: 260, opacity: 1 }} 
            exit={{ width: 0, opacity: 0 }}
            style={{ background: "#1a1a2e", color: "#fff", display: "flex", flexDirection: "column", zIndex: 100, whiteSpace: "nowrap" }}
          >
            <div style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <Link to="/admin/dashboard" style={{ fontSize: "22px", fontWeight: "bold", color: "#d70f64", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                🐼 GB Panda
              </Link>
              <button onClick={() => setIsSidebarOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 10px" }}>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.name} 
                    to={item.path}
                    style={{ 
                      display: "flex", alignItems: "center", justifyContent: "space-between", 
                      padding: "12px 15px", marginBottom: "5px", borderRadius: "8px",
                      color: isActive ? "#fff" : "#a0a0b0",
                      background: isActive ? "#d70f64" : "transparent",
                      textDecoration: "none", fontWeight: "600", transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {item.icon} {item.name}
                    </div>
                    {item.badge > 0 && (
                      <span style={{ background: "#ff4757", color: "#fff", fontSize: "11px", padding: "2px 8px", borderRadius: "20px" }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#d70f64", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {currentUser?.email}
                </div>
              </div>
              <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                <LogOut size={18} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ background: "#fff", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", zIndex: 90 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#333" }}><Menu size={24} /></button>
            )}
            <div style={{ position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
              <input type="text" placeholder="Global live search..." style={{ padding: "10px 10px 10px 40px", borderRadius: "20px", border: "1px solid #eee", background: "#f9f9f9", outline: "none", width: "300px" }} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ position: "relative", cursor: "pointer" }}>
              <Bell size={22} color="#555" />
              {pendingApprovals > 0 && (
                <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ff4757", color: "#fff", fontSize: "10px", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  {pendingApprovals}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "bold", color: "#333" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#00b894" }}></span> System Online
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: "30px" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;