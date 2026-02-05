
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAfRSeOfopZSbbN5X18hTz-HNIGe7pXaWQ",
  authDomain: "nami-165f0.firebaseapp.com",
  projectId: "nami-165f0",
  storageBucket: "nami-165f0.firebasestorage.app",
  messagingSenderId: "84431241579",
  appId: "1:84431241579:web:c2b123cc69a2825adbcc2e",
  measurementId: "G-PQSWM0QZ5N"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
