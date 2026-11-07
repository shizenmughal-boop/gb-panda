import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { 
  Clock, ShoppingBag, Star, LogOut, AlertTriangle, 
  Printer, MessageSquare, XCircle, Plus, Trash2, Edit2, Upload, TrendingUp, FileText, Reply 
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import LiveChatModal from "../components/LiveChatModal";

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { logout, restaurantProfile, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [activeMainTab, setActiveMainTab] = useState("kds"); 
  const [activeKdsTab, setActiveKdsTab] = useState("Pending");
  
  const [chatOrderId, setChatOrderId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null); 
  const [prepTime, setPrepTime] = useState("25-35 min");
  const [rejectReason, setRejectReason] = useState("Out of Ingredients");
  
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "", description: "", imageFile: null });
  const [isUploading, setIsUploading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editPrice, setEditPrice] = useState("");

  const [replyingTo, setReplyingTo] = useState(null);
  const [ownerReplyText, setOwnerReplyText] = useState("");

  const audioRef = useRef(null);
  const [prevPendingCount, setPrevPendingCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!restaurantProfile?.id) {
      setLoadingData(false);
      return;
    }

    const unsubOrders = onSnapshot(query(collection(db, "orders"), where("restaurantId", "==", restaurantProfile.id)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setOrders(data);
    });

    const unsubMenu = onSnapshot(query(collection(db, "menuItems"), where("restaurantId", "==", restaurantProfile.id)), (snap) => {
      setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubReviews = onSnapshot(query(collection(db, "reviews"), where("restaurantId", "==", restaurantProfile.id)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setReviews(data);
    });

    getDocs(query(collection(db, "categories"))).then(snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingData(false);
    }).catch(err => {
      console.error("Category Error:", err);
      setLoadingData(false);
    });

    return () => { unsubOrders(); unsubMenu(); unsubReviews(); };
  }, [restaurantProfile?.id]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { audioRef.current = new Audio("/ding.mp3"); }, []);

  useEffect(() => {
    const pending = orders.filter(o => o.status === "Pending");
    if (pending.length > prevPendingCount && prevPendingCount !== 0) {
      audioRef.current?.play().catch(e => console.log("Audio blocked", e));
      showToast("New Order Received! 🍔", "success");
    }
    setPrevPendingCount(pending.length);
  }, [orders, prevPendingCount, showToast]);

  const unlockAudio = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.volume = 0;
      audioRef.current.play().then(() => { audioRef.current.pause(); audioRef.current.volume = 1; }).catch(() => {});
    }
  };

  const getElapsedTime = (createdAt) => {
    let createdMs = Date.now();
    if (createdAt) {
      if (typeof createdAt.toMillis === "function") {
        createdMs = createdAt.toMillis();
      } else {
        createdMs = new Date(createdAt).getTime();
      }
    }
    const mins = Math.floor((currentTime - createdMs) / 60000);
    return mins < 1 ? "Just now" : `${mins} min ago`;
  };

  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;
    await updateDoc(doc(db, "orders", selectedOrder.id), { status: "Preparing", prepTimeMins: prepTime, updatedAt: serverTimestamp() });
    showToast(`Order Accepted`, "success");
    setSelectedOrder(null); setModalType(null); setActiveKdsTab("Preparing");
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder) return;
    await updateDoc(doc(db, "orders", selectedOrder.id), { status: "Cancelled", rejectReason, updatedAt: serverTimestamp() });
    showToast(`Order Rejected`, "error");
    setSelectedOrder(null); setModalType(null);
  };

  const handleMarkReady = async (orderId) => {
    await updateDoc(doc(db, "orders", orderId), { status: "Ready", readyAt: serverTimestamp() });
    showToast("Order marked as Ready for Rider! 🛵", "success");
    setActiveKdsTab("Ready");
  };

  const printThermalReceipt = (order) => {
    const pdfDoc = new jsPDF({ unit: "mm", format: [80, 200] });
    pdfDoc.setFontSize(16); pdfDoc.text("GB Panda", 40, 10, { align: "center" });
    pdfDoc.setFontSize(10); pdfDoc.text(restaurantProfile?.name || "Restaurant", 40, 16, { align: "center" });
    pdfDoc.text("--------------------------------", 40, 22, { align: "center" });
    pdfDoc.text(`Order #${order.displayId || order.id.slice(-4).toUpperCase()}`, 5, 30);
    pdfDoc.text(`Customer: ${order.customerName}`, 5, 36);
    pdfDoc.text(`Phone: ${order.customerPhone || "N/A"}`, 5, 42);
    pdfDoc.text(`Address: ${order.deliveryAddress}`, 5, 48, { maxWidth: 70 });
    pdfDoc.text("--------------------------------", 40, 55, { align: "center" });

    let y = 62;
    (order.items || []).forEach(item => {
      pdfDoc.text(`${item.quantity}x ${item.name}`, 5, y);
      pdfDoc.text(`Rs ${item.price * item.quantity}`, 75, y, { align: "right" });
      y += 6;
    });

    pdfDoc.text("--------------------------------", 40, y + 2, { align: "center" });
    y += 10;
    pdfDoc.setFontSize(14); pdfDoc.text(`TOTAL: Rs ${order.total}`, 75, y, { align: "right" });
    y += 10; pdfDoc.setFontSize(10); pdfDoc.text("💵 CASH ON DELIVERY", 40, y, { align: "center" });
    pdfDoc.save(`Receipt_${order.id}.pdf`);
  };

  // --- IMAGE COMPRESSION LOGIC ---
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            resolve(blob);
          }, "image/jpeg", 0.7);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // --- IMGBB UPLOAD LOGIC ---
  const handleImageUpload = async (file) => {
    if (!file) return null;
    
    try {
      // Compress image before uploading
      const compressedBlob = await compressImage(file);
      
      const formData = new FormData();
      formData.append("image", compressedBlob);

      // Using your ImgBB API Key
      const response = await fetch("https://api.imgbb.com/1/upload?key=5dc02a741473d15a91be0aa1983b3bf2", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data.url; // Returns the permanent URL
      } else {
        throw new Error("ImgBB Upload failed");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      showToast("Image upload failed. Please try again.", "error");
      return null;
    }
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return showToast("Name and Price required", "error");
    setIsUploading(true);
    
    try {
      let imageUrl = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"; 
      if (newItem.imageFile) {
        const uploaded = await handleImageUpload(newItem.imageFile);
        if (uploaded) imageUrl = uploaded;
      }

      await addDoc(collection(db, "menuItems"), {
        restaurantId: restaurantProfile.id,
        name: newItem.name,
        price: Number(newItem.price),
        category: newItem.category || "Uncategorized",
        description: newItem.description,
        imageUrl: imageUrl,
        inStock: true,
        createdAt: serverTimestamp()
      });

      showToast("Item added to menu!", "success");
      setNewItem({ name: "", price: "", category: "", description: "", imageFile: null });
    } catch (error) {
      console.error(error);
      showToast("Failed to add item.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleStock = async (itemId, currentStock) => {
    try {
      await updateDoc(doc(db, "menuItems", itemId), { inStock: !currentStock });
      showToast(`Item marked as ${!currentStock ? "In Stock" : "Out of Stock"}`, "success");
    } catch (error) {
      showToast("Failed to update stock.", "error");
    }
  };

  const savePrice = async (itemId) => {
    try {
      await updateDoc(doc(db, "menuItems", itemId), { price: Number(editPrice) });
      setEditingItem(null);
      showToast("Price updated successfully", "success");
    } catch (error) {
      showToast("Failed to update price.", "error");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, "menuItems", itemId));
        showToast("Item deleted", "success");
      } catch (error) {
        showToast("Failed to delete item.", "error");
      }
    }
  };

  if (authLoading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontWeight: "bold", fontSize: "20px" }}>Authenticating... 🛡️</div>;

  if (!restaurantProfile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", textAlign: "center", padding: "20px" }}>
        <AlertTriangle size={60} color="#d63031" style={{ marginBottom: "20px" }} />
        <h1 style={{ fontSize: "24px", margin: "0 0 10px 0", color: "#d63031" }}>Restaurant Profile Not Found</h1>
        <button onClick={async () => { await logout(); navigate("/auth"); }} style={{ background: "#d63031", color: "#fff", padding: "12px 25px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}>Logout & Try Again</button>
      </div>
    );
  }

  if (loadingData) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontWeight: "bold", fontSize: "20px" }}>Loading Dashboard Data... 🍳</div>;

  const pendingOrders = orders.filter(o => o.status === "Pending");
  const preparingOrders = orders.filter(o => o.status === "Preparing");
  const readyOrders = orders.filter(o => o.status === "Ready");

  return (
    <div style={{ padding: "30px", background: "#f4f7f6", minHeight: "100vh" }} onClick={unlockAudio}>
      <audio ref={audioRef} src="/ding.mp3" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button onClick={async () => { await logout(); navigate("/auth"); }} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", border: "none", background: "none", color: "#d70f64", fontWeight: "bold", fontSize: "16px" }}>
            <LogOut size={18} /> Logout
          </button>
          <h1 style={{ margin: 0, fontSize: "24px", color: "#1a1a2e" }}>{restaurantProfile?.name} 🍳</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ background: restaurantProfile?.isOpen ? "#e6fced" : "#ffe5e5", padding: "8px 15px", borderRadius: "20px", cursor: "pointer" }} onClick={async () => { await updateDoc(doc(db, "restaurants", restaurantProfile.id), { isOpen: !restaurantProfile.isOpen }); }}>
            <span style={{ fontWeight: "bold", color: restaurantProfile?.isOpen ? "green" : "#d63031" }}>
              {restaurantProfile?.isOpen ? "🟢 Open" : "🔴 Closed"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {[
          { id: "kds", label: "Kitchen Display", icon: <ShoppingBag size={18} /> },
          { id: "menu", label: "Menu Manager", icon: <Plus size={18} /> }
        ].map(tab => (
          <button 
            key={tab.id} onClick={() => setActiveMainTab(tab.id)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer", background: activeMainTab === tab.id ? "#1a1a2e" : "#fff", color: activeMainTab === tab.id ? "#fff" : "#666" }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeMainTab === "kds" && (
        <div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {["Pending", "Preparing", "Ready"].map(tab => (
              <button key={tab} onClick={() => setActiveKdsTab(tab)} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", background: activeKdsTab === tab ? "#d70f64" : "#fff", color: activeKdsTab === tab ? "#fff" : "#666" }}>
                {tab} ({tab === "Pending" ? pendingOrders.length : tab === "Preparing" ? preparingOrders.length : readyOrders.length})
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {activeKdsTab === "Pending" && pendingOrders.map(order => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#fff", borderRadius: "12px", padding: "20px", borderTop: "5px solid #d70f64", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                  <strong>#{order.displayId || order.id.slice(-4).toUpperCase()}</strong>
                  <span style={{ color: "#d63031", fontSize: "12px", fontWeight: "bold" }}><Clock size={12} /> {getElapsedTime(order.createdAt)}</span>
                </div>
                <div style={{ marginBottom: "15px", fontSize: "14px" }}>
                  <p style={{ margin: "0 0 5px 0" }}><strong>{order.customerName}</strong></p>
                  <p style={{ margin: "0 0 5px 0", color: "#666" }}>📍 {order.deliveryAddress}</p>
                  <p style={{ margin: "0 0 15px 0", color: "green", fontWeight: "bold" }}>💵 COD: Rs {order.total}</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => { setSelectedOrder(order); setModalType("accept"); }} style={{ flex: 1, background: "#00b894", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Accept</button>
                  <button onClick={() => { setSelectedOrder(order); setModalType("reject"); }} style={{ flex: 1, background: "#ffe5e5", color: "#d63031", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Reject</button>
                </div>
              </motion.div>
            ))}

            {activeKdsTab === "Preparing" && preparingOrders.map(order => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#fff", borderRadius: "12px", padding: "20px", borderTop: "5px solid #f39c12", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                  <strong>#{order.displayId || order.id.slice(-4).toUpperCase()}</strong>
                  <span style={{ color: "#856404", fontSize: "12px", fontWeight: "bold" }}>Preparing ({order.prepTimeMins})</span>
                </div>
                <p style={{ margin: "0 0 15px 0" }}><strong>{order.customerName}</strong></p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => handleMarkReady(order.id)} style={{ flex: 1, background: "#00b894", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Mark Ready</button>
                </div>
              </motion.div>
            ))}

            {activeKdsTab === "Ready" && readyOrders.map(order => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#fff", borderRadius: "12px", padding: "20px", borderTop: "5px solid #00b894", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", opacity: 0.8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                  <strong>#{order.displayId || order.id.slice(-4).toUpperCase()}</strong>
                  <span style={{ color: "green", fontWeight: "bold", fontSize: "12px" }}>Waiting for Rider 🛵</span>
                </div>
                <p style={{ margin: "0 0 15px 0" }}><strong>{order.customerName}</strong></p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeMainTab === "menu" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Add New Item</h2>
            <form onSubmit={handleAddFood} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <input placeholder="Food Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} required />
              <input placeholder="Price (Rs)" type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} required />
              
              <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }} required>
                <option value="">Select Category...</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>

              <textarea placeholder="Short description..." value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd", minHeight: "60px" }} />
              
              <div style={{ border: "1px dashed #ddd", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
                <Upload size={20} style={{ marginBottom: "5px", color: "#666" }} />
                <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#666" }}>Upload Food Image</p>
                <input type="file" accept="image/*" onChange={e => setNewItem({...newItem, imageFile: e.target.files[0]})} style={{ fontSize: "12px" }} />
              </div>

              <button type="submit" disabled={isUploading} style={{ background: "#d70f64", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: isUploading ? "not-allowed" : "pointer" }}>
                {isUploading ? "Uploading Image..." : "Add to Menu"}
              </button>
            </form>
          </div>

          <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>My Menu ({menuItems.length} items)</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {menuItems.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                  <img src={item.imageUrl} alt={item.name} style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover" }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0 }}>{item.name}</h4>
                    <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "13px" }}>{item.category}</p>
                  </div>

                  {editingItem === item.id ? (
                    <div style={{ display: "flex", gap: "5px" }}>
                      <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ width: "80px", padding: "5px" }} />
                      <button onClick={() => savePrice(item.id)} style={{ background: "green", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "5px", cursor: "pointer" }}>Save</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", width: "100px" }}>
                      <span style={{ fontWeight: "bold" }}>Rs {item.price}</span>
                      <Edit2 size={14} style={{ cursor: "pointer", color: "#666" }} onClick={() => { setEditingItem(item.id); setEditPrice(item.price); }} />
                    </div>
                  )}

                  <button onClick={() => toggleStock(item.id, item.inStock !== false)} style={{ background: item.inStock !== false ? "#e6fced" : "#ffe5e5", color: item.inStock !== false ? "green" : "#d63031", border: "none", padding: "5px 10px", borderRadius: "5px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                    {item.inStock !== false ? "In Stock" : "Out of Stock"}
                  </button>

                  <button onClick={() => handleDeleteItem(item.id)} style={{ background: "none", border: "none", color: "#d63031", cursor: "pointer" }}><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {modalType === "accept" && selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: "#fff", padding: "25px", borderRadius: "16px", width: "350px" }}>
              <h2 style={{ margin: "0 0 15px 0", fontSize: "20px" }}>Accept Order</h2>
              <select value={prepTime} onChange={(e) => setPrepTime(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "20px", fontWeight: "bold" }}>
                <option value="15-25 min">15-25 min (Fast)</option>
                <option value="25-35 min">25-35 min (Normal)</option>
                <option value="40-50 min">40-50 min (Busy)</option>
              </select>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setModalType(null)} style={{ flex: 1, padding: "12px", background: "#f0f0f0", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleAcceptOrder} style={{ flex: 1, padding: "12px", background: "#00b894", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {modalType === "reject" && selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: "#fff", padding: "25px", borderRadius: "16px", width: "350px" }}>
              <h2 style={{ margin: "0 0 15px 0", fontSize: "20px", color: "#d63031" }}>Reject Order</h2>
              <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "20px", fontWeight: "bold" }}>
                <option value="Out of Ingredients">Out of Ingredients</option>
                <option value="Kitchen Closing">Kitchen Closing</option>
                <option value="Too Busy">Too Busy / High Volume</option>
              </select>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setModalType(null)} style={{ flex: 1, padding: "12px", background: "#f0f0f0", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
                <button onClick={handleRejectOrder} style={{ flex: 1, padding: "12px", background: "#d63031", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Confirm Reject</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantDashboard;