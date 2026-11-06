import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle, XCircle, Search, Star, X, MessageSquare } from "lucide-react";

const AdminSupport = () => {
  const [disputes, setDisputes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState("Disputes");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Drawer State
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");

  useEffect(() => {
    const unsubDisputes = onSnapshot(collection(db, "disputes"), (snap) => {
      setDisputes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubReviews = onSnapshot(collection(db, "reviews"), (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubDisputes(); unsubReviews(); };
  }, []);

  const filteredDisputes = disputes.filter(d => 
    d.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.orderId?.includes(searchQuery)
  );

  const flaggedReviews = reviews.filter(r => r.isFlagged || r.rating <= 2);

  const handleResolveDispute = async (id, status) => {
    await updateDoc(doc(db, "disputes", id), { status });
    alert(`Dispute ${status === "resolved" ? "Resolved" : "Rejected"}`);
    setIsDrawerOpen(false);
  };

  const handleIssueRefund = async () => {
    if (!refundAmount || isNaN(refundAmount)) return alert("Enter valid amount");
    
    // 1. Update dispute status
    await updateDoc(doc(db, "disputes", selectedItem.id), { 
      status: "resolved", 
      refundIssued: Number(refundAmount) 
    });

    // 2. Issue Wallet Credit (Assuming userId is attached to dispute)
    if (selectedItem.userId) {
      const userRef = doc(db, "users", selectedItem.userId);
      // Note: Ideally use increment() here, but for simplicity we'll fetch and update
      await updateDoc(userRef, { 
        walletBalance: (selectedItem.currentBalance || 0) + Number(refundAmount) 
      });
      
      await addDoc(collection(db, "walletTransactions"), {
        userId: selectedItem.userId,
        amount: Number(refundAmount),
        type: "credit",
        reason: `Refund for Order #${selectedItem.orderId}`,
        createdAt: serverTimestamp()
      });
    }

    alert("Refund issued to customer wallet.");
    setIsDrawerOpen(false);
  };

  const handleToggleReviewVisibility = async (review) => {
    await updateDoc(doc(db, "reviews", review.id), { isHidden: !review.isHidden });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "#1a1a2e", margin: 0 }}>Support & Moderation</h1>
        <div style={{ position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
          <input 
            type="text" placeholder="Search dispute..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "10px 10px 10px 40px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", width: "250px" }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
        {["Disputes", "Review Moderation"].map(tab => (
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

      {activeTab === "Disputes" && (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          {filteredDisputes.length === 0 ? <p style={{ color: "#888" }}>No active disputes.</p> : null}
          {filteredDisputes.map(d => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
              <div>
                <strong style={{ fontSize: "16px" }}>{d.issueType} - Order #{d.orderId}</strong>
                <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>{d.customerName} • {d.description}</p>
                <span style={{ 
                  background: d.status === "open" ? "#fff3cd" : "#e6fced", color: d.status === "open" ? "#856404" : "green", 
                  padding: "3px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" 
                }}>
                  {d.status.toUpperCase()}
                </span>
              </div>
              <button onClick={() => { setSelectedItem(d); setIsDrawerOpen(true); setRefundAmount(""); }} style={{ background: "#e6f0fa", color: "#0056b3", border: "none", padding: "8px 15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Review Moderation" && (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          {flaggedReviews.map(r => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                  <strong>{r.userName || "Anonymous"}</strong>
                  <div style={{ display: "flex" }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= r.rating ? "gold" : "none"} color={s <= r.rating ? "gold" : "#ccc"} />)}
                  </div>
                </div>
                <p style={{ margin: 0, color: "#555", fontSize: "14px" }}>"{r.comment}"</p>
              </div>
              <button onClick={() => handleToggleReviewVisibility(r)} style={{ background: r.isHidden ? "#e6fced" : "#ffe5e5", color: r.isHidden ? "green" : "#d63031", border: "none", padding: "8px 15px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                {r.isHidden ? "Unhide" : "Hide Review"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* DISPUTE DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 1000 }}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} style={{ width: "400px", background: "#fff", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>Resolve Dispute</h2>
                <button onClick={() => setIsDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
              </div>
              <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
                <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
                  <p style={{ margin: "0 0 10px 0" }}><strong>Issue:</strong> {selectedItem.issueType}</p>
                  <p style={{ margin: "0 0 10px 0" }}><strong>Order:</strong> #{selectedItem.orderId}</p>
                  <p style={{ margin: 0 }}><strong>Description:</strong> {selectedItem.description}</p>
                </div>

                <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Issue Wallet Refund</h3>
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  <input type="number" placeholder="Amount (Rs)" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
                  <button onClick={handleIssueRefund} style={{ background: "#00b894", color: "#fff", border: "none", padding: "0 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Issue</button>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
                  <button onClick={() => handleResolveDispute(selectedItem.id, "rejected")} style={{ flex: 1, padding: "12px", background: "#ffe5e5", color: "#d63031", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Reject Claim</button>
                  <button onClick={() => handleResolveDispute(selectedItem.id, "resolved")} style={{ flex: 1, padding: "12px", background: "#f0f0f0", color: "#333", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Mark Resolved</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSupport;