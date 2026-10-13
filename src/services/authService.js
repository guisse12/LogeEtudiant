import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
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
    let errorMessage = "Une erreur est survenue lors de l'inscription.";

    // Traduction des erreurs Firebase courantes en français
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "Cette adresse e-mail est déjà utilisée.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "Adresse e-mail invalide.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Le mot de passe est trop faible (6 caractères minimum).";
    }

    return { success: false, error: errorMessage };
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
    let errorMessage = "Erreur de connexion.";

    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = "Email ou mot de passe incorrect.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "Format d'email invalide.";
    }

    return { success: false, error: errorMessage };
  }
};

// Réinitialisation du mot de passe (Mot de passe oublié)
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    let errorMessage = "Impossible d'envoyer l'e-mail de réinitialisation.";

    if (error.code === 'auth/user-not-found') {
      errorMessage = "Aucun compte ne correspond à cette adresse e-mail.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "Adresse e-mail invalide.";
    }

    return { success: false, error: errorMessage };
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