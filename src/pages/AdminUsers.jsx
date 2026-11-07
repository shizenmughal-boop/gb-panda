import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Wallet, X, Ban, CheckCircle } from "lucide-react";
import { useToast } from "../context/ToastContext";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("All Users");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [walletAdjustment, setWalletAdjustment] = useState("");
  
  const { showToast } = useToast();

  // Real-time listener for users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchSearch = 
      (u.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
      (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (u.phone || "").includes(searchQuery);
    
    if (activeTab === "All Users") return matchSearch;
    if (activeTab === "Customers") return matchSearch && u.role === "customer";
    if (activeTab === "Riders") return matchSearch && u.role === "rider";
    if (activeTab === "Restaurants") return matchSearch && u.role === "restaurant";
    return matchSearch;
  });

  // --- ACTIONS ---
  const handleBanToggle = async (id, currentStatus) => {
    const confirmMsg = currentStatus ? "Are you sure you want to UNBAN this user?" : "Are you sure you want to BAN this user?";
    if (window.confirm(confirmMsg)) {
      await updateDoc(doc(db, "users", id), { isBanned: !currentStatus });
      showToast(`User ${!currentStatus ? "Banned" : "Unbanned"} successfully`, "success");
    }
  };

  const handleWalletAdjust = async () => {
    if (!walletAdjustment || isNaN(walletAdjustment)) return showToast("Enter a valid amount", "error");
    
    const amount = Number(walletAdjustment);
    const newBalance = (selectedUser.walletBalance || 0) + amount;
    
    if (newBalance < 0) return showToast("Wallet balance cannot go below 0", "error");

    try {
      // 1. Update Wallet Balance
      await updateDoc(doc(db, "users", selectedUser.id), { walletBalance: newBalance });
      
      // 2. Log Transaction
      await addDoc(collection(db, "walletTransactions"), {
        userId: selectedUser.id,
        amount: amount,
        type: amount > 0 ? "credit" : "debit",
        reason: "Admin Manual Adjustment",
        createdAt: serverTimestamp()
      });

      setWalletAdjustment("");
      setSelectedUser({ ...selectedUser, walletBalance: newBalance });
      showToast("Wallet updated successfully.", "success");
    } catch (error) {
      showToast("Failed to update wallet.", "error");
    }
  };

  const openDrawer = (user) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "#1a1a2e", margin: 0 }}>User CRM Directory</h1>
        <div style={{ position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
          <input 
            type="text" placeholder="Search name, email, phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "10px 10px 10px 40px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", width: "300px" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
        {["All Users", "Customers", "Riders", "Restaurants"].map(tab => (
          <button
            key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "bold",
              background: activeTab === tab ? "#1a1a2e" : "transparent", color: activeTab === tab ? "#fff" : "#666"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee", textAlign: "left", color: "#666", fontSize: "14px" }}>
              <th style={{ paddingBottom: "12px" }}>User Details</th>
              <th style={{ paddingBottom: "12px" }}>Role</th>
              <th style={{ paddingBottom: "12px" }}>Wallet</th>
              <th style={{ paddingBottom: "12px" }}>Status</th>
              <th style={{ paddingBottom: "12px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} style={{ borderBottom: "1px solid #eee", fontSize: "14px" }}>
                <td style={{ padding: "15px 0" }}>
                  <strong>{user.name || "Unnamed User"}</strong><br />
                  <span style={{ color: "#666", fontSize: "12px" }}>{user.email} • {user.phone || "No phone"}</span>
                </td>
                <td style={{ padding: "15px 0" }}>
                  <span style={{ 
                    background: user.role === "admin" ? "#1a1a2e" : user.role === "restaurant" ? "#0056b3" : user.role === "rider" ? "#fdcb6e" : "#00b894", 
                    color: user.role === "admin" || user.role === "restaurant" ? "#fff" : "#333", 
                    padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase"
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: "15px 0", fontWeight: "bold" }}>Rs {(user.walletBalance || 0).toLocaleString()}</td>
                <td style={{ padding: "15px 0" }}>
                  <span style={{ background: user.isBanned ? "#ffe5e5" : "#e6fced", color: user.isBanned ? "#d63031" : "green", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                    {user.isBanned ? "Banned" : "Active"}
                  </span>
                </td>
                <td style={{ padding: "15px 0" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => openDrawer(user)} style={{ background: "#e6f0fa", color: "#0056b3", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>View</button>
                    <button onClick={() => handleBanToggle(user.id, user.isBanned)} style={{ background: user.isBanned ? "#e6fced" : "#ffe5e5", color: user.isBanned ? "green" : "#d63031", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                      {user.isBanned ? "Unban" : "Ban"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* USER 360 DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 1000 }}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} style={{ width: "450px", background: "#fff", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>User 360 Profile</h2>
                <button onClick={() => setIsDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
              </div>
              <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#f0f0f0", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={40} color="#666" />
                  </div>
                  <h2 style={{ margin: 0 }}>{selectedUser.name || "Unnamed User"}</h2>
                  <p style={{ color: "#666", margin: "5px 0" }}>{selectedUser.email}</p>
                </div>

                <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "10px", color: "#666" }}>Account Details</h3>
                  <p style={{ margin: "5px 0", fontSize: "14px" }}><strong>Role:</strong> {selectedUser.role}</p>
                  <p style={{ margin: "5px 0", fontSize: "14px" }}><strong>Phone:</strong> {selectedUser.phone || "N/A"}</p>
                  <p style={{ margin: "5px 0", fontSize: "14px" }}><strong>Status:</strong> {selectedUser.isBanned ? "Banned" : "Active"}</p>
                </div>

                <div style={{ background: "#e6f0fa", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "10px", color: "#0056b3", display: "flex", alignItems: "center", gap: "5px" }}><Wallet size={16} /> PandaPay Wallet</h3>
                  <p style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 15px 0", color: "#0056b3" }}>Rs {(selectedUser.walletBalance || 0).toLocaleString()}</p>
                  
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input type="number" placeholder="Amount (e.g. 500)" value={walletAdjustment} onChange={(e) => setWalletAdjustment(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
                    <button onClick={handleWalletAdjust} style={{ background: "#0056b3", color: "#fff", border: "none", padding: "0 15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Adjust</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;