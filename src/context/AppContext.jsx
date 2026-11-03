import { createContext, useContext, useState, useEffect } from "react";
import { db, storage } from "../firebase/config"; 
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { restaurants as mockRestaurants, menuItems as initialMenu, categories } from "../data/mockData";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
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

  const deleteMenuItem = async (id) => {
    try {
      await deleteDoc(doc(db, "menuItems", id));
    } catch (e) {
      console.error("Error deleting item: ", e);
    }
  };

  const updateMenuItem = async (id, updatedData) => {
    try {
      await updateDoc(doc(db, "menuItems", id), updatedData);
    } catch (e) {
      console.error("Error updating item: ", e);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    try {
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (e) {
      console.error("Error uploading image: ", e);
      return null;
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

  const updateRiderLocation = async (orderId, location) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { riderLocation: location });
    } catch (e) {
      console.error("Error updating rider location: ", e);
    }
  };

  const placeOrder = async (order) => {
    const displayId = Math.floor(1000 + Math.random() * 9000); 
    const orderData = { 
      ...order, 
      displayId, 
      status: "Pending", 
      createdAt: new Date() 
    };
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
      addRestaurant, addMenuItem, deleteMenuItem, updateMenuItem, updateOrderStatus, updateRiderLocation, placeOrder, uploadImage
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);