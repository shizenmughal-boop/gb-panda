import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { ShieldAlert, LogOut } from "lucide-react";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userProfile, loading, logout, getHomeRouteForRole } = useAuth();
  const location = useLocation();

  // 1. Wait for Auth & Profile to initialize
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f4f7f6" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          🐼
        </motion.div>
        <h2 style={{ marginTop: "20px", color: "#d70f64" }}>Loading Secure Session...</h2>
      </div>
    );
  }

  // 2. Not logged in -> Redirect to Auth
  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. Account Banned -> Lockout
  if (userProfile?.isBanned) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: "#fff5f5", textAlign: "center", padding: "20px" }}>
        <ShieldAlert size={80} color="#d63031" style={{ marginBottom: "20px" }} />
        <h1 style={{ fontSize: "28px", margin: "0 0 10px 0", color: "#d63031" }}>Account Suspended 🚫</h1>
        <p style={{ color: "#666", maxWidth: "400px", marginBottom: "30px" }}>
          Your account has been suspended by the GB Panda Admin team. Please contact support for assistance.
        </p>
        <button onClick={logout} style={{ background: "#d63031", color: "#fff", padding: "12px 25px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", display: "flex", gap: "10px" }}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    );
  }

  // 4. Wrong Role -> Redirect to their correct dashboard
  if (allowedRoles && !allowedRoles.includes(userProfile?.role)) {
    return <Navigate to={getHomeRouteForRole(userProfile?.role)} replace />;
  }

  // 5. Authorized -> Render children
  return children;
};

export default ProtectedRoute;