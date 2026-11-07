import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { User, MapPin, Phone, Save, Wallet, ShoppingBag } from "lucide-react";
import AddressPicker from "../components/AddressPicker";

const CustomerProfile = () => {
  const { currentUser, userProfile } = useAuth();
  const { orders } = useApp(); 
  const { showToast } = useToast();

  // Pre-fill form with live database data
  const [name, setName] = useState(userProfile?.name || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [address, setAddress] = useState(userProfile?.address || "");
  const [location, setLocation] = useState(userProfile?.location || null);
  const [saving, setSaving] = useState(false);

  // Calculate Lifetime Stats
  const myOrders = orders.filter(o => o.customerId === currentUser?.uid && o.status === "Delivered");
  const totalOrders = myOrders.length;
  const totalSpent = myOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        name: name,
        phone: phone,
        address: address,
        location: location
      });
      showToast("Profile updated successfully!", "success");
    } catch (error) {
      console.error("Profile Update Error:", error);
      showToast("Failed to update profile.", "error");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "30px 20px" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#fff", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", borderBottom: "1px solid #eee", paddingBottom: "20px", marginBottom: "25px" }}>
          <div style={{ background: "#d70f64", color: "#fff", width: "70px", height: "70px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "bold" }}>
            {userProfile?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h1 style={{ margin: "0 0 5px 0", fontSize: "24px" }}>{userProfile?.name || "Customer"}</h1>
            <p style={{ margin: 0, color: "#666" }}>{currentUser?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "30px" }}>
          <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px", textAlign: "center" }}>
            <ShoppingBag size={20} color="#0056b3" style={{ marginBottom: "5px" }} />
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Total Orders</p>
            <h3 style={{ margin: "5px 0 0 0", color: "#1a1a2e" }}>{totalOrders}</h3>
          </div>
          <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px", textAlign: "center" }}>
            <Wallet size={20} color="green" style={{ marginBottom: "5px" }} />
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Total Spent</p>
            <h3 style={{ margin: "5px 0 0 0", color: "#1a1a2e" }}>Rs {totalSpent}</h3>
          </div>
          <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px", textAlign: "center" }}>
            <Wallet size={20} color="#d70f64" style={{ marginBottom: "5px" }} />
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>PandaPay Wallet</p>
            <h3 style={{ margin: "5px 0 0 0", color: "#d70f64" }}>Rs {userProfile?.walletBalance || 0}</h3>
          </div>
        </div>

        {/* Editable Form */}
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "bold", color: "#666", marginBottom: "8px" }}><User size={16} /> Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", outline: "none" }} />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "bold", color: "#666", marginBottom: "8px" }}><Phone size={16} /> Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", outline: "none" }} />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "bold", color: "#666", marginBottom: "8px" }}><MapPin size={16} /> Default Delivery Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", minHeight: "60px", outline: "none" }} />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "bold", color: "#666", marginBottom: "8px" }}><MapPin size={16} /> Pin Exact Location</label>
            <AddressPicker position={location} setPosition={setLocation} />
          </div>

          <button type="submit" disabled={saving} style={{ background: "#d70f64", color: "#fff", border: "none", padding: "15px", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: saving ? "not-allowed" : "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "10px" }}>
            <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CustomerProfile;