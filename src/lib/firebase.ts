import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDbNBy1wQDyqS0IpdDPndXEakrOKN9C5eU",
  authDomain: "resumeluca.firebaseapp.com",
  projectId: "resumeluca",
  storageBucket: "resumeluca.firebasestorage.app",
  messagingSenderId: "518432682268",
  appId: "1:518432682268:web:67238323852e6585600ad9",
  measurementId: "G-3J7S0ZF38Z"
};

// Initialize Firebase for SSR (Server Side Rendering) compatibility
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
