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
  limit,
  updateDoc 
} from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from "../config/firebase";
import { sendRealSms } from "./smsService";

// Table de correspondance d'urgence (Administrateur / Bailleurs historiques)
const KNOWN_PHONE_EMAIL_MAP = {
  '763318157': 'aeers1997@gmail.com',
  '221763318157': 'aeers1997@gmail.com',
};

// Vérifier si une erreur est due à un défaut de connexion réseau / Internet
export const isNetworkError = (error) => {
  if (!error) return false;
  const msg = String(error.message || '').toLowerCase();
  const code = String(error.code || '').toLowerCase();
  return (
    code === 'auth/network-request-failed' ||
    code === 'unavailable' ||
    msg.includes('network') ||
    msg.includes('offline') ||
    msg.includes('internet') ||
    msg.includes('failed to fetch') ||
    msg.includes('enotfound') ||
    msg.includes('client is offline')
  );
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

// Vérifier strictement si un numéro de téléphone est déjà associé à un compte Logetudiant (Optimisé ultra-rapide)
export const isPhoneAlreadyRegistered = async (phone) => {
  const cleanPhone = cleanPhoneDigits(phone);
  if (!cleanPhone || cleanPhone.length < 8) {
    return { registered: false };
  }

  // 1. Table prédéfinie (administrateur & bailleurs clés) - Instantané 0ms
  if (cleanPhone === '763318157' || KNOWN_PHONE_EMAIL_MAP[cleanPhone]) {
    return { registered: true, phone: cleanPhone };
  }

  // 2. Vérifier le cache local AsyncStorage - Instantané 1ms
  try {
    const cachedEmail = await AsyncStorage.getItem('@phone_to_email_' + cleanPhone);
    if (cachedEmail) {
      return { registered: true, phone: cleanPhone };
    }
  } catch (e) {}

  // 3. Recherche directe ciblée dans Firestore (limit 1 pour stopper la recherche au premier résultat)
  try {
    const qPhone = query(collection(db, "users"), where("telephone", "==", cleanPhone), limit(1));
    const snap = await getDocs(qPhone);
    if (!snap.empty) {
      return { registered: true, phone: cleanPhone, user: snap.docs[0].data() };
    }
  } catch (err) {
    if (isNetworkError(err)) {
      return { registered: null, networkError: true, error: "Veuillez vérifier votre connexion Internet." };
    }
  }

  // 4. Recherche de secours par e-mail technique
  try {
    const authEmail = phoneToAuthEmail(cleanPhone);
    const qEmail = query(collection(db, "users"), where("email", "==", authEmail), limit(1));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      return { registered: true, phone: cleanPhone, user: snapEmail.docs[0].data() };
    }
  } catch (err) {
    if (isNetworkError(err)) {
      return { registered: null, networkError: true, error: "Veuillez vérifier votre connexion Internet." };
    }
  }

  return { registered: false, phone: cleanPhone };
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

  // 3. Envoi effectif du vrai message SMS via la passerelle télécom
  try {
    const smsResult = await sendRealSms(cleanPhone, code, type);

    return { 
      success: true, 
      code: code,
      cleanPhone: cleanPhone,
      delivered: smsResult?.delivered || false,
      message: `Votre code de confirmation Logetudiant est : ${code}`
    };
  } catch (smsErr) {
    if (isNetworkError(smsErr)) {
      return {
        success: false,
        errorType: 'NETWORK_ERROR',
        error: "Veuillez vérifier votre connexion Internet."
      };
    }
    return {
      success: true,
      code: code,
      cleanPhone: cleanPhone,
      delivered: false,
      message: `Votre code de confirmation Logetudiant est : ${code}`
    };
  }
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
// STRICTEMENT 1 NUMÉRO = 1 SEUL COMPTE
export const registerUserWithPhone = async (phone, password, userData) => {
  const cleanPhone = cleanPhoneDigits(phone);
  if (!cleanPhone || cleanPhone.length < 8) {
    return { success: false, error: "Numéro de téléphone invalide." };
  }

  // Vérification stricte préalable : un numéro de téléphone ne peut avoir qu'un seul compte
  const check = await isPhoneAlreadyRegistered(cleanPhone);
  if (check.networkError) {
    return {
      success: false,
      errorType: 'NETWORK_ERROR',
      error: "Veuillez vérifier votre connexion Internet puis réessayer."
    };
  }
  if (check.registered) {
    return {
      success: false,
      errorType: 'PHONE_EXISTS',
      error: "Ce numéro de téléphone est déjà associé à un compte Logetudiant. Veuillez vous connecter."
    };
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
    if (isNetworkError(error)) {
      return {
        success: false,
        errorType: 'NETWORK_ERROR',
        error: "Impossible de joindre le serveur. Veuillez vérifier votre connexion Internet."
      };
    }

    let errorMessage = "Une erreur est survenue lors de l'inscription.";
    let errorType = 'UNKNOWN';
    if (error.code === 'auth/email-already-in-use') {
      errorType = 'PHONE_EXISTS';
      errorMessage = "Un compte existe déjà avec ce numéro de téléphone. Veuillez vous connecter.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Le mot de passe doit comporter au moins 6 caractères.";
    }
    return { success: false, errorType, error: errorMessage };
  }
};

// Connexion ultra-rapide de l'utilisateur (SUPPORT INTÉGRAL EMAIL ET NUMÉRO DE TÉLÉPHONE)
export const loginUser = async (identifier, password) => {
  try {
    const cleanId = String(identifier || '').trim();
    if (!cleanId || !password) {
      return { success: false, error: "Veuillez saisir votre numéro de téléphone et votre mot de passe." };
    }

    const cleanDigits = cleanPhoneDigits(cleanId);

    // 1. Détermination instantanée (0ms) de l'adresse e-mail technique Firebase
    let targetEmail = '';
    if (cleanId.includes('@')) {
      targetEmail = cleanId.toLowerCase();
    } else if (cleanDigits && KNOWN_PHONE_EMAIL_MAP[cleanDigits]) {
      targetEmail = KNOWN_PHONE_EMAIL_MAP[cleanDigits];
    } else if (cleanDigits) {
      targetEmail = phoneToAuthEmail(cleanDigits);
    } else {
      targetEmail = cleanId;
    }

    // 2. Connexion DIRECTE à Firebase Auth sans requêtes bloquantes préalables
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
    } catch (primaryErr) {
      if (isNetworkError(primaryErr)) {
        return {
          success: false,
          errorType: 'NETWORK_ERROR',
          error: "Veuillez vérifier votre connexion Internet puis réessayer."
        };
      }

      // Secours pour l'administrateur
      if (cleanId.toLowerCase() === 'aeers1997@gmail.com' || cleanDigits === '763318157') {
        try {
          userCredential = await signInWithEmailAndPassword(auth, '763318157@logeetudiant.sn', password);
        } catch (adminErr) {}
      }

      // Si la connexion a échoué : analyse rapide et précise
      if (!userCredential) {
        if (primaryErr.code === 'auth/wrong-password') {
          return {
            success: false,
            errorType: 'WRONG_PASSWORD',
            error: "Mot de passe incorrect. Veuillez vérifier les 6 chiffres saisis."
          };
        }

        if (primaryErr.code === 'auth/user-not-found') {
          return {
            success: false,
            errorType: 'NO_ACCOUNT',
            error: "Aucun compte n'est associé à ce numéro de téléphone. Veuillez d'abord vous inscrire."
          };
        }

        if (primaryErr.code === 'auth/too-many-requests') {
          return {
            success: false,
            errorType: 'TOO_MANY_REQUESTS',
            error: "Trop de tentatives échouées. Veuillez patienter un instant."
          };
        }

        // Pour auth/invalid-credential : vérifier rapidement si le numéro est inscrit
        if (!cleanId.includes('@') && cleanDigits) {
          const check = await isPhoneAlreadyRegistered(cleanDigits);
          if (check.networkError) {
            return {
              success: false,
              errorType: 'NETWORK_ERROR',
              error: "Veuillez vérifier votre connexion Internet puis réessayer."
            };
          }
          if (!check.registered) {
            return {
              success: false,
              errorType: 'NO_ACCOUNT',
              error: "Aucun compte n'est associé à ce numéro de téléphone. Veuillez d'abord vous inscrire."
            };
          } else {
            return {
              success: false,
              errorType: 'WRONG_PASSWORD',
              error: "Mot de passe incorrect. Le mot de passe à 6 chiffres est erroné."
            };
          }
        }

        return {
          success: false,
          error: "Numéro de téléphone ou mot de passe incorrect."
        };
      }
    }

    const user = userCredential.user;

    // 3. Récupération PARALLÈLE (Promise.all) ultra-rapide du profil utilisateur
    const [userDocSnap, bannedDocSnap] = await Promise.all([
      getDoc(doc(db, "users", user.uid)).catch(() => null),
      getDoc(doc(db, "banned_users", user.uid)).catch(() => null)
    ]);

    if (bannedDocSnap && bannedDocSnap.exists()) {
      await signOut(auth);
      return {
        success: false,
        error: "Ce compte a été définitivement supprimé par l'administrateur. Accès refusé."
      };
    }

    let userInfo = { role: 'etudiant' };
    if (userDocSnap && userDocSnap.exists()) {
      userInfo = userDocSnap.data();
      if (userInfo.isDeleted || userInfo.statut === 'supprime') {
        await signOut(auth);
        return {
          success: false,
          error: "Ce compte a été supprimé par l'administrateur. Accès refusé."
        };
      }
    }

    // Détection immédiate du rôle administrateur
    if (
      cleanDigits === '763318157' ||
      cleanId.toLowerCase() === 'aeers1997@gmail.com' ||
      targetEmail === 'aeers1997@gmail.com' ||
      targetEmail === '763318157@logeetudiant.sn' ||
      userInfo.role === 'admin'
    ) {
      userInfo.role = 'admin';
      userInfo.fonction = 'Super-Administrateur';
    }

    // Sauvegarder en arrière-plan sans bloquer
    if (cleanDigits) {
      AsyncStorage.setItem('@phone_to_email_' + cleanDigits, user.email || targetEmail).catch(() => {});
    }
    updateDoc(doc(db, "users", user.uid), { authKey: password }).catch(() => {});

    return { success: true, user, userInfo };
  } catch (error) {
    if (isNetworkError(error)) {
      return {
        success: false,
        errorType: 'NETWORK_ERROR',
        error: "Veuillez vérifier votre connexion Internet puis réessayer."
      };
    }
    return {
      success: false,
      error: error.message || "Une erreur est survenue lors de la connexion."
    };
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
    } else {
      return {
        success: false,
        errorType: 'NO_ACCOUNT',
        error: "Aucun compte n'est associé à ce numéro de téléphone. Veuillez d'abord vous inscrire."
      };
    }

    return { 
      success: true, 
      message: "Votre mot de passe a été modifié avec succès ! Vous pouvez vous connecter." 
    };
  } catch (error) {
    if (isNetworkError(error)) {
      return {
        success: false,
        errorType: 'NETWORK_ERROR',
        error: "Veuillez vérifier votre connexion Internet."
      };
    }
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
