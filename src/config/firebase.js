// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwqZASk4uvCZCZidBLL3sobSEQkBxjLBo",
  authDomain: "logeetudiant-3867e.firebaseapp.com",
  databaseURL: "https://logeetudiant-3867e-default-rtdb.firebaseio.com",
  projectId: "logeetudiant-3867e",
  storageBucket: "logeetudiant-3867e.firebasestorage.app",
  messagingSenderId: "729723154725",
  appId: "1:729723154725:web:268de33c6676c4bd022acc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };