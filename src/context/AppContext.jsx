import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase/config"; 
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { restaurants as mockRestaurants, menuItems as initialMenu, categories } from "../data/mockData";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // We keep the mock data as the starting point
  const [restaurants, setRestaurants] = useState(mockRestaurants);
  const [menuItems, setMenuItems] = useState(initialMenu);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true); 

  // 1. Listen to Firebase ORDERS
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData); 
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen to Firebase RESTAURANTS
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "restaurants"), (snapshot) => {
      if (!snapshot.empty) {
        const restData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Combine mock data with database data (so we don't lose the initial 4 restaurants)
        setRestaurants([...mockRestaurants, ...restData]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 3. Listen to Firebase MENU ITEMS
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "menuItems"), (snapshot) => {
      if (!snapshot.empty) {
        const menuData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMenuItems([...initialMenu, ...menuData]);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- ACTIONS ---

  const addRestaurant = async (newRestaurant) => {
    try {
      await addDoc(collection(db, "restaurants"), newRestaurant);
    } catch (e) {
      console.error("Error adding restaurant: ", e);
    }
  };

  const addMenuItem = async (newItem) => {
    try {
      await addDoc(collection(db, "menuItems"), newItem);
    } catch (e) {
      console.error("Error adding menu item: ", e);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { status });
    } catch (e) {
      console.error("Error updating status: ", e);
    }
  };

  const placeOrder = async (order) => {
    const displayId = Math.floor(1000 + Math.random() * 9000); 
    const orderData = { ...order, displayId, status: "Pending", createdAt: new Date() };
    try {
      await addDoc(collection(db, "orders"), orderData);
    } catch (e) {
      console.error("Error placing order: ", e);
    }
    return displayId; 
  };

  return (
    <AppContext.Provider value={{
      restaurants, menuItems, categories, orders, loading,
      addRestaurant, addMenuItem, updateOrderStatus, placeOrder
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);