import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Listen to ALL Restaurants
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "restaurants"), (snap) => {
      setRestaurants(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Listen to ALL Menu Items
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "menuItems"), (snap) => {
      setMenuItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // 3. Listen to ALL Categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // 4. Listen to ALL Orders
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <AppContext.Provider value={{ restaurants, menuItems, categories, orders, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);