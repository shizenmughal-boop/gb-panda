import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { 
  collection, query, where, onSnapshot, doc, updateDoc, 
  runTransaction, serverTimestamp, increment, writeBatch 
} from "firebase/firestore";
import { 
  Navigation, LogOut, Wallet, CheckCircle, Clock, MapPin, 
  Bike, ShieldAlert, AlertTriangle, Phone, MessageSquare, X
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import RiderMap from "../components/RiderMap";
import LiveChatModal from "../components/LiveChatModal";
import { useWakeLock } from "../hooks/useWakeLock";

const RiderDashboard = () => {
  const navigate = useNavigate();
  const { logout, currentUser, userProfile } = useAuth();
  const { showToast } = useToast();

  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("Available");
  
  const [chatOrderId, setChatOrderId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("JazzCash");
  const [accountNumber, setAccountNumber] = useState("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  const [isGpsActive, setIsGpsActive] = useState(false);
  const watchIdRef = useRef(null);
  const lastLocationUpdate = useRef(0);

  const audioRef = useRef(null);
  const [prevAvailableCount, setPrevAvailableCount] = useState(0);

  const isOnline = userProfile?.riderStatus === "online";
  const isApproved = userProfile?.isApproved === true;
  const isBanned = userProfile?.isBanned === true;
  const codBalance = userProfile?.codBalance || 0;
  const codLimit = userProfile?.codLimit || 5000;
  const isCodLimitReached = codBalance >= codLimit;
  const walletBalance = userProfile?.walletBalance || 0;

  useWakeLock(isOnline);

  useEffect(() => {
    if (!currentUser || !isApproved || isBanned) return;

    const qAvailable = query(collection(db, "orders"), where("status", "==", "Ready"), where("riderId", "==", null));
    const unsubAvailable = onSnapshot(qAvailable, (snap) => {
      setAvailableOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qActive = query(collection(db, "orders"), where("riderId", "==", currentUser.uid), where("status", "==", "Out for Delivery"));
    const unsubActive = onSnapshot(qActive, (snap) => {
      setActiveOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubAvailable(); unsubActive(); };
  }, [currentUser, isApproved, isBanned]);

  useEffect(() => { audioRef.current = new Audio("/ding.mp3"); }, []);

  useEffect(() => {
    if (isOnline && availableOrders.length > prevAvailableCount && prevAvailableCount !== 0) {
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio blocked", e));
        showToast("🔔 New Delivery Available!", "success");
      }
    }
    setPrevAvailableCount(availableOrders.length);
  }, [availableOrders.length, prevAvailableCount, isOnline, showToast]);

  const unlockAudio = () => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.volume = 0;
      audioRef.current.play().then(() => { audioRef.current.pause(); audioRef.current.volume = 1; }).catch(() => {});
    }
  };

  const toggleOnlineStatus = async () => {
    if (isBanned || !isApproved) return;
    const newStatus = !isOnline;
    await updateDoc(doc(db, "users", currentUser.uid), { riderStatus: newStatus ? "online" : "offline" });
    showToast(`You are now ${newStatus ? "ONLINE 🟢" : "OFFLINE 🔴"}`, newStatus ? "success" : "error");
    if (!newStatus) stopGpsBroadcast();
  };

  const acceptOrder = async (orderId) => {
    if (!isOnline) return showToast("Go online to accept orders.", "error");
    if (isCodLimitReached) return showToast("COD limit reached. Settle cash with Admin.", "error");

    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) throw new Error("Order does not exist.");
        if (orderDoc.data().riderId) throw new Error("Order already accepted by another rider.");
        if (orderDoc.data().status !== "Ready") throw new Error("Order is not ready for pickup.");

        transaction.update(orderRef, {
          riderId: currentUser.uid,
          riderName: userProfile.name || "Rider",
          riderPhone: userProfile.phone || "",
          status: "Out for Delivery",
          pickedUpAt: serverTimestamp()
        });
        transaction.update(doc(db, "users", currentUser.uid), { riderStatus: "busy" });
      });
      showToast("Delivery Accepted!", "success");
      setActiveTab("Active");
      startGpsBroadcast();
    } catch (error) { showToast(error.message, "error"); }
  };

  const startGpsBroadcast = () => {
    if (!currentUser || isGpsActive) return;
    setIsGpsActive(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastLocationUpdate.current > 10000) {
          lastLocationUpdate.current = now;
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          activeOrders.forEach(order => {
            updateDoc(doc(db, "orders", order.id), { riderLocation: coords }).catch(err => console.error(err));
          });
        }
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const stopGpsBroadcast = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsGpsActive(false);
    }
  };

  useEffect(() => { return () => stopGpsBroadcast(); }, []);

  const markDelivered = async (order) => {
    stopGpsBroadcast();
    const earnings = 150;

    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, "orders", order.id);
      batch.update(orderRef, { status: "Delivered", deliveredAt: serverTimestamp(), riderEarnings: earnings });

      const userRef = doc(db, "users", currentUser.uid);
      batch.update(userRef, {
        walletBalance: increment(earnings),
        completedDeliveries: increment(1),
        codBalance: order.paymentMethod === "COD" ? increment(order.total) : increment(0),
        riderStatus: activeOrders.length > 1 ? "busy" : "online"
      });

      await batch.commit();
      showToast(`Order Delivered! Rs ${earnings} added to wallet.`, "success");
    } catch (error) { showToast("Failed to complete delivery.", "error"); }
  };

  // --- RIDER PAYOUT LOGIC ---
  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (amount <= 0 || amount > walletBalance) return showToast("Invalid amount or insufficient balance.", "error");
    if (!accountNumber) return showToast("Enter account number.", "error");

    setIsSubmittingPayout(true);
    try {
      const batch = writeBatch(db);
      
      // 1. Deduct from wallet
      batch.update(doc(db, "users", currentUser.uid), { walletBalance: increment(-amount) });
      
      // 2. Create payout request
      const payoutRef = doc(collection(db, "payouts"));
      batch.set(payoutRef, {
        id: payoutRef.id,
        targetType: "rider",
        targetId: currentUser.uid,
        targetName: userProfile.name || "Rider",
        amount: amount,
        method: payoutMethod,
        accountDetails: accountNumber,
        status: "pending",
        createdAt: serverTimestamp()
      });
      
      await batch.commit();
      showToast("Payout requested successfully!", "success");
      setIsPayoutModalOpen(false);
      setPayoutAmount(""); setAccountNumber("");
    } catch (error) {
      showToast("Payout request failed.", "error");
    }
    setIsSubmittingPayout(false);
  };

  if (!isApproved && !isBanned) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8f9fa", textAlign: "center", padding: "20px" }}>
        <Clock size={60} color="#f39c12" style={{ marginBottom: "20px" }} />
        <h1 style={{ fontSize: "24px", margin: "0 0 10px 0" }}>Verification Pending ⏳</h1>
        <p style={{ color: "#666", maxWidth: "400px", marginBottom: "30px" }}>Your account is under review by the Admin.</p>
        <button onClick={async () => { await logout(); navigate("/auth"); }} style={{ background: "#333", color: "#fff", padding: "12px 25px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}>Logout</button>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: "#fff5f5", textAlign: "center", padding: "20px" }}>
        <ShieldAlert size={60} color="#d63031" style={{ marginBottom: "20px" }} />
        <h1 style={{ fontSize: "24px", margin: "0 0 10px 0", color: "#d63031" }}>Account Suspended 🚫</h1>
        <button onClick={async () => { await logout(); navigate("/auth"); }} style={{ background: "#d63031", color: "#fff", padding: "12px 25px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", background: "#f4f7f6", minHeight: "100vh", paddingBottom: "100px" }} onClick={unlockAudio}>
      <audio ref={audioRef} src="/ding.mp3" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button onClick={async () => { await logout(); navigate("/auth"); }} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", border: "none", background: "none", color: "#d70f64", fontWeight: "bold" }}>
          <LogOut size={18} /> Logout
        </button>

        <div onClick={toggleOnlineStatus} style={{ display: "flex", alignItems: "center", gap: "10px", background: isOnline ? "#e6fced" : "#ffe5e5", padding: "10px 20px", borderRadius: "20px", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.1)", border: isOnline ? "2px solid #00b894" : "2px solid #d63031" }}>
          <span style={{ fontSize: "14px", fontWeight: "bold", color: isOnline ? "green" : "#d63031" }}>{isOnline ? "ONLINE 🟢" : "OFFLINE 🔴"}</span>
          <label style={{ display: "inline-block", width: "50px", height: "26px", position: "relative", cursor: "pointer" }}>
            <input type="checkbox" checked={isOnline} readOnly style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: isOnline ? "green" : "#ccc", borderRadius: "26px", transition: "0.4s" }}>
              <span style={{ position: "absolute", height: "18px", width: "18px", left: isOnline ? "26px" : "4px", bottom: "4px", background: "white", borderRadius: "50%", transition: "0.4s" }}></span>
            </span>
          </label>
        </div>
      </div>

      {isCodLimitReached && (
        <div style={{ background: "#ffe5e5", color: "#d63031", padding: "15px", borderRadius: "10px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontWeight: "bold" }}>
          <AlertTriangle size={20} /> COD Limit Reached (Rs {codBalance}). Settle cash with Admin.
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "flex", gap: "15px", overflowX: "auto", paddingBottom: "10px", marginBottom: "20px", scrollbarWidth: "none" }}>
        <div style={{ minWidth: "150px", background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", borderLeft: "4px solid #00b894", cursor: "pointer" }} onClick={() => setIsPayoutModalOpen(true)}>
          <p style={{ margin: "0 0 5px 0", fontSize: "12px", color: "#666" }}>Wallet Balance</p>
          <h2 style={{ margin: 0, fontSize: "22px", color: "green" }}>Rs {walletBalance}</h2>
          <span style={{ fontSize: "10px", color: "#0056b3", fontWeight: "bold" }}>Request Payout →</span>
        </div>
        <div style={{ minWidth: "150px", background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", borderLeft: "4px solid #d70f64" }}>
          <p style={{ margin: "0 0 5px 0", fontSize: "12px", color: "#666" }}>COD Cash</p>
          <h2 style={{ margin: 0, fontSize: "22px", color: "#d70f64" }}>Rs {codBalance}</h2>
        </div>
        <div style={{ minWidth: "150px", background: "#fff", padding: "15px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)", borderLeft: "4px solid #0056b3" }}>
          <p style={{ margin: "0 0 5px 0", fontSize: "12px", color: "#666" }}>Deliveries</p>
          <h2 style={{ margin: 0, fontSize: "22px", color: "#0056b3" }}>{userProfile?.completedDeliveries || 0}</h2>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("Available")} style={{ flex: 1, padding: "15px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer", background: activeTab === "Available" ? "#1a1a2e" : "#fff", color: activeTab === "Available" ? "#fff" : "#666" }}>Available ({availableOrders.length})</button>
        <button onClick={() => setActiveTab("Active")} style={{ flex: 1, padding: "15px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer", background: activeTab === "Active" ? "#1a1a2e" : "#fff", color: activeTab === "Active" ? "#fff" : "#666" }}>My Deliveries ({activeOrders.length})</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {activeTab === "Available" && availableOrders.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#888" }}><Bike size={50} style={{ marginBottom: "15px", opacity: 0.5 }} /><h3>No orders available right now.</h3></div>
        )}
        {activeTab === "Available" && availableOrders.map(order => (
          <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", borderTop: "5px solid #0056b3" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}><strong style={{ fontSize: "18px" }}>#{order.displayId || order.id.slice(-4).toUpperCase()}</strong><span style={{ background: "#e6f0fa", color: "#0056b3", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>Ready</span></div>
            <div style={{ marginBottom: "15px", fontSize: "14px" }}>
              <p style={{ margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "5px" }}><MapPin size={16} color="#d70f64" /> <strong>Pickup:</strong> {order.restaurantName}</p>
              <p style={{ margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "5px" }}><MapPin size={16} color="#00b894" /> <strong>Dropoff:</strong> {order.deliveryAddress}</p>
              <p style={{ margin: 0, color: order.paymentMethod === "COD" ? "green" : "#0056b3", fontWeight: "bold" }}>{order.paymentMethod === "COD" ? `💵 Collect Rs ${order.total} (COD)` : "✅ Paid Online"}</p>
            </div>
            <button onClick={() => acceptOrder(order.id)} disabled={!isOnline || isCodLimitReached} style={{ width: "100%", background: (isOnline && !isCodLimitReached) ? "#0056b3" : "#ccc", color: "#fff", border: "none", padding: "15px", borderRadius: "10px", fontWeight: "bold", fontSize: "16px", cursor: (isOnline && !isCodLimitReached) ? "pointer" : "not-allowed" }}>{(isOnline && !isCodLimitReached) ? "Accept Delivery" : (!isOnline ? "Go Online to Accept" : "COD Limit Reached")}</button>
          </motion.div>
        ))}

        {activeTab === "Active" && activeOrders.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#888" }}><CheckCircle size={50} style={{ marginBottom: "15px", opacity: 0.5 }} /><h3>No active deliveries.</h3></div>
        )}
        {activeTab === "Active" && activeOrders.map(order => (
          <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)", borderTop: "5px solid #d70f64" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}><strong style={{ fontSize: "18px" }}>#{order.displayId || order.id.slice(-4).toUpperCase()}</strong><span style={{ background: "#ffe5e5", color: "#d63031", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>On the Way</span></div>
            <div style={{ marginBottom: "15px" }}><RiderMap mode="route" riderLocation={order.riderLocation} restaurantLocation={order.restaurantLocation} customerLocation={order.customerLocation} /></div>
            <div style={{ marginBottom: "15px", fontSize: "14px" }}><p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>Customer: {order.customerName}</p><p style={{ margin: "0 0 10px 0", color: "#666" }}>📍 {order.deliveryAddress}</p></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "15px" }}>
              <a href={`tel:${order.customerPhone}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", background: "#e6f0fa", color: "#0056b3", padding: "12px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}><Phone size={18} /> Call</a>
              <button onClick={() => { setChatOrderId(order.id); setIsChatOpen(true); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", background: "#f0f0f0", color: "#333", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}><MessageSquare size={18} /> Chat</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {order.customerLocation && <a href={`https://www.google.com/maps/dir/?api=1&destination=${order.customerLocation.lat},${order.customerLocation.lng}`} target="_blank" rel="noreferrer" style={{ width: "100%", background: "#4285F4", color: "#fff", border: "none", padding: "15px", borderRadius: "10px", fontWeight: "bold", textDecoration: "none", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}><Navigation size={18} /> Open Google Maps</a>}
              {!isGpsActive ? <button onClick={startGpsBroadcast} style={{ width: "100%", background: "#f39c12", color: "#fff", border: "none", padding: "15px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}>📡 Start Live GPS Tracking</button> : <div style={{ textAlign: "center", color: "#00b894", fontWeight: "bold", fontSize: "14px" }}>✅ GPS Broadcasting Active</div>}
              <button onClick={() => markDelivered(order)} style={{ width: "100%", background: "#00b894", color: "#fff", border: "none", padding: "15px", borderRadius: "10px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginTop: "10px" }}><CheckCircle size={20} /> Mark as Delivered {order.paymentMethod === "COD" && `(Collect Rs ${order.total})`}</button>
            </div>
          </motion.div>
        ))}
      </div>

      <LiveChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} orderId={chatOrderId} />

      {/* PAYOUT MODAL */}
      <AnimatePresence>
        {isPayoutModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: "#fff", padding: "25px", borderRadius: "16px", width: "350px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "20px" }}>Request Payout</h2>
                <button onClick={() => setIsPayoutModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
              </div>
              <form onSubmit={handlePayoutRequest} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#666", marginBottom: "5px", display: "block" }}>Amount (Max: Rs {walletBalance})</label>
                  <input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="e.g. 1000" max={walletBalance} required style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#666", marginBottom: "5px", display: "block" }}>Method</label>
                  <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontWeight: "bold" }}>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#666", marginBottom: "5px", display: "block" }}>Account Number / IBAN</label>
                  <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 03001234567" required style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" }} />
                </div>
                <button type="submit" disabled={isSubmittingPayout} style={{ background: "#00b894", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "bold", cursor: isSubmittingPayout ? "not-allowed" : "pointer", marginTop: "10px" }}>
                  {isSubmittingPayout ? "Submitting..." : "Confirm Payout"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RiderDashboard;