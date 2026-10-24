import { motion } from "framer-motion";

const CategoryCard = ({ category }) => {
  return (
    <motion.div
      className="category-card"
      style={{
        background: category.color,
        transformStyle: "preserve-3d",
        perspective: "1000px",
        cursor: "pointer"
      }}
      whileHover={{
        scale: 1.05,
        rotateY: 15,
        rotateX: 10,
        z: 50,
        boxShadow: "0 15px 30px rgba(0,0,0,0.15)"
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="category-icon" style={{ transform: "translateZ(30px)" }}>
        {category.icon}
      </div>
      <p style={{ transform: "translateZ(20px)" }}>{category.name}</p>
    </motion.div>
  );
};

export default CategoryCard;