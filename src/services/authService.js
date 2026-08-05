import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

// Inscription d'un utilisateur
export const registerUser = async (email, password, userData) => {
  try {
    // 1. Création du compte dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Enregistrement des données additionnelles dans Firestore (collection users)
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      nom: userData.nom,
      prenom: userData.prenom,
      telephone: userData.telephone,
      role: userData.role, // "etudiant" ou "bailleur"
      dateCreation: new Date()
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Connexion d'un utilisateur
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Récupérer le rôle depuis Firestore pour orienter l'utilisateur après
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userInfo = userDoc.exists() ? userDoc.data() : null;

    return { success: true, user, userInfo };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Déconnexion
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};