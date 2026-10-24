import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const NotFound = () => {
  return (
    <div style={{ height: "80vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "20px" }}>
      <motion.div 
        initial={{ scale: 0.5, rotate: -20 }} 
        animate={{ scale: 1, rotate: 0 }} 
        transition={{ type: "spring", stiffness: 200 }}
        style={{ fontSize: "120px", marginBottom: "20px" }}
      >
        🐼
      </motion.div>
      <h1 style={{ fontSize: "48px", color: "#d70f64", marginBottom: "10px" }}>404</h1>
      <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>Oops! Page not found.</h2>
      <p style={{ color: "#666", marginBottom: "30px", maxWidth: "400px" }}>
        Looks like this page ran away with the delivery rider. Let's get you back to the food!
      </p>
      <Link to="/" className="btn-primary" style={{ width: "auto", padding: "12px 30px" }}>
        Back to Home 🏠
      </Link>
    </div>
  );
};

export default NotFound;