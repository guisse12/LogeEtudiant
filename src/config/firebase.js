import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Configuration Firebase de votre projet LogeEtudiant
const firebaseConfig = {
  apiKey: "AIzaSyCwqZASk4uvCZCZidBLL3sobSEQkBxjLBo",
  authDomain: "logeetudiant-3867e.firebaseapp.com",
  databaseURL: "https://logeetudiant-3867e-default-rtdb.firebaseio.com",
  projectId: "logeetudiant-3867e",
  storageBucket: "logeetudiant-3867e.firebasestorage.app",
  messagingSenderId: "729723154725",
  appId: "1:729723154725:web:268de33c6676c4bd022acc"
};

// 1. Initialisation sécurisée (évite le crash "duplicate-app" lors des rechargements)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialisation sécurisée de l'Auth avec persistance AsyncStorage (évite le crash "already-initialized")
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (error) {
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };