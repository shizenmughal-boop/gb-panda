import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AddressPicker from "../components/AddressPicker";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const AuthPage = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      
      if (isLogin) {
        const userCredential = await login(email, password);
        // Fetch the user's actual role from Firestore upon login
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        
        if (userDoc.exists()) {
          const actualRole = userDoc.data().role;
          
          if (actualRole === "admin") navigate("/admin-dashboard");
          else if (actualRole === "restaurant") navigate("/restaurant-dashboard");
          else if (actualRole === "rider") navigate("/rider-dashboard");
          else navigate("/");
          return; 
        }
      } else {
        const profileData = { name, phone: cuisine || phone, address, location };
        await signup(email, password, role, null, profileData);
        
        if (role === "restaurant") navigate("/restaurant-dashboard");
        else if (role === "rider") navigate("/rider-dashboard");
        else navigate("/");
      }
      
    } catch (err) {
      setError("Failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f7f7f7", padding: "20px" }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#fff", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", width: "100%", maxWidth: "500px" }}>
        
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
              </select>

              {role === "customer" && (
                <>
                  <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
                  <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
                  <input type="text" placeholder="Delivery Address" value={address} onChange={(e) => setAddress(e.target.value)} required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
                  <div>
                    <label style={{ fontSize: "14px", color: "#666", marginBottom: "5px", display: "block" }}>Pin your location:</label>
                    <AddressPicker position={location} setPosition={setLocation} />
                  </div>
                </>
              )}

              {role === "restaurant" && (
                <>
                  <input type="text" placeholder="Restaurant Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
                  <input type="text" placeholder="Cuisine (e.g., Fast Food)" value={cuisine} onChange={(e) => setCuisine(e.target.value)} required style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
                  <p style={{ fontSize: "12px", color: "#888" }}>Note: Your restaurant will be shown once approved by Admin.</p>
                </>
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