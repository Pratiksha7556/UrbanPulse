// firebase.ts

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { getDatabase } from "firebase/database"; // Realtime DB

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBWkZB0AICcYvT8RryTRIWX0a3tR7rj6As",
  authDomain: "urbanpulse-1bcda.firebaseapp.com",
  databaseURL: "https://urbanpulse-1bcda-default-rtdb.firebaseio.com",
  projectId: "urbanpulse-1bcda",
  storageBucket: "urbanpulse-1bcda.firebasestorage.app",
  messagingSenderId: "2160764726",
  appId: "1:2160764726:web:9e42259cecbec5f4ff3597",
  measurementId: "G-5DX7DNYW7Q",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getDatabase(app);
export const analytics = getAnalytics(app);

// Export auth functions
export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
};
