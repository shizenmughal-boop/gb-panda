import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const PortalModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null); // 'restaurant', 'admin', or 'rider'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (role === "restaurant" && username === "restaurant" && password === "123") {
      navigate("/restaurant-dashboard");
    } else if (role === "admin" && username === "admin" && password === "123") {
      navigate("/admin-dashboard");
    } else if (role === "rider" && username === "rider" && password === "123") {
      navigate("/rider-dashboard");
    } else {
      setError("Invalid credentials. Try again.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            style={{ background: "#fff", padding: "40px", borderRadius: "20px", width: "350px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
          >
            <button onClick={onClose} style={{ background: "none", border: "none", float: "right", cursor: "pointer", fontSize: "18px", marginTop: "-20px", marginRight: "-20px" }}>✖</button>
            
            {!role ? (
              <>
                <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Select Portal 🔐</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <button className="btn-primary" style={{ background: "#333" }} onClick={() => setRole("restaurant")}>Restaurant Login 🍳</button>
                  <button className="btn-primary" style={{ background: "#0056b3" }} onClick={() => setRole("admin")}>Admin Login ⚙️</button>
                  <button className="btn-primary" style={{ background: "#d70f64" }} onClick={() => setRole("rider")}>Rider Login 🛵</button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ textAlign: "center", marginBottom: "20px", textTransform: "capitalize" }}>{role} Login</h2>
                {error && <p style={{ color: "red", textAlign: "center", fontSize: "14px", marginBottom: "15px" }}>{error}</p>}
                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} />
                  
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ background: role === "admin" ? "#0056b3" : role === "rider" ? "#d70f64" : "#333" }}
                  >
                    Secure Login
                  </button>
                </form>
                <p style={{ textAlign: "center", fontSize: "12px", color: "#888", marginTop: "15px" }}>User: <b>{role}</b> | Pass: <b>123</b></p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PortalModal;