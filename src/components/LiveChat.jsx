import { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { MessageCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LiveChat = ({ orderId }) => {
  const { currentUser, userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // Listen for messages
  useEffect(() => {
    if (!orderId) return;
    const q = query(
      collection(db, "orders", orderId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [orderId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, "orders", orderId, "messages"), {
        senderId: currentUser.uid,
        senderName: userData?.name || "Customer",
        senderRole: "customer",
        text: newMessage,
        createdAt: serverTimestamp()
      });
      setNewMessage("");
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        style={{ position: "fixed", bottom: "30px", right: "30px", background: "#d70f64", color: "#fff", border: "none", borderRadius: "50%", width: "60px", height: "60px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 15px rgba(215, 15, 100, 0.4)", cursor: "pointer", zIndex: 1000 }}
      >
        <MessageCircle size={28} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{ position: "fixed", bottom: "100px", right: "30px", width: "350px", height: "450px", background: "#fff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", zIndex: 1000, overflow: "hidden" }}
          >
            <div style={{ background: "#1a1a2e", color: "#fff", padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px" }}>Order Chat 💬</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ flex: 1, padding: "15px", overflowY: "auto", background: "#f9f9f9", display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.length === 0 && <p style={{ textAlign: "center", color: "#888", fontSize: "14px", marginTop: "20px" }}>Send a message to the restaurant or rider.</p>}
              
              {messages.map((msg) => (
                <div key={msg.id} style={{ alignSelf: msg.senderId === currentUser.uid ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                  <div style={{ background: msg.senderId === currentUser.uid ? "#d70f64" : "#e0e0e0", color: msg.senderId === currentUser.uid ? "#fff" : "#333", padding: "10px 14px", borderRadius: "15px", borderBottomRightRadius: msg.senderId === currentUser.uid ? "2px" : "15px", borderBottomLeftRadius: msg.senderId !== currentUser.uid ? "2px" : "15px" }}>
                    {msg.text}
                  </div>
                  <small style={{ fontSize: "10px", color: "#999", display: "block", marginTop: "3px", textAlign: msg.senderId === currentUser.uid ? "right" : "left" }}>
                    {msg.senderName} ({msg.senderRole})
                  </small>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} style={{ display: "flex", padding: "10px", borderTop: "1px solid #eee", background: "#fff" }}>
              <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid #ddd", outline: "none" }} />
              <button type="submit" style={{ marginLeft: "10px", background: "#d70f64", color: "#fff", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LiveChat;