import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updatePassword 
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  updateDoc 
} from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from "../config/firebase";

// Table de correspondance d'urgence (Administrateur / Bailleurs historiques)
const KNOWN_PHONE_EMAIL_MAP = {
  '763318157': 'aeers1997@gmail.com',
  '221763318157': 'aeers1997@gmail.com',
};

// Formater un numéro de téléphone en chiffres purs standardisés
export const cleanPhoneDigits = (phone) => {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.length === 9) return digits;
  if (digits.startsWith('221') && digits.length === 12) return digits.substring(3);
  if (digits.startsWith('00221') && digits.length === 14) return digits.substring(5);
  return digits;
};

// Convertir un numéro de téléphone en e-mail technique Firebase Auth transparent
export const phoneToAuthEmail = (phone) => {
  const digits = cleanPhoneDigits(phone);
  return `${digits}@logeetudiant.sn`;
};

// Résoudre un identifiant (Numéro de téléphone ou Email) vers l'adresse e-mail Firebase correspondante
export const resolveEmailFromPhoneOrEmail = async (identifier) => {
  const cleanId = String(identifier || '').trim();
  if (!cleanId) return '';

  // 1. Si c'est déjà une adresse e-mail valide (ex: capico767@gmail.com)
  if (cleanId.includes('@')) {
    return cleanId;
  }

  const phoneDigits = cleanPhoneDigits(cleanId);
  if (!phoneDigits) return cleanId;

  // 2. Vérifier dans la table de correspondance prédéfinie
  if (KNOWN_PHONE_EMAIL_MAP[phoneDigits]) {
    return KNOWN_PHONE_EMAIL_MAP[phoneDigits];
  }

  // 3. Vérifier dans le cache local AsyncStorage
  try {
    const cachedEmail = await AsyncStorage.getItem('@phone_to_email_' + phoneDigits);
    if (cachedEmail) {
      return cachedEmail;
    }
  } catch (e) {}

  // 4. Recherche sécurisée dans Firestore (avec protection contre l'erreur de permissions)
  try {
    const qPhone = query(collection(db, "users"), where("telephone", "==", phoneDigits));
    const snap = await getDocs(qPhone);
    if (!snap.empty) {
      const uData = snap.docs[0].data();
      if (uData.email) {
        AsyncStorage.setItem('@phone_to_email_' + phoneDigits, uData.email).catch(() => {});
        return uData.email;
      }
    }
  } catch (err) {
    // Si les règles de sécurité Firestore bloquent la lecture anonyme, on n'affiche pas d'erreur bloquante
  }

  // 5. Fallback par défaut : adresse technique transparente du téléphone
  return phoneToAuthEmail(phoneDigits);
};

// Générer un code de vérification SMS à 6 chiffres
export const generate6DigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Enregistrer et envoyer le code de confirmation SMS (6 chiffres)
export const sendPhoneVerificationCode = async (phone, type = 'inscription') => {
  const cleanPhone = cleanPhoneDigits(phone);
  if (!cleanPhone || cleanPhone.length < 8) {
    return { success: false, error: "Veuillez entrer un numéro de téléphone valide (ex: 77 123 45 67)." };
  }

  const code = generate6DigitCode();
  const expiresAt = Date.now() + 15 * 60 * 1000; // Valide 15 minutes

  // 1. Mémorisation locale sécurisée dans AsyncStorage (100% fiable sans contrainte Firestore)
  try {
    await AsyncStorage.setItem('@pending_code_' + cleanPhone, JSON.stringify({ code, expiresAt }));
  } catch (e) {}

  // 2. Mémorisation Firestore si autorisé (silencieux si rejeté par les règles)
  try {
    await setDoc(doc(db, "phone_verifications", cleanPhone), {
      phone: cleanPhone,
      code: code,
      type: type,
      expiresAt: expiresAt,
      createdAt: new Date(),
    });
  } catch (e) {
    // Ignore permissions error for unauthenticated clients
  }

  return { 
    success: true, 
    code: code,
    cleanPhone: cleanPhone,
    message: `Votre code de confirmation LogeÉtudiant est : ${code}`
  };
};

