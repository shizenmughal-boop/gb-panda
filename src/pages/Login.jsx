import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AuthLogin from "../components/AuthLogin"; // Import our new component

const Login = () => {
  const navigate = useNavigate();
  // State to track if we should show the main menu or the login form
  const [view, setView] = useState("menu"); 

  const handleCustomerLogin = () => {
    localStorage.setItem("role", "customer");
    navigate("/customer");
  };

  const handleAuthSuccess = (role) => {
    localStorage.setItem("role", role);
    if (role === "restaurant") navigate("/restaurant-dashboard");
    if (role === "admin") navigate("/admin-dashboard");
  };

  // Render the Auth form if they clicked Restaurant or Admin
  if (view === "restaurant") {
    return <AuthLogin role="restaurant" onLoginSuccess={() => handleAuthSuccess("restaurant")} onBack={() => setView("menu")} />;
  }
  if (view === "admin") {
    return <AuthLogin role="admin" onLoginSuccess={() => handleAuthSuccess("admin")} onBack={() => setView("menu")} />;
  }

  // Otherwise, render the main menu
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f7f7f7" }}>
      <motion.div 
        initial={{ opacity: 0, y: 50, rotateX: -30 }} 
        animate={{ opacity: 1, y: 0, rotateX: 0 }} 
        transition={{ duration: 0.8 }}
        style={{ background: "#fff", padding: "40px", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", textAlign: "center" }}
      >
        <h1 style={{ fontSize: "32px", marginBottom: "10px", color: "#d70f64" }}>Welcome to GB Panda 🐼</h1>
        <p style={{ color: "#666", marginBottom: "30px" }}>Select your portal to continue</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <button className="btn-primary" onClick={handleCustomerLogin}>
            Enter as Customer 🛒
          </button>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              className="btn-primary" 
              style={{ background: "#333", flex: 1 }} 
              onClick={() => setView("restaurant")}
            >
              Restaurant Portal 🍳
            </button>
            <button 
              className="btn-primary" 
              style={{ background: "#0056b3", flex: 1 }} 
              onClick={() => setView("admin")}
            >
              Admin Panel ⚙️
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;