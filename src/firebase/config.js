import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Added Auth import

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2QTg8V_gltyTqupU0PWpm5o4C_9-uyb8",
  authDomain: "gb-panda.firebaseapp.com",
  projectId: "gb-panda",
  storageBucket: "gb-panda.firebasestorage.app",
  messagingSenderId: "442262280563",
  appId: "1:442262280563:web:d4faa305a4852ef03e4d06"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app); // Exported Auth