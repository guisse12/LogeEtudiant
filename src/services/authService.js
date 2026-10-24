import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

// Inscription d'un utilisateur
export const registerUser = async (email, password, userData) => {
  try {
    // 1. Création du compte dans Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Envoi du lien de confirmation par e-mail
    await sendEmailVerification(user);

    // 3. Enregistrement des données additionnelles dans Firestore (collection users)
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      nom: userData.nom,
      prenom: userData.prenom,
      telephone: userData.telephone,
      role: userData.role, // "etudiant", "bailleur" ou "admin"
      dateCreation: new Date()
    });

    // 4. Déconnexion immédiate pour bloquer l'accès tant que l'e-mail n'est pas vérifié
    await signOut(auth);

    return { 
      success: true, 
      user, 
      message: "Compte créé avec succès. Veuillez consulter vos e-mails pour valider votre compte avant de vous connecter." 
    };
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
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    // Vérification si l'e-mail a été confirmé par lien
    if (!user.emailVerified) {
      // Déconnexion immédiate pour empêcher l'accès non vérifié
      await signOut(auth);
      return { 
        success: false, 
        emailNotVerified: true,
        error: "Veuillez confirmer votre compte via le lien envoyé par e-mail avant de vous connecter." 
      };
    }

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

// Renvoi de l'e-mail de confirmation
export const resendVerificationEmail = async (email, password) => {
  try {
    if (!email || !password) {
      return { success: false, error: "Veuillez renseigner votre email et mot de passe pour renvoyer le lien." };
    }
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    if (user.emailVerified) {
      await signOut(auth);
      return { success: false, alreadyVerified: true, error: "Votre compte est déjà vérifié. Vous pouvez vous connecter normalement." };
    }

    await sendEmailVerification(user);
    await signOut(auth);

    return { 
      success: true, 
      message: "Un nouvel e-mail de confirmation vient de vous être envoyé. Vérifiez votre boîte de réception (et vos courriers indésirables / spams)." 
    };
  } catch (error) {
    await signOut(auth).catch(() => {});
    let errorMessage = "Impossible de renvoyer l'e-mail pour le moment.";
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = "Mot de passe incorrect pour renvoyer le lien de vérification.";
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = "Trop de tentatives récentes. Veuillez patienter quelques minutes avant de réessayer.";
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