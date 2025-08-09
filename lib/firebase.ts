// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAEQYUs7EBcgPphyEL5_14gL4x3XtXIm6A",
  authDomain: "dj-booking-tool-cdda5.firebaseapp.com",
  projectId: "dj-booking-tool-cdda5",
  storageBucket: "dj-booking-tool-cdda5.firebasestorage.app",
  messagingSenderId: "1039836675560",
  appId: "1:1039836675560:web:0c95ea483c8dc8f6baf85d",
  measurementId: "G-GLK4WES94Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;