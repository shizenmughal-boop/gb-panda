import { useState } from "react";
import { motion } from "framer-motion";

const AuthLogin = ({ role, onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    // Simple hardcoded authentication for demo purposes
    if (role === "restaurant" && username === "restaurant" && password === "123") {
      onLoginSuccess();
    } else if (role === "admin" && username === "admin" && password === "123") {
      onLoginSuccess();
    } else {
      setError("Invalid credentials. Try again.");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f7f7f7" }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        style={{ background: "#fff", padding: "40px", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", width: "350px" }}
      >
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", marginBottom: "20px" }}>← Back</button>
        
        <h2 style={{ textAlign: "center", marginBottom: "20px", textTransform: "capitalize" }}>
          {role} Login 🔐
        </h2>

        {error && <p style={{ color: "red", textAlign: "center", fontSize: "14px", marginBottom: "15px" }}>{error}</p>}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
          />
          <button type="submit" className="btn-primary" style={{ background: role === "admin" ? "#0056b3" : "#333" }}>
            Secure Login
          </button>
        </form>

        <div style={{ marginTop: "20px", fontSize: "12px", color: "#888", textAlign: "center" }}>
          <p>Demo Credentials:</p>
          <p>User: <b>{role}</b> | Pass: <b>123</b></p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLogin;