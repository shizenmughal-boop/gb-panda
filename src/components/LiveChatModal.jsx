import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LiveChatModal = ({ orderId, isOpen, onClose }) => {
  const { userData } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Quick canned replies for riders
  const cannedReplies = [
    "I have arrived at the restaurant 🍔",
    "On my way to your location 🛵",
    "I am outside your gate, please collect your order 🏠",
    "Traffic is heavy, I'll be there in 5 mins ⏳"
  ];

  useEffect(() => {
    if (!orderId || !isOpen) return;
    
    const q = query(
      collection(db, "orders", orderId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsubscribe();
  }, [orderId, isOpen]);

  const sendMessage = async (e, text = null) => {
    if (e) e.preventDefault();
    const msg = text || newMessage;
    if (!msg.trim() || !orderId) return;

    try {
      await addDoc(collection(db, "orders", orderId, "messages"), {
        senderId: userData.uid,
        senderName: userData.name || "Rider",
        senderRole: "rider",
        text: msg,
        createdAt: serverTimestamp()
      });
      if (!text) setNewMessage("");
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.95 }} style={{ width: "400px", height: "80vh", background: "#fff", borderRadius: "16px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            
            {/* Header */}
            <div style={{ background: "#1a1a2e", color: "#fff", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px" }}>Order Chat 💬</h3>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={20} /></button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: "15px", overflowY: "auto", background: "#f9f9f9", display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.length === 0 && <p style={{ textAlign: "center", color: "#888", fontSize: "14px", marginTop: "20px" }}>Chat with the customer or restaurant.</p>}
              
              {messages.map((msg) => {
                const isMe = msg.senderRole === "rider";
                return (
                  <div key={msg.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                    <div style={{ background: isMe ? "#d70f64" : "#e0e0e0", color: isMe ? "#fff" : "#333", padding: "10px 14px", borderRadius: "15px", borderBottomRightRadius: isMe ? "2px" : "15px", borderBottomLeftRadius: !isMe ? "2px" : "15px" }}>
                      {msg.text}
                    </div>
                    <small style={{ fontSize: "10px", color: "#999", display: "block", marginTop: "3px", textAlign: isMe ? "right" : "left" }}>
                      {msg.senderName} ({msg.senderRole})
                    </small>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div style={{ display: "flex", gap: "5px", padding: "10px", overflowX: "auto", background: "#fff", borderTop: "1px solid #eee" }}>
              {cannedReplies.map((reply, idx) => (
                <button 
                  key={idx} 
                  onClick={() => sendMessage(null, reply)}
                  style={{ background: "#f0f0f0", color: "#333", border: "none", padding: "8px 12px", borderRadius: "15px", fontSize: "12px", whiteSpace: "nowrap", cursor: "pointer", fontWeight: "bold" }}
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} style={{ display: "flex", padding: "10px", borderTop: "1px solid #eee", background: "#fff" }}>
              <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid #ddd", outline: "none" }} />
              <button type="submit" style={{ marginLeft: "10px", background: "#d70f64", color: "#fff", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Send size={16} />
              </button>
            </form>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LiveChatModal;