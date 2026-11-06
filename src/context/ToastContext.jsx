import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Render Toasts Here */}
      <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px" }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

// Internal component for individual toast animation
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, X } from "lucide-react";

const ToastItem = ({ toast, onClose }) => {
  const isSuccess = toast.type === "success";
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      style={{
        background: "#fff",
        padding: "12px 20px",
        borderRadius: "10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        borderLeft: `5px solid ${isSuccess ? "#00b894" : "#d63031"}`,
        minWidth: "250px"
      }}
    >
      {isSuccess ? <CheckCircle color="#00b894" size={20} /> : <AlertCircle color="#d63031" size={20} />}
      <span style={{ fontWeight: "600", fontSize: "14px", flex: 1 }}>{toast.message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#999" }}>
        <X size={16} />
      </button>
    </motion.div>
  );
};