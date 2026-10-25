import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, role } = useAuth();

  // If not logged in, send to auth page
  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  // If logged in but wrong role, send to home
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;