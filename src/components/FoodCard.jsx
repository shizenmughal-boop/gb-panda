import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, AlertCircle } from "lucide-react";

const FoodCard = ({ item, restaurant }) => {
  const { addToCart, pendingItem, pendingRestaurant, confirmClearAndAdd, cancelConflict } = useCart();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(item.variations?.[0] || null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  const isClosed = restaurant.isOpen === false || restaurant.isBlocked === true;
  const isOutOfStock = item.inStock === false;

  const handleAddClick = () => {
    if (isClosed) return showToast("This restaurant is currently closed.", "error");
    if (isOutOfStock) return showToast("This item is sold out.", "error");

    // If item has variations or add-ons, open modal
    if ((item.variations && item.variations.length > 0) || (item.addOns && item.addOns.length > 0)) {
      setIsModalOpen(true);
    } else {
      // Direct add
      addToCart(item, restaurant);
    }
  };

  const handleCustomAdd = () => {
    let finalPrice = item.price;
    if (selectedVariation) finalPrice += selectedVariation.price;
    selectedAddOns.forEach(addon => finalPrice += addon.price);

    const customItem = {
      ...item,
      id: `${item.id}_${selectedVariation?.name || "std"}_${Date.now()}`, // Unique ID for customized item
      price: finalPrice,
      name: `${item.name} ${selectedVariation ? `(${selectedVariation.name})` : ""}`,
      selectedAddOns
    };

    const success = addToCart(customItem, restaurant);
    if (success) {
      showToast(`${item.name} added to cart!`, "success");
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <motion.div 
        whileHover={{ y: -5 }}
        style={{ 
          background: "#fff", borderRadius: "12px", overflow: "hidden", 
          boxShadow: "0 4px 15px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" 
        }}
      >
        <div style={{ position: "relative", height: "150px" }}>
          <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isOutOfStock ? 0.5 : 1 }} />
          {isOutOfStock && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ background: "#d63031", color: "#fff", padding: "5px 15px", borderRadius: "20px", fontWeight: "bold" }}>Sold Out</span>
            </div>
          )}
        </div>

        <div style={{ padding: "15px", flex: 1, display: "flex", flexDirection: "column" }}>
          <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>{item.name}</h4>
          <p style={{ margin: "0 0 15px 0", fontSize: "13px", color: "#666", flex: 1 }}>{item.description}</p>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "16px", fontWeight: "bold", color: "#d70f64" }}>Rs {item.price}</span>
            <button 
              onClick={handleAddClick}
              disabled={isClosed || isOutOfStock}
              style={{ 
                background: (isClosed || isOutOfStock) ? "#ccc" : "#d70f64", 
                color: "#fff", border: "none", padding: "8px 16px", borderRadius: "20px", 
                fontWeight: "bold", cursor: (isClosed || isOutOfStock) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "5px"
              }}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>
      </motion.div>

      {/* CUSTOMIZATION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} style={{ background: "#fff", padding: "25px", borderRadius: "16px", width: "400px", maxWidth: "90%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0 }}>Customize {item.name}</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} /></button>
              </div>

              {/* Variations */}
              {item.variations && item.variations.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ fontSize: "14px", marginBottom: "10px", color: "#666" }}>Select Size/Variation</h4>
                  {item.variations.map((v, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", cursor: "pointer" }}>
                      <input type="radio" name="variation" checked={selectedVariation?.name === v.name} onChange={() => setSelectedVariation(v)} />
                      <span style={{ flex: 1 }}>{v.name}</span>
                      <span style={{ fontWeight: "bold" }}>+ Rs {v.price}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Add-ons */}
              {item.addOns && item.addOns.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ fontSize: "14px", marginBottom: "10px", color: "#666" }}>Add-ons</h4>
                  {item.addOns.map((addon, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={selectedAddOns.some(a => a.name === addon.name)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedAddOns([...selectedAddOns, addon]);
                          else setSelectedAddOns(selectedAddOns.filter(a => a.name !== addon.name));
                        }} 
                      />
                      <span style={{ flex: 1 }}>{addon.name}</span>
                      <span style={{ fontWeight: "bold" }}>+ Rs {addon.price}</span>
                    </label>
                  ))}
                </div>
              )}

              <button onClick={handleCustomAdd} style={{ width: "100%", background: "#d70f64", color: "#fff", border: "none", padding: "15px", borderRadius: "10px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
                Add to Cart
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESTAURANT CONFLICT MODAL */}
      <AnimatePresence>
        {pendingItem && pendingRestaurant && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: "#fff", padding: "30px", borderRadius: "16px", width: "400px", maxWidth: "90%", textAlign: "center" }}>
              <AlertCircle size={40} color="#d63031" style={{ margin: "0 auto 15px auto" }} />
              <h3 style={{ margin: "0 0 10px 0" }}>Clear your cart?</h3>
              <p style={{ color: "#666", marginBottom: "20px" }}>
                Your cart contains items from a different restaurant. Would you like to clear it and add items from <strong>{pendingRestaurant.name}</strong> instead?
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={cancelConflict} style={{ flex: 1, padding: "12px", background: "#f0f0f0", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
                <button onClick={confirmClearAndAdd} style={{ flex: 1, padding: "12px", background: "#d63031", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Clear & Add</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FoodCard;