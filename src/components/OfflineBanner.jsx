import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: "#d63031", color: "#fff", padding: "12px",
            display: "flex", justifyContent: "center", alignItems: "center",
            gap: "10px", zIndex: 9999, fontWeight: "bold"
          }}
        >
          <WifiOff size={20} /> You are currently offline. Please check your connection.
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;