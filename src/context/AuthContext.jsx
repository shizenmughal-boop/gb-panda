import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [restaurantProfile, setRestaurantProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser;
    let unsubscribeRestaurant;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // SUPER ADMIN OVERRIDE
        if (user.email.toLowerCase() === "admin@gbpanda.com") {
          setUserProfile({ uid: user.uid, email: user.email, role: "admin", isSuperAdmin: true });
          setLoading(false);
          return;
        }

        unsubscribeUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = { uid: user.uid, ...docSnap.data() };
            setUserProfile(data);

            // If Restaurant Owner, fetch their restaurant data
            if (data.role === "restaurant" && data.restaurantId) {
              if (unsubscribeRestaurant) unsubscribeRestaurant();
              
              unsubscribeRestaurant = onSnapshot(doc(db, "restaurants", data.restaurantId), (restSnap) => {
                if (restSnap.exists()) {
                  setRestaurantProfile({ id: restSnap.id, ...restSnap.data() });
                }
                setLoading(false); 
              });
            } else {
              setRestaurantProfile(null);
              setLoading(false); 
            }
          } else {
            setUserProfile({ uid: user.uid, email: user.email, role: "customer" });
            setLoading(false);
          }
        });
      } else {
        if (unsubscribeUser) unsubscribeUser();
        if (unsubscribeRestaurant) unsubscribeRestaurant();
        setUserProfile(null);
        setRestaurantProfile(null);
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeRestaurant) unsubscribeRestaurant();
    };
  }, []);

  // Helper for routing
  const getHomeRouteForRole = (role) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "restaurant") return "/restaurant-dashboard";
    if (role === "rider") return "/rider-dashboard";
    return "/";
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, restaurantProfile, login, logout, loading, getHomeRouteForRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);