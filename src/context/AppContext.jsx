import { createContext, useContext, useState, useEffect } from "react";
import { db, storage } from "../firebase"; 
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, deleteDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { restaurants as mockRestaurants, menuItems as initialMenu, categories as defaultCategories } from "../data/mockData";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [restaurants, setRestaurants] = useState(mockRestaurants);
  const [menuItems, setMenuItems] = useState(initialMenu);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState(defaultCategories); 
  const [reviews, setReviews] = useState([]);
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

  // 4. Listen to Firebase CATEGORIES
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      if (!snapshot.empty) {
        const catData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories([...defaultCategories, ...catData]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 5. Listen to Firebase REVIEWS
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "reviews"), (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewsData);
    });
    return () => unsubscribe();
  }, []);

  // --- ACTIONS ---

  const addCategory = async (newCategory) => {
    try {
      await addDoc(collection(db, "categories"), newCategory);
    } catch (e) {
      console.error("Error adding category: ", e);
    }
  };

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
      const uploadTask = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Upload timed out. Please try a smaller image.")), 15000)
      );
      await Promise.race([uploadTask, timeoutPromise]);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (e) {
      console.error("Upload Error: ", e);
      alert(e.message); 
      return null;
    }
  };

  const updateOrderStatus = async (id, status, riderId = null) => {
    try {
      const orderRef = doc(db, "orders", id);
      const updateData = { status };
      if (riderId) {
        updateData.riderId = riderId;
      }
      await updateDoc(orderRef, updateData);
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
    const orderData = { ...order, displayId, status: "Pending", createdAt: new Date() };
    try {
      await addDoc(collection(db, "orders"), orderData);
    } catch (e) {
      console.error("Error placing order: ", e);
    }
    return displayId; 
  };

  const toggleFavorite = async (userId, restaurantId, isFavorited) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        favorites: isFavorited ? arrayRemove(restaurantId) : arrayUnion(restaurantId)
      });
    } catch (e) {
      console.error("Error toggling favorite: ", e);
    }
  };

  const addReview = async (review) => {
    try {
      await addDoc(collection(db, "reviews"), {
        ...review,
        createdAt: new Date()
      });
    } catch (e) {
      console.error("Error adding review: ", e);
    }
  };

  const toggleRestaurantStatus = async (restaurantId, isOpen) => {
    try {
      const restRef = doc(db, "restaurants", restaurantId);
      await updateDoc(restRef, { isOpen: isOpen });
    } catch (e) {
      console.error("Error toggling restaurant status: ", e);
    }
  };

  // --- NEW: Rate Rider Function ---
  const rateRider = async (orderId, rating) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { riderRating: Number(rating) });
    } catch (e) {
      console.error("Error rating rider: ", e);
    }
  };

  return (
    <AppContext.Provider value={{
      restaurants, menuItems, categories, orders, reviews, loading,
      addCategory, addRestaurant, addMenuItem, deleteMenuItem, updateMenuItem, 
      updateOrderStatus, updateRiderLocation, placeOrder, uploadImage, 
      toggleFavorite, addReview, toggleRestaurantStatus, rateRider
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);