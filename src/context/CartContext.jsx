import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null); // Track which restaurant the cart is from

  const addToCart = (item) => {
    // If cart has items from a different restaurant, clear it first
    if (cart.length > 0 && cart[0].restaurantId !== item.restaurantId) {
      if (!window.confirm("Adding this item will clear your current cart. Continue?")) {
        return;
      }
      setCart([]);
    }
    setRestaurantId(item.restaurantId);

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    const newCart = cart.filter((i) => i.id !== id);
    setCart(newCart);
    if (newCart.length === 0) setRestaurantId(null);
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) return removeFromCart(id);
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => {
    setCart([]);
    setRestaurantId(null);
  };

  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, restaurantId, addToCart, removeFromCart, updateQuantity, clearCart, totalPrice, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);