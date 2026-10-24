import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase/config"; 
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { restaurants as mockRestaurants, menuItems as initialMenu, categories } from "../data/mockData";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [restaurants, setRestaurants] = useState(mockRestaurants);
  const [menuItems, setMenuItems] = useState(initialMenu);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true); // 1. Added loading state

  // 2. Listen to Firebase Orders in real-time
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData); 
      setLoading(false); // 3. Turn off loading when data arrives
    }, (error) => {
      console.error("Error fetching orders: ", error);
      setLoading(false); // Turn off loading even if there's an error
    });

    return () => unsubscribe();
  }, []);

  // 3. Add Restaurant (Admin)
  const addRestaurant = async (newRestaurant) => {
    try {
      const docRef = await addDoc(collection(db, "restaurants"), newRestaurant);
      setRestaurants([...restaurants, { ...newRestaurant, id: docRef.id }]);
    } catch (e) {
      console.error("Error adding restaurant: ", e);
    }
  };

  // 4. Add Menu Item (Restaurant)
  const addMenuItem = async (newItem) => {
    try {
      const docRef = await addDoc(collection(db, "menuItems"), newItem);
      setMenuItems([...menuItems, { ...newItem, id: docRef.id }]);
    } catch (e) {
      console.error("Error adding menu item: ", e);
    }
  };

  // 5. Update Order Status (Restaurant, Rider, Admin)
  const updateOrderStatus = async (id, status) => {
    try {
      const orderRef = doc(db, "orders", id);
      await updateDoc(orderRef, { status });
    } catch (e) {
      console.error("Error updating status: ", e);
    }
  };

  // 6. Place New Order (Customer)
  const placeOrder = async (order) => {
    const displayId = Math.floor(1000 + Math.random() * 9000); 
    
    const orderData = { 
      ...order, 
      displayId: displayId, 
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
    // 4. Added loading to the Provider value
    <AppContext.Provider value={{
      restaurants, menuItems, categories, orders, loading, 
      addRestaurant, addMenuItem, updateOrderStatus, placeOrder
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);