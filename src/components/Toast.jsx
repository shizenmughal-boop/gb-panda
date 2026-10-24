import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X } from "lucide-react";

const Toast = ({ message, isVisible, onClose }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            background: "#fff",
            padding: "16px 24px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 9999,
            borderLeft: "6px solid #00b894",
            minWidth: "300px"
          }}
        >
          <CheckCircle color="#00b894" size={24} />
          <p style={{ fontWeight: "600", flex: 1 }}>{message}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#999" }}>
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;