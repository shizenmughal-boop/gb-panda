import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "../context/ToastContext";
import { Mail, Lock, User, Phone, ArrowRight, Store, MapPin, Bike } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthPage = () => {
  const { login, currentUser, userProfile, loading: authLoading, getHomeRouteForRole } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState("customer");
  
  // Restaurant Fields
  const [restName, setRestName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [address, setAddress] = useState("");

  // Rider Fields
  const [vehicleType, setVehicleType] = useState("Bike");
  const [licenseNumber, setLicenseNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // THE FIX: Listen to userProfile.role instead of role
  useEffect(() => {
    if (!authLoading && currentUser && userProfile?.role) {
      // Uses the master routing helper from AuthContext
      navigate(getHomeRouteForRole(userProfile.role), { replace: true });
    }
  }, [currentUser, userProfile, authLoading, navigate, getHomeRouteForRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        showToast("Welcome back!", "success");
      } else {
        // --- SIGNUP LOGIC ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        let finalRole = selectedRole;
        let profileData = {
          uid: user.uid,
          name: ownerName,
          email: email,
          phone: phone || "",
          role: finalRole,
          createdAt: new Date()
        };

        let restaurantId = null;

        if (finalRole === "restaurant") {
          if (!restName || !cuisine || !address) throw new Error("Please fill all restaurant details.");
          restaurantId = `rest_${user.uid}`;
          await setDoc(doc(db, "restaurants", restaurantId), {
            id: restaurantId,
            ownerId: user.uid,
            name: restName,
            cuisine: cuisine,
            address: address,
            phone: phone || "",
            status: "pending",
            isBlocked: false,
            isOpen: true,
            commissionRate: 20,
            rating: 5.0,
            reviewCount: 0,
            createdAt: new Date()
          });
          profileData.restaurantId = restaurantId;
        } else if (finalRole === "rider") {
          if (!licenseNumber) throw new Error("Please enter your license number.");
          profileData = {
            ...profileData,
            riderStatus: "offline",
            isApproved: false,
            isBanned: false,
            vehicleType: vehicleType,
            licenseNumber: licenseNumber,
            walletBalance: 0,
            codBalance: 0,
            codLimit: 5000,
            completedDeliveries: 0,
            ratingSum: 0,
            ratingCount: 0,
            averageRating: 5.0
          };
        } else {
          profileData = {
            ...profileData,
            isBanned: false,
            walletBalance: 0,
            favoriteRestaurants: [],
            address: "",
            location: null
          };
        }

        await setDoc(doc(db, "users", user.uid), profileData);
        showToast("Account created successfully!", "success");
      }
    } catch (err) {
      setError(err.message.replace("Firebase:", ""));
      showToast("Authentication failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (currentUser && !userProfile?.role)) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "20px" }}>Loading Portal...</div>;
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8f9fa", padding: "20px" }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#fff", padding: "40px", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)", width: "100%", maxWidth: "500px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "32px", color: "#d70f64", margin: "0 0 10px 0", fontWeight: "900" }}>🐼 GB Panda</h1>
          <p style={{ color: "#666", margin: 0 }}>{isLogin ? "Log in to your portal." : "Create a new account."}</p>
        </div>

        {error && <div style={{ background: "#ffe5e5", color: "#d63031", padding: "10px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: "bold", textAlign: "center" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          {!isLogin && (
            <>
              <div style={{ position: "relative" }}>
                <User size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                <input type="text" placeholder="Full Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required style={{ width: "100%", padding: "14px 14px 14px 45px", borderRadius: "10px", border: "1px solid #ddd", background: "#fafafa" }} />
              </div>
              <div style={{ position: "relative" }}>
                <Phone size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ width: "100%", padding: "14px 14px 14px 45px", borderRadius: "10px", border: "1px solid #ddd", background: "#fafafa" }} />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#666", marginBottom: "5px", display: "block" }}>Register as:</label>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #ddd", background: "#fafafa", fontWeight: "bold" }}>
                  <option value="customer">Customer</option>
                  <option value="restaurant">Restaurant Owner</option>
                  <option value="rider">Delivery Rider</option>
                </select>
              </div>

              {/* Restaurant Specific Fields */}
              {selectedRole === "restaurant" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ display: "flex", flexDirection: "column", gap: "15px", overflow: "hidden" }}>
                  <div style={{ position: "relative" }}>
                    <Store size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                    <input type="text" placeholder="Restaurant Name" value={restName} onChange={(e) => setRestName(e.target.value)} required style={{ width: "100%", padding: "14px 14px 14px 45px", borderRadius: "10px", border: "1px solid #ddd", background: "#fafafa" }} />
                  </div>
                  <input type="text" placeholder="Cuisine Category (e.g. Fast Food)" value={cuisine} onChange={(e) => setCuisine(e.target.value)} required style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #ddd", background: "#fafafa" }} />
                  <div style={{ position: "relative" }}>
                    <MapPin size={18} style={{ position: "absolute", left: "15px", top: "15px", color: "#999" }} />
                    <textarea placeholder="Restaurant Address" value={address} onChange={(e) => setAddress(e.target.value)} required style={{ width: "100%", padding: "14px 14px 14px 45px", borderRadius: "10px", border: "1px solid #ddd", background: "#fafafa", minHeight: "60px" }} />
                  </div>
                </motion.div>
              )}

              {/* Rider Specific Fields */}
              {selectedRole === "rider" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ display: "flex", flexDirection: "column", gap: "15px", overflow: "hidden" }}>
                  <div>
                    <label style={{ fontSize: "13px", color: "#666", marginBottom: "5px", display: "block" }}>Vehicle Type</label>
                    <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #ddd", background: "#fafafa", fontWeight: "bold" }}>
                      <option value="Bike">Motorcycle / Bike 🏍️</option>
                      <option value="Cycle">Bicycle 🚲</option>
                      <option value="Walker">Walker 🚶</option>
                    </select>
                  </div>
                  <div style={{ position: "relative" }}>
                    <Bike size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
                    <input type="text" placeholder="Driving License Number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required style={{ width: "100%", padding: "14px 14px 14px 45px", borderRadius: "10px", border: "1px solid #ddd", background: "#fafafa" }} />
                  </div>
                </motion.div>
              )}
            </>
          )}

          <div style={{ position: "relative" }}>
            <Mail size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "14px 14px 14px 45px", borderRadius: "10px", border: "1px solid #ddd", background: "#fafafa" }} />
          </div>

          <div style={{ position: "relative" }}>
            <Lock size={18} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: "14px 14px 14px 45px", borderRadius: "10px", border: "1px solid #ddd", background: "#fafafa" }} />
          </div>

          <button type="submit" disabled={loading} style={{ background: "#d70f64", color: "#fff", border: "none", padding: "15px", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", marginTop: "10px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Processing..." : (isLogin ? "Log In" : "Sign Up")} {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "25px", fontSize: "14px", color: "#666" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(""); }} style={{ color: "#d70f64", fontWeight: "bold", cursor: "pointer" }}>
            {isLogin ? "Sign up" : "Log in"}
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;