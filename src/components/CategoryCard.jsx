import { motion } from "framer-motion";

const CategoryCard = ({ category, isSelected, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "20px", borderRadius: "16px", cursor: "pointer",
        background: isSelected ? "#ffe5ec" : "#fff",
        border: isSelected ? "2px solid #d70f64" : "2px solid transparent",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
        transition: "background 0.2s, border 0.2s"
      }}
    >
      <div style={{ fontSize: "40px", marginBottom: "10px" }}>{category.icon}</div>
      <span style={{ fontSize: "14px", fontWeight: "bold", color: isSelected ? "#d70f64" : "#333" }}>
        {category.name}
      </span>
    </motion.div>
  );
};

export default CategoryCard;