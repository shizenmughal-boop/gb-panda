import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext"; // Import to get the list of restaurants
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const AuthPage = () => {
  const { login, signup } = useAuth();
  const { restaurants } = useApp(); // Get all restaurants
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      
      if (isLogin) {
        await login(email, password);
      } else {
        // If Restaurant Owner, ensure they selected a restaurant
        if (role === "restaurant" && !selectedRestaurant) {
          throw new Error("Please select a restaurant.");
        }
        await signup(email, password, role, selectedRestaurant);
      }
      
      if (role === "admin") navigate("/admin-dashboard");
      else if (role === "restaurant") navigate("/restaurant-dashboard");
      else if (role === "rider") navigate("/rider-dashboard");
      else navigate("/");
      
    } catch (err) {
      setError("Failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f7f7f7" }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#fff", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", width: "400px" }}>
        
        <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#d70f64" }}>
          {isLogin ? "Log In to GB Panda" : "Create an Account"}
        </h2>

        {error && <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
          
          {!isLogin && (
            <>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}>
                <option value="customer">I am a Customer</option>
                <option value="restaurant">I am a Restaurant Owner</option>
                <option value="rider">I am a Rider</option>
                <option value="admin">I am an Admin</option>
              </select>

              {/* Show Restaurant Dropdown if they choose "Restaurant Owner" */}
              {role === "restaurant" && (
                <select 
                  value={selectedRestaurant} 
                  onChange={(e) => setSelectedRestaurant(e.target.value)} 
                  style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }}
                  required
                >
                  <option value="">Select Your Restaurant...</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}
            </>
          )}

          <button disabled={loading} type="submit" className="btn-primary" style={{ marginTop: "10px" }}>
            {loading ? "Processing..." : (isLogin ? "Log In" : "Sign Up")}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", cursor: "pointer", color: "#0056b3" }} onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;