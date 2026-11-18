import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// Configuration de l'affichage des notifications locales quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const EXPO_PROJECT_ID = 'a2e4b902-d4ed-4b0c-8cf9-5a1bd73e68b6';

/**
 * Enregistre le token de notification Push pour l'utilisateur connecté
 * et configure le canal Android officiel
 */
export const registerForPushNotificationsAsync = async (userId) => {
  let token = null;

  try {
    // 1. Configuration du canal Android haute priorité
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications Logetudiant',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#003880',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    // 2. Vérification des permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PUSH] Permission de notification refusée par l\'utilisateur');
      return null;
    }

    // 3. Récupération du token Expo Push
    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });
    token = pushTokenData?.data;

    if (token) {
      await AsyncStorage.setItem('@expo_push_token', token);

      // Si l'utilisateur est identifié, on enregistre le token dans son profil Firestore
      const targetUid = userId || auth.currentUser?.uid;
      if (targetUid) {
        try {
          const userRef = doc(db, 'users', targetUid);
          await updateDoc(userRef, {
            pushToken: token,
            lastTokenUpdate: serverTimestamp(),
          });
          console.log(`[PUSH] Token enregistré pour l'utilisateur ${targetUid}`);
        } catch (dbErr) {
          console.log('[PUSH] Enregistrement token Firestore en attente :', dbErr.message);
        }
      }
    }
  } catch (error) {
    console.log('[PUSH] Erreur lors de l\'enregistrement des notifications :', error.message);
  }

  return token;
};

/**
 * Envoie une notification Push via les serveurs d'Expo
 * @param {string} pushToken - Token Expo du destinataire
 * @param {object} payload - { title, body, data }
 */
export const sendExpoPushNotification = async (pushToken, { title, body, data = {} }) => {
  if (!pushToken || typeof pushToken !== 'string' || !pushToken.startsWith('ExponentPushToken[')) {
    return false;
  }

  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title: title || 'Logetudiant',
      body: body || '',
      data: data,
      channelId: 'default',
      priority: 'high',
    };

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await res.json();
    return result?.data?.status === 'ok';
  } catch (error) {
    console.log('[PUSH] Erreur envoi Expo Push :', error.message);
    return false;
  }
};

/**
 * Enregistre une notification dans la collection Firestore de l'utilisateur
 */
export const createInAppNotification = async ({
  userId,
  title,
  body,
  type = 'general',
  data = {},
}) => {
  if (!userId) return null;

  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      body,
      type, // 'chat' | 'bailleur_status' | 'new_property' | 'new_coloc' | 'general'
      data,
      read: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.log('[NOTIFICATION] Erreur création in-app :', error.message);
    return null;
  }
};

/**
 * Envoi complet : crée la notification interne (Cloche) ET envoie le Push sur le téléphone
 * @param {object} options - { userId, title, body, type, data }
 */
export const sendAppNotification = async ({
  userId,
  title,
  body,
  type = 'general',
  data = {},
}) => {
  if (!userId) return false;

  // 1. Créer la notification interne (Cloche 🔔)
  await createInAppNotification({ userId, title, body, type, data });

  // 2. Chercher le pushToken de l'utilisateur pour le push natif
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const token = userData.pushToken;
      if (token) {
        await sendExpoPushNotification(token, { title, body, data });
      }
    }
  } catch (err) {
    console.log('[NOTIFICATION] Erreur récupération token destinataire :', err.message);
  }

  return true;
};

/**
 * Diffuse une notification à tous les étudiants (ex: nouveau logement ou nouvelle colocation)
 */
export const broadcastNotification = async ({
  title,
  body,
  type = 'new_property',
  data = {},
  targetUniversiteId = null,
}) => {
  try {
    // 1. Ajouter une notification publique ('all') pour la cloche de tous les utilisateurs
    await addDoc(collection(db, 'notifications'), {
      userId: 'all',
      title,
      body,
      type,
      data,
      read: false,
      createdAt: serverTimestamp(),
    });

    // 2. Envoi du push aux utilisateurs étudiants inscrits
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'etudiant'));
    const snapshot = await getDocs(usersQuery);

    const pushPromises = [];
    snapshot.forEach((userSnap) => {
      const uData = userSnap.data();
      if (uData.pushToken) {
        pushPromises.push(
          sendExpoPushNotification(uData.pushToken, { title, body, data })
        );
      }
    });

    if (pushPromises.length > 0) {
      await Promise.allSettled(pushPromises);
    }
    return true;
  } catch (error) {
    console.log('[NOTIFICATION] Erreur broadcast :', error.message);
    return false;
  }
};

/**
 * Écoute en temps réel les notifications d'un utilisateur (cloche 🔔 et badge)
 * @param {string} userId - UID de l'utilisateur
 * @param {function} callback - Appelé avec { notifications, unreadCount }
 */
export const subscribeToUserNotifications = (userId, callback) => {
  if (!userId) {
    callback({ notifications: [], unreadCount: 0 });
    return () => {};
  }

  const q = query(
    collection(db, 'notifications'),
    where('userId', 'in', [userId, 'all']),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifs = [];
      let unread = 0;

      snapshot.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() };
        notifs.push(item);
        if (!item.read) {
          unread++;
        }
      });

      callback({ notifications: notifs, unreadCount: unread });
    },
    (error) => {
      console.log('[NOTIFICATION] Erreur écoute snapshot :', error.message);
      // Fallback simple si l'index composé n'est pas encore prêt
      const fallbackQ = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      return onSnapshot(fallbackQ, (snap) => {
        const fallbackNotifs = [];
        let fallbackUnread = 0;
        snap.forEach((d) => {
          const item = { id: d.id, ...d.data() };
          fallbackNotifs.push(item);
          if (!item.read) fallbackUnread++;
        });
        callback({ notifications: fallbackNotifs, unreadCount: fallbackUnread });
      });
    }
  );
};

/**
 * Marque une notification spécifique comme lue
 */
export const markNotificationAsRead = async (notificationId) => {
  if (!notificationId) return;
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    console.log('[NOTIFICATION] Erreur marquage lu :', error.message);
  }
};

/**
 * Marque toutes les notifications non lues de l'utilisateur comme lues
 */
export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) return;
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      batch.update(docSnap.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    console.log('[NOTIFICATION] Erreur marquage global lu :', error.message);
  }
};

/**
 * Supprime une notification
 */
export const deleteNotification = async (notificationId) => {
  if (!notificationId) return;
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    console.log('[NOTIFICATION] Erreur suppression notif :', error.message);
  }
};
