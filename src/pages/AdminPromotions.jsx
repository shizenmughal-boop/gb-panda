import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Tag, Plus, Trash2, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";

const AdminPromotions = () => {
  const [vouchers, setVouchers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [activeTab, setActiveTab] = useState("Promo Codes");

  // Form States
  const [newVoucher, setNewVoucher] = useState({ code: "", type: "percentage", value: 10, minOrder: 300, maxDiscount: 500, isActive: true });
  const [newBanner, setNewBanner] = useState({ title: "", subtitle: "", imageUrl: "", isActive: true });

  useEffect(() => {
    const unsubVouchers = onSnapshot(collection(db, "vouchers"), (snap) => {
      setVouchers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubBanners = onSnapshot(collection(db, "banners"), (snap) => {
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubVouchers(); unsubBanners(); };
  }, []);

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    if (!newVoucher.code) return alert("Enter a promo code");
    await addDoc(collection(db, "vouchers"), {
      ...newVoucher,
      code: newVoucher.code.toUpperCase(),
      usedCount: 0,
      createdAt: new Date()
    });
    setNewVoucher({ code: "", type: "percentage", value: 10, minOrder: 300, maxDiscount: 500, isActive: true });
    alert("Voucher created!");
  };

  const handleCreateBanner = async (e) => {
    e.preventDefault();
    if (!newBanner.title || !newBanner.imageUrl) return alert("Title and Image URL required");
    await addDoc(collection(db, "banners"), newBanner);
    setNewBanner({ title: "", subtitle: "", imageUrl: "", isActive: true });
    alert("Banner created!");
  };

  const toggleVoucherStatus = async (id, currentStatus) => {
    await updateDoc(doc(db, "vouchers", id), { isActive: !currentStatus });
  };

  const toggleBannerStatus = async (id, currentStatus) => {
    await updateDoc(doc(db, "banners", id), { isActive: !currentStatus });
  };

  const handleDeleteVoucher = async (id) => {
    if (window.confirm("Delete this voucher?")) await deleteDoc(doc(db, "vouchers", id));
  };

  const handleDeleteBanner = async (id) => {
    if (window.confirm("Delete this banner?")) await deleteDoc(doc(db, "banners", id));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "#1a1a2e", margin: 0 }}>Promotions & Marketing</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
        {["Promo Codes", "App Banners"].map(tab => (
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

      {activeTab === "Promo Codes" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
          {/* Create Form */}
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", height: "fit-content" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}><Tag size={20} /> Create Voucher</h2>
            <form onSubmit={handleCreateVoucher} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "5px" }}>Promo Code</label>
                <input placeholder="e.g. PANDA50" value={newVoucher.code} onChange={e => setNewVoucher({...newVoucher, code: e.target.value.toUpperCase()})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} required />
              </div>
              
              <div>
                <label style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "5px" }}>Discount Type</label>
                <select value={newVoucher.type} onChange={e => setNewVoucher({...newVoucher, type: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rs)</option>
                  <option value="free_delivery">Free Delivery</option>
                </select>
              </div>

              {newVoucher.type !== "free_delivery" && (
                <div>
                  <label style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "5px" }}>Discount Value</label>
                  <input type="number" value={newVoucher.value} onChange={e => setNewVoucher({...newVoucher, value: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} required />
                </div>
              )}

              <div>
                <label style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "5px" }}>Min Order (Rs)</label>
                <input type="number" value={newVoucher.minOrder} onChange={e => setNewVoucher({...newVoucher, minOrder: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} required />
              </div>

              <button type="submit" style={{ background: "#d70f64", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}>Create Promo</button>
            </form>
          </div>

          {/* List */}
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Active Vouchers ({vouchers.length})</h2>
            {vouchers.map(v => (
              <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
                <div>
                  <span style={{ background: "#1a1a2e", color: "#fff", padding: "4px 10px", borderRadius: "6px", fontWeight: "bold", letterSpacing: "1px", fontSize: "14px" }}>{v.code}</span>
                  <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#666" }}>
                    {v.type === "percentage" ? `${v.value}% OFF` : v.type === "fixed" ? `Rs ${v.value} OFF` : "FREE DELIVERY"} • Min: Rs {v.minOrder}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => toggleVoucherStatus(v.id, v.isActive)} style={{ background: v.isActive ? "#e6fced" : "#ffe5e5", color: v.isActive ? "green" : "#d63031", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}>
                    {v.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />} {v.isActive ? "Active" : "Inactive"}
                  </button>
                  <button onClick={() => handleDeleteVoucher(v.id)} style={{ background: "none", border: "none", color: "#d63031", cursor: "pointer" }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "App Banners" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", height: "fit-content" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}><ImageIcon size={20} /> Add Banner</h2>
            <form onSubmit={handleCreateBanner} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "5px" }}>Banner Title</label>
                <input placeholder="e.g. Mega Deal!" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} required />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "5px" }}>Subtitle</label>
                <input placeholder="e.g. 50% off on first order" value={newBanner.subtitle} onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} />
              </div>
              <div>
                <label style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "5px" }}>Image URL</label>
                <input placeholder="https://..." value={newBanner.imageUrl} onChange={e => setNewBanner({...newBanner, imageUrl: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} required />
              </div>
              <button type="submit" style={{ background: "#0056b3", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}>Create Banner</button>
            </form>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Active Banners ({banners.length})</h2>
            {banners.map(b => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <img src={b.imageUrl} alt={b.title} style={{ width: "100px", height: "50px", objectFit: "cover", borderRadius: "8px" }} />
                  <div>
                    <strong>{b.title}</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#666" }}>{b.subtitle}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => toggleBannerStatus(b.id, b.isActive)} style={{ background: b.isActive ? "#e6fced" : "#ffe5e5", color: b.isActive ? "green" : "#d63031", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                    {b.isActive ? "Active" : "Inactive"}
                  </button>
                  <button onClick={() => handleDeleteBanner(b.id)} style={{ background: "none", border: "none", color: "#d63031", cursor: "pointer" }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromotions;