import { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { db } from "../firebase";
import { doc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, AlertTriangle, Clock, MapPin, Truck, X, 
  User, Phone, CheckCircle, XCircle, Bike 
} from "lucide-react";

const AdminOrders = () => {
  const { orders, restaurants, menuItems } = useApp();
  
  const [activeTab, setActiveTab] = useState("Active");
  const [searchQuery, setSearchQuery] = useState("");
  const [riders, setRiders] = useState([]);
  
  // Drawer & Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("Restaurant Closed");

  // Fetch Available Riders
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setRiders(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.role === "rider"));
    });
    return () => unsub();
  }, []);

  // SLA Check Function (Returns true if delayed)
  const checkSLA = (order) => {
    if (order.status !== "Pending") return false;
    const created = order.createdAt?.toMillis ? order.createdAt.toMillis() : new Date(order.createdAt).getTime();
    const diffMins = (Date.now() - created) / (1000 * 60);
    return diffMins > 5; // Delayed if pending > 5 mins
  };

  // Filtering Logic
  const filteredOrders = orders.filter(o => {
    const matchSearch = o.displayId?.toString().includes(searchQuery) || o.customer?.toLowerCase().includes(searchQuery.toLowerCase());
    const isActive = o.status !== "Delivered" && o.status !== "Cancelled";
    
    if (activeTab === "Active") return matchSearch && isActive;
    if (activeTab === "Delivered") return matchSearch && o.status === "Delivered";
    if (activeTab === "Cancelled") return matchSearch && o.status === "Cancelled";
    return matchSearch;
  });

  // Actions
  const handleForceStatus = async (orderId, newStatus) => {
    await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const handleAssignRider = async (riderId, riderName) => {
    await updateDoc(doc(db, "orders", selectedOrder.id), { 
      riderId, 
      riderName, 
      status: "Out for Delivery" 
    });
    setIsAssignModalOpen(false);
    setIsDrawerOpen(false);
    alert(`Order assigned to ${riderName}`);
  };

  const handleCancelOrder = async () => {
    await updateDoc(doc(db, "orders", selectedOrder.id), { 
      status: "Cancelled", 
      cancellationReason: cancelReason,
      refunded: true // Mock refund flag
    });
    setIsCancelModalOpen(false);
    setIsDrawerOpen(false);
    alert(`Order cancelled and refunded. Reason: ${cancelReason}`);
  };

  const openOrderDrawer = (order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const restName = (id) => restaurants.find(r => String(r.id) === String(id))?.name || "Unknown Restaurant";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "#1a1a2e", margin: 0 }}>Live Order Monitor</h1>
        <div style={{ position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
          <input 
            type="text" 
            placeholder="Search order # or customer..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "10px 10px 10px 40px", borderRadius: "8px", border: "1px solid #ddd", outline: "none", width: "280px" }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
        {["Active", "Delivered", "Cancelled"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px", borderRadius: "20px", border: "none", cursor: "pointer", fontWeight: "bold",
              background: activeTab === tab ? "#1a1a2e" : "transparent",
              color: activeTab === tab ? "#fff" : "#666"
            }}
          >
            {tab} Orders
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {filteredOrders.map(order => {
          const isDelayed = checkSLA(order);
          return (
            <motion.div key={order.id} whileHover={{ y: -3 }} onClick={() => openOrderDrawer(order)} style={{ background: "#fff", padding: "20px", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", borderLeft: `5px solid ${isDelayed ? '#d63031' : (order.status === 'Delivered' ? '#00b894' : '#d70f64')}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <strong style={{ fontSize: "18px" }}>#{order.displayId || order.id}</strong>
                  {isDelayed && <span style={{ display: "flex", alignItems: "center", gap: "4px", background: "#ffe5e5", color: "#d63031", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "bold" }}><AlertTriangle size={12} /> SLA DELAYED</span>}
                </div>
                <span style={{ background: "#f0f0f0", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>{order.status}</span>
              </div>
              
              <p style={{ margin: "5px 0", fontSize: "14px", color: "#333" }}><strong>{order.customer}</strong> • Rs {order.total}</p>
              <p style={{ margin: "5px 0", fontSize: "13px", color: "#666", display: "flex", alignItems: "center", gap: "5px" }}><MapPin size={14} /> {restName(order.restaurantId)}</p>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", paddingTop: "15px", borderTop: "1px dashed #eee" }}>
                 <span style={{ fontSize: "13px", color: "#666", display: "flex", alignItems: "center", gap: "5px" }}><Clock size={14} /> {order.status === "Pending" ? "Waiting for accept" : "In Progress"}</span>
                 <span style={{ fontSize: "13px", color: "#0056b3", fontWeight: "bold" }}>View Details →</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ORDER DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 1000 }}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} style={{ width: "500px", background: "#fff", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0 }}>Order #{selectedOrder.displayId || selectedOrder.id}</h2>
                <button onClick={() => setIsDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Customer Info</h3>
                <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
                  <p style={{ margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "8px" }}><User size={16} /> {selectedOrder.customer}</p>
                  <p style={{ margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "8px" }}><Phone size={16} /> {selectedOrder.phone || "N/A"}</p>
                  <p style={{ margin: 0, display: "flex", alignItems: "flex-start", gap: "8px" }}><MapPin size={16} style={{ marginTop: "3px" }} /> {selectedOrder.address}</p>
                </div>

                <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Order Items</h3>
                <div style={{ border: "1px solid #eee", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
                  {selectedOrder.cartItems?.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 15px", borderBottom: i !== selectedOrder.cartItems.length - 1 ? "1px solid #eee" : "none" }}>
                      <span>{item.quantity}x {item.name}</span>
                      <span>Rs {item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "15px", background: "#f9f9f9", fontWeight: "bold" }}>
                    <span>Total (COD)</span>
                    <span>Rs {selectedOrder.total}</span>
                  </div>
                </div>

                <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Admin Controls</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  
                  {/* Force Status Dropdown */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <select 
                      value={selectedOrder.status} 
                      onChange={(e) => handleForceStatus(selectedOrder.id, e.target.value)}
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontWeight: "bold" }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready">Ready</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>

                  <button onClick={() => setIsAssignModalOpen(true)} style={{ padding: "10px", borderRadius: "8px", border: "none", background: "#e6f0fa", color: "#0056b3", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <Bike size={18} /> Assign / Reassign Rider
                  </button>

                  <button onClick={() => setIsCancelModalOpen(true)} style={{ padding: "10px", borderRadius: "8px", border: "none", background: "#ffe5e5", color: "#d63031", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <XCircle size={18} /> Cancel & Refund Order
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ASSIGN RIDER MODAL */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: "#fff", padding: "30px", borderRadius: "16px", width: "400px" }}>
              <h2 style={{ marginBottom: "20px" }}>Select a Rider</h2>
              <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
                {riders.filter(r => r.isApproved !== false).map(rider => (
                  <div key={rider.id} onClick={() => handleAssignRider(rider.id, rider.name || "Rider")} style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid #eee", cursor: "pointer" }}>
                    <span>{rider.name || "Unnamed Rider"}</span>
                    <span style={{ color: rider.status === "online" ? "green" : "#666", fontWeight: "bold" }}>{rider.status || "offline"}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} style={{ width: "100%", padding: "12px", background: "#f0f0f0", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CANCEL MODAL */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: "#fff", padding: "30px", borderRadius: "16px", width: "400px" }}>
              <h2 style={{ marginBottom: "20px", color: "#d63031" }}>Cancel & Refund</h2>
              <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "20px", fontWeight: "bold" }}>
                <option>Restaurant Closed</option>
                <option>Out of Stock</option>
                <option>Rider Unavailable</option>
                <option>Customer Request</option>
              </select>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setIsCancelModalOpen(false)} style={{ flex: 1, padding: "12px", background: "#f0f0f0", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Back</button>
                <button onClick={handleCancelOrder} style={{ flex: 1, padding: "12px", background: "#d63031", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Confirm Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;