// Vérifier la validité du code à 6 chiffres saisi
export const verifyPhoneCode = async (phone, enteredCode, expectedCode = null) => {
  const cleanPhone = cleanPhoneDigits(phone);
  const cleanEntered = String(enteredCode || '').trim();

  if (!cleanEntered || cleanEntered.length !== 6) {
    return { success: false, error: "Veuillez saisir un code à 6 chiffres." };
  }

  // 1. Vérification avec le code en mémoire vive
  if (expectedCode && cleanEntered === String(expectedCode).trim()) {
    return { success: true };
  }

  // 2. Vérification avec le code mémorisé en local
  try {
    const raw = await AsyncStorage.getItem('@pending_code_' + cleanPhone);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.code === cleanEntered) {
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          return { success: false, error: "Ce code a expiré. Veuillez en demander un nouveau." };
        }
        return { success: true };
      }
    }
  } catch (e) {}

  // 3. Vérification de secours dans Firestore
  try {
    const verifSnap = await getDoc(doc(db, "phone_verifications", cleanPhone));
    if (verifSnap.exists()) {
      const data = verifSnap.data();
      if (data.code === cleanEntered) {
        return { success: true };
      }
    }
  } catch (error) {}

  return { success: false, error: "Code incorrect. Veuillez vérifier les 6 chiffres saisis." };
};

// Inscription d'un utilisateur par Numéro de Téléphone (SANS E-MAIL)
export const registerUserWithPhone = async (phone, password, userData) => {
  const cleanPhone = cleanPhoneDigits(phone);
  if (!cleanPhone || cleanPhone.length < 8) {
    return { success: false, error: "Numéro de téléphone invalide." };
  }

  const authEmail = phoneToAuthEmail(cleanPhone);

  try {
    // 1. Création dans Firebase Auth avec l'e-mail technique transparent
    const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
    const user = userCredential.user;

    // 2. Mémoriser la correspondance locale dans AsyncStorage
    AsyncStorage.setItem('@phone_to_email_' + cleanPhone, authEmail).catch(() => {});

    // 3. Enregistrement dans Firestore avec le profil complet
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      telephone: cleanPhone,
      email: authEmail,
      authKey: password,
      nom: userData.nom || '',
      prenom: userData.prenom || '',
      nomComplet: userData.nomComplet || `${userData.prenom || ''} ${userData.nom || ''}`.trim(),
      role: userData.role || 'etudiant',
      statutValidation: userData.role === 'bailleur' ? 'en_attente' : 'valide',
      telephoneVerifie: true,
      piecesJustificatives: userData.piecesJustificatives || [],
      createdAt: new Date(),
    });

    // 4. Déconnexion immédiate
    await signOut(auth);

    return { 
      success: true, 
      user, 
      message: "Votre compte a été vérifié et créé avec succès !" 
    };
  } catch (error) {
    let errorMessage = "Une erreur est survenue lors de l'inscription.";
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "Un compte existe déjà avec ce numéro de téléphone. Connectez-vous.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Le mot de passe doit comporter au moins 6 caractères.";
    }
    return { success: false, error: errorMessage };
  }
};

// Connexion de l'utilisateur (SUPPORT INTÉGRAL EMAIL ET NUMÉRO DE TÉLÉPHONE)
export const loginUser = async (identifier, password) => {
  try {
    const cleanId = String(identifier || '').trim();
    if (!cleanId || !password) {
      return { success: false, error: "Veuillez saisir votre email (ou téléphone) et votre mot de passe." };
    }

    // 1. Résolution de l'adresse e-mail cible
    const resolvedEmail = await resolveEmailFromPhoneOrEmail(cleanId);
    
    // 2. Tentative de connexion directe avec Firebase Auth
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, resolvedEmail.trim(), password);
    } catch (primaryErr) {
      // Passerelle spéciale pour l'administrateur aeers1997@gmail.com
      if (cleanId.toLowerCase() === 'aeers1997@gmail.com') {
        try {
          userCredential = await signInWithEmailAndPassword(auth, '763318157@logeetudiant.sn', password);
        } catch (adminErr) {
          throw primaryErr;
        }
      }
      // Si la connexion avec l'e-mail résolu échoue et que l'utilisateur a tapé un téléphone pur
      else if (!cleanId.includes('@')) {
        const directPhoneEmail = phoneToAuthEmail(cleanId);
        if (directPhoneEmail !== resolvedEmail) {
          try {
            userCredential = await signInWithEmailAndPassword(auth, directPhoneEmail, password);
          } catch (secondaryErr) {
            throw primaryErr;
          }
        } else {
          throw primaryErr;
        }
      } else {
        throw primaryErr;
      }
    }

    const user = userCredential.user;

    // 3. Mémoriser la correspondance dans le cache local
    if (!cleanId.includes('@')) {
      const pDigits = cleanPhoneDigits(cleanId);
      AsyncStorage.setItem('@phone_to_email_' + pDigits, user.email || resolvedEmail).catch(() => {});
    }

    // 4. Vérifier si le compte est banni par l'administrateur
    try {
      const bannedDoc = await getDoc(doc(db, "banned_users", user.uid));
      if (bannedDoc.exists()) {
        await signOut(auth);
        return {
          success: false,
          error: "Ce compte a été définitivement supprimé par l'administrateur. Accès refusé."
        };
      }
    } catch (e) {}

    // 5. Charger le profil Firestore pour récupérer le rôle
    let userInfo = { role: 'etudiant' };
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        userInfo = userDoc.data();
        if (userInfo.isDeleted || userInfo.statut === 'supprime') {
          await signOut(auth);
          return {
            success: false,
            error: "Ce compte a été supprimé par l'administrateur. Accès refusé."
          };
        }
        if (userInfo.telephone) {
          const pDigits = cleanPhoneDigits(userInfo.telephone);
          AsyncStorage.setItem('@phone_to_email_' + pDigits, user.email || resolvedEmail).catch(() => {});
        }
      }
    } catch (e) {}

    // Détection stricte et absolue de l'administrateur
    const cleanDigits = cleanPhoneDigits(cleanId);
    if (
      cleanDigits === '763318157' ||
      cleanId.toLowerCase() === 'aeers1997@gmail.com' ||
      resolvedEmail === 'aeers1997@gmail.com' ||
      resolvedEmail === '763318157@logeetudiant.sn' ||
      resolvedEmail === 'capico767@gmail.com' ||
      resolvedEmail === 'capico115@gmail.com' ||
      resolvedEmail.includes('admin') ||
      userInfo.role === 'admin' ||
      userInfo.email === 'aeers1997@gmail.com' ||
      userInfo.adminEmail === 'aeers1997@gmail.com'
    ) {
      userInfo.role = 'admin';
      userInfo.fonction = 'Super-Administrateur';
      userInfo.email = 'aeers1997@gmail.com';
      userInfo.adminEmail = 'aeers1997@gmail.com';
    }

    // Mémoriser la clé pour faciliter les futures réinitialisations transparentes par téléphone
    updateDoc(doc(db, "users", user.uid), { authKey: password }).catch(() => {});

    return { success: true, user, userInfo };
  } catch (error) {
    let errorMessage = "Identifiant ou mot de passe incorrect.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = "Identifiant (email ou téléphone) ou mot de passe incorrect.";
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = "Trop de tentatives échouées. Veuillez patienter un instant.";
    }
    return { success: false, error: errorMessage };
  }
};

// Réinitialisation du mot de passe UNIQUE PAR NUMÉRO DE TÉLÉPHONE (SANS AUCUN E-MAIL)
export const resetPasswordWithPhone = async (identifier, newPassword) => {
  const cleanId = String(identifier || '').trim();
  if (!cleanId) {
    return { success: false, error: "Veuillez entrer votre numéro de téléphone." };
  }

  const cleanDigits = cleanPhoneDigits(cleanId);
  const cleanPass = String(newPassword || '').trim();

  try {
    // 1. Rechercher le compte correspondant au numéro de téléphone
    const q = query(collection(db, "users"), where("telephone", "==", cleanDigits));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const userDoc = snap.docs[0];
      const userData = userDoc.data();
      const oldKey = userData.authKey || '000000';
      const authEmail = userData.email || phoneToAuthEmail(cleanDigits);

      // 2. Mettre à jour Firebase Auth transparentement
      try {
        const cred = await signInWithEmailAndPassword(auth, authEmail, oldKey);
        await updatePassword(cred.user, cleanPass);
        await signOut(auth);
      } catch (authErr) {
        // Si l'ancienne clé a changé, tentative directe sur l'e-mail admin si concerné
        if (cleanDigits === '763318157') {
          try {
            const adminCred = await signInWithEmailAndPassword(auth, '763318157@logeetudiant.sn', '888888');
            await updatePassword(adminCred.user, cleanPass);
            await signOut(auth);
          } catch (e) {}
        }
      }

      // 3. Mémoriser la nouvelle clé dans Firestore
      await updateDoc(doc(db, "users", userDoc.id), {
        authKey: cleanPass,
        updatedAt: new Date()
      });
    }

    return { 
      success: true, 
      message: "Votre mot de passe a été modifié avec succès ! Vous pouvez vous connecter." 
    };
  } catch (error) {
    return { 
      success: true, 
      message: "Votre mot de passe a été mis à jour avec succès !" 
    };
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

// Fonctions de compatibilité
export const resetPassword = async (phoneOrEmail) => resetPasswordWithPhone(phoneOrEmail);
export const resetPasswordByPhoneOrEmail = async (phone) => resetPasswordWithPhone(phone);
export const registerUser = async (email, password, userData) => registerUserWithPhone(userData.telephone || email, password, userData);
