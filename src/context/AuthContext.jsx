import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// --- CHANGE THIS TO YOUR PERSONAL EMAIL ---
const SUPER_ADMIN_EMAIL = "admin@gbpanda.com"; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRole(data.role);
          setRestaurantId(data.restaurantId || null);
          setProfile({ name: data.name, phone: data.phone, address: data.address, location: data.location });
        }
      } else {
        setCurrentUser(null);
        setRole(null);
        setRestaurantId(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email, password, selectedRole, assignedRestaurantId = null, userProfile = null) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // SECURITY LOGIC: If the email is the Super Admin, force role to "admin"
    let finalRole = selectedRole;
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      finalRole = "admin";
    }

    // If they are a restaurant owner, create a pending restaurant
    if (finalRole === "restaurant") {
      const newRestId = `rest_${userCredential.user.uid}`;
      await setDoc(doc(db, "restaurants", newRestId), {
        id: newRestId,
        name: userProfile?.name || "Unnamed Restaurant",
        cuisine: userProfile?.phone || "Various",
        status: "pending", 
        ownerId: userCredential.user.uid,
        createdAt: new Date()
      });
      assignedRestaurantId = newRestId;
    }

    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: email,
      role: finalRole, 
      restaurantId: assignedRestaurantId,
      name: userProfile?.name || "",
      phone: userProfile?.phone || "",
      address: userProfile?.address || "",
      location: userProfile?.location || null,
      createdAt: new Date()
    });
    
    setRole(finalRole);
    setRestaurantId(assignedRestaurantId);
    setProfile(userProfile);
    return userCredential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, role, restaurantId, profile, signup, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);