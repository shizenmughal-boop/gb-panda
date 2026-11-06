import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Bike, CheckCircle, XCircle, AlertTriangle, 
  Wallet, Star, X, ShieldAlert 
} from "lucide-react";

const AdminRiders = () => {
  const [riders, setRiders] = useState([]);
  const [activeTab, setActiveTab] = useState("Active Fleet");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRider, setSelectedRider] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch Riders
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRiders(allUsers.filter(u => u.role === "rider"));
    });
    return () => unsub();
  }, []);

  // Filter Logic
  const filteredRiders = riders.filter(r => {
    const matchSearch = (r.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
                        (r.phone || "").includes(searchQuery);
    
    if (activeTab === "Active Fleet") return matchSearch && r.isApproved === true && !r.isBanned;
    if (activeTab === "Pending Approval") return matchSearch && r.isApproved !== true && !r.isBanned;
    if (activeTab === "Suspended") return matchSearch && r.isBanned === true;
    return matchSearch;
  });

  // Actions
  const handleApprove = async (id) => {
    await updateDoc(doc(db, "users", id), { isApproved: true, status: "offline" });
    alert("Rider approved!");
  };

  const handleReject = async (id) => {
    if (window.confirm("Reject this rider application?")) {
      await updateDoc(doc(db, "users", id), { isApproved: false, isBanned: true });
    }
  };

  const handleSuspend = async (id, currentBanStatus) => {
    await updateDoc(doc(db, "users", id), { isBanned: !currentBanStatus });
  };

  const handleSettleCash = async (id) => {
    if (window.confirm("Confirm that rider has settled all COD cash?")) {
      await updateDoc(doc(db, "users", id), { codBalance: 0 });
      alert("Cash settled successfully.");
      setIsDrawerOpen(false);
    }
  };

  const openDrawer = (rider) => {
    setSelectedRider(rider);
    setIsDrawerOpen(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "#1a1a2e", margin: 0 }}>Rider Fleet Management</h1>
        <div style={{ position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
          <input 
            type="text" placeholder="Search rider name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "10px 10px 10px 40px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", width: "280px" }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
        {["Active Fleet", "Pending Approval", "Suspended"].map(tab => (
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

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee", textAlign: "left", color: "#666", fontSize: "14px" }}>
              <th style={{ paddingBottom: "12px" }}>Rider Details</th>
              <th style={{ paddingBottom: "12px" }}>Status</th>
              <th style={{ paddingBottom: "12px" }}>Deliveries</th>
              <th style={{ paddingBottom: "12px" }}>Rating</th>
              <th style={{ paddingBottom: "12px" }}>COD Cash in Hand</th>
              <th style={{ paddingBottom: "12px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRiders.map(rider => (
              <tr key={rider.id} style={{ borderBottom: "1px solid #eee", fontSize: "14px" }}>
                <td style={{ padding: "15px 0" }}>
                  <strong>{rider.name || "Unnamed Rider"}</strong><br />
                  <span style={{ color: "#666", fontSize: "12px" }}>{rider.phone || "No phone"}</span>
                </td>
                <td style={{ padding: "15px 0" }}>
                  <span style={{ background: rider.status === "online" ? "#e6fced" : rider.status === "busy" ? "#fff3cd" : "#f0f0f0", color: rider.status === "online" ? "green" : rider.status === "busy" ? "#856404" : "#666", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                    {rider.status || "offline"}
                  </span>
                </td>
                <td style={{ padding: "15px 0" }}>{rider.completedDeliveries || 0}</td>
                <td style={{ padding: "15px 0" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: "bold" }}>
                    <Star size={14} fill="gold" color="gold" /> {rider.averageRating || "5.0"}
                  </span>
                </td>
                <td style={{ padding: "15px 0", color: (rider.codBalance || 0) > 5000 ? "#d63031" : "#333", fontWeight: "bold" }}>
                  Rs {(rider.codBalance || 0).toLocaleString()}
                  {(rider.codBalance || 0) > 5000 && <AlertTriangle size={14} style={{ marginLeft: "5px", display: "inline" }} />}
                </td>
                <td style={{ padding: "15px 0" }}>
                  {activeTab === "Pending Approval" ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleApprove(rider.id)} style={{ background: "#00b894", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Approve</button>
                      <button onClick={() => handleReject(rider.id)} style={{ background: "#ff7675", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Reject</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => openDrawer(rider)} style={{ background: "#e6f0fa", color: "#0056b3", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>View</button>
                      <button onClick={() => handleSuspend(rider.id, rider.isBanned)} style={{ background: rider.isBanned ? "#e6fced" : "#ffe5e5", color: rider.isBanned ? "green" : "#d63031", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                        {rider.isBanned ? "Unban" : "Suspend"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RIDER DETAILS DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && selectedRider && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 1000 }}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} style={{ width: "400px", background: "#fff", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>Rider Profile</h2>
                <button onClick={() => setIsDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
              </div>
              <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#f0f0f0", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bike size={40} color="#666" />
                  </div>
                  <h2 style={{ margin: 0 }}>{selectedRider.name || "Unnamed Rider"}</h2>
                  <p style={{ color: "#666", margin: "5px 0" }}>{selectedRider.email}</p>
                </div>

                <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "10px", color: "#666" }}>KYC Details</h3>
                  <p style={{ margin: "5px 0", fontSize: "14px" }}><strong>Vehicle:</strong> {selectedRider.vehicleType || "Bike"}</p>
                  <p style={{ margin: "5px 0", fontSize: "14px" }}><strong>License:</strong> {selectedRider.licenseNumber || "Not provided"}</p>
                </div>

                <div style={{ background: (selectedRider.codBalance || 0) > 5000 ? "#ffe5e5" : "#e6fced", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "10px", color: (selectedRider.codBalance || 0) > 5000 ? "#d63031" : "green" }}>COD Cash in Hand</h3>
                  <p style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 10px 0" }}>Rs {(selectedRider.codBalance || 0).toLocaleString()}</p>
                  <button onClick={() => handleSettleCash(selectedRider.id)} style={{ width: "100%", padding: "10px", background: (selectedRider.codBalance || 0) > 0 ? "#0056b3" : "#ccc", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: (selectedRider.codBalance || 0) > 0 ? "pointer" : "not-allowed" }} disabled={(selectedRider.codBalance || 0) === 0}>
                    Mark Cash Settled
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminRiders;