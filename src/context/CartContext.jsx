import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantLocation, setRestaurantLocation] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Conflict Modal State
  const [pendingItem, setPendingItem] = useState(null);
  const [pendingRestaurant, setPendingRestaurant] = useState(null);

  // Promo & Wallet State
  const [promoCode, setPromoCode] = useState(null); // { code, discountAmount }
  const [walletUsed, setWalletUsed] = useState(0); // Amount of wallet balance applied

  // Math Calculations
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cartItems]);
  const discount = promoCode ? promoCode.discountAmount : 0;
  
  const total = Math.max(0, subtotal + deliveryFee - discount - walletUsed);

  // Add to Cart with Restaurant Check
  const addToCart = (item, restaurant) => {
    if (cartItems.length > 0 && restaurantId !== restaurant.id) {
      // Trigger conflict modal
      setPendingItem(item);
      setPendingRestaurant(restaurant);
      return false;
    }

    setRestaurantId(restaurant.id);
    setRestaurantName(restaurant.name);
    setRestaurantLocation(restaurant.location || null);
    setDeliveryFee(restaurant.deliveryFee || 0);

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    return true;
  };

  const confirmClearAndAdd = () => {
    if (!pendingItem || !pendingRestaurant) return;
    
    // Clear existing cart
    setCartItems([]);
    setPromoCode(null);
    setWalletUsed(0);

    // Add pending item
    setRestaurantId(pendingRestaurant.id);
    setRestaurantName(pendingRestaurant.name);
    setRestaurantLocation(pendingRestaurant.location || null);
    setDeliveryFee(pendingRestaurant.deliveryFee || 0);
    setCartItems([{ ...pendingItem, quantity: 1 }]);

    // Clear pending state
    setPendingItem(null);
    setPendingRestaurant(null);
  };

  const cancelConflict = () => {
    setPendingItem(null);
    setPendingRestaurant(null);
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => {
      const newCart = prev.filter((i) => i.id !== id);
      if (newCart.length === 0) {
        setRestaurantId(null);
        setRestaurantName("");
        setDeliveryFee(0);
        setPromoCode(null);
        setWalletUsed(0);
      }
      return newCart;
    });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) return removeFromCart(id);
    setCartItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurantId(null);
    setRestaurantName("");
    setDeliveryFee(0);
    setPromoCode(null);
    setWalletUsed(0);
  };

  // Promo Code Logic
  const applyPromoCode = async (code) => {
    if (code.toUpperCase() === "WELCOME50") {
      setPromoCode({ code: "WELCOME50", discountAmount: 100 });
      return { success: true, message: "Promo applied: Rs 100 off!" };
    }

    try {
      // Check Firestore for dynamic vouchers
      const q = query(collection(db, "vouchers"), where("code", "==", code.toUpperCase()), where("isActive", "==", true));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, message: "Invalid or expired promo code." };
      }

      const voucher = querySnapshot.docs[0].data();
      
      if (subtotal < voucher.minOrder) {
        return { success: false, message: `Minimum order of Rs ${voucher.minOrder} required.` };
      }

      let discountAmount = 0;
      if (voucher.type === "percentage") {
        discountAmount = (subtotal * voucher.value) / 100;
        if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
          discountAmount = voucher.maxDiscount;
        }
      } else if (voucher.type === "fixed") {
        discountAmount = voucher.value;
      } else if (voucher.type === "free_delivery") {
        discountAmount = deliveryFee;
      }

      setPromoCode({ code: voucher.code, discountAmount });
      return { success: true, message: `Promo applied: Rs ${discountAmount} off!` };

    } catch (error) {
      console.error("Promo error:", error);
      return { success: false, message: "Failed to apply promo code." };
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems, restaurantId, restaurantName, restaurantLocation, deliveryFee,
      subtotal, discount, walletUsed, total, promoCode,
      addToCart, removeFromCart, updateQuantity, clearCart,
      applyPromoCode, setPromoCode, setWalletUsed,
      pendingItem, pendingRestaurant, confirmClearAndAdd, cancelConflict
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);