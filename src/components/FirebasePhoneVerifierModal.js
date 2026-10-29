import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

// Configuration Firebase
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCwqZASk4uvCZCZidBLL3sobSEQkBxjLBo",
  authDomain: "logeetudiant-3867e.firebaseapp.com",
  projectId: "logeetudiant-3867e",
  storageBucket: "logeetudiant-3867e.firebasestorage.app",
  messagingSenderId: "729723154725",
  appId: "1:729723154725:web:268de33c6676c4bd022acc"
};

const BASE_URL = `https://${FIREBASE_CONFIG.authDomain}`;

const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Vérification Logetudiant</title>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
    }
    #recaptcha-container {
      margin: 10px auto;
      display: flex;
      justify-content: center;
    }
    .status-text {
      color: #003880;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div id="recaptcha-container"></div>
  <div id="status" class="status-text">Sécurisation en cours...</div>

  <script>
    const config = ${JSON.stringify(FIREBASE_CONFIG)};
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    const auth = firebase.auth();
    auth.languageCode = 'fr';

    function post(type, data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
      }
    }

    let verifier = null;
    let confirmationResult = null;

    function setupVerifier() {
      try {
        if (verifier) {
          try { verifier.clear(); } catch(e){}
          verifier = null;
        }
        verifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          size: 'invisible',
          callback: function(token) {
            post('RECAPTCHA_SOLVED', { token: token });
          },
          'expired-callback': function() {
            post('RECAPTCHA_EXPIRED');
          }
        });
        verifier.render().then(function(id) {
          post('VERIFIER_READY', { widgetId: id });
        }).catch(function(err) {
          post('ERROR', { code: err.code, message: err.message });
        });
      } catch (e) {
        post('ERROR', { message: e.message });
      }
    }

    window.sendPhoneCode = function(phoneNumber) {
      document.getElementById('status').innerText = 'Envoi du code SMS au ' + phoneNumber + '...';
      if (!verifier) {
        setupVerifier();
      }
      auth.signInWithPhoneNumber(phoneNumber, verifier)
        .then(function(result) {
          confirmationResult = result;
          document.getElementById('status').innerText = 'Code SMS envoyé avec succès !';
          post('CODE_SENT', { verificationId: result.verificationId, phoneNumber: phoneNumber });
        })
        .catch(function(err) {
          document.getElementById('status').innerText = 'Erreur : ' + (err.message || 'Échec');
          setupVerifier(); // Recréer le verifier après une erreur
          post('SEND_ERROR', { code: err.code, message: err.message });
        });
    };

    window.confirmCode = function(code) {
      if (!confirmationResult) {
        post('CONFIRM_ERROR', { message: 'Aucune session de code active.' });
        return;
      }
      confirmationResult.confirm(code)
        .then(function(userCredential) {
          post('CODE_VERIFIED', {
            uid: userCredential.user ? userCredential.user.uid : null,
            phoneNumber: userCredential.user ? userCredential.user.phoneNumber : null
          });
        })
        .catch(function(err) {
          post('CONFIRM_ERROR', { code: err.code, message: err.message });
        });
    };

    // Démarrer la préparation du verifier
    setupVerifier();
  </script>
</body>
</html>
`;

const FirebasePhoneVerifierModal = forwardRef(({ onCodeSent, onVerified, onError }, ref) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Connexion à Firebase...');
  const [pendingPhone, setPendingPhone] = useState(null);
  const webViewRef = useRef(null);
  const isVerifierReady = useRef(false);

  // Méthodes exposées au parent via ref
  useImperativeHandle(ref, () => ({
    // 1. Déclencher l'envoi du code SMS Firebase
    sendVerificationCode: (phone) => {
      setPendingPhone(phone);
      setStatusMessage(`Envoi du code SMS Firebase vers ${phone}...`);
      setLoading(true);
      setVisible(true);

      const run = () => {
        const js = `if (window.sendPhoneCode) { window.sendPhoneCode('${phone}'); } true;`;
        webViewRef.current?.injectJavaScript(js);
      };

      if (isVerifierReady.current) {
        run();
      } else {
        // Laisser 1.2s au WebView pour charger les scripts Firebase
        setTimeout(run, 1200);
      }
    },

    // 2. Confirmer le code saisi par l'utilisateur
    confirmCode: (code) => {
      setStatusMessage('Validation du code en cours...');
      setLoading(true);
      const js = `if (window.confirmCode) { window.confirmCode('${code}'); } true;`;
      webViewRef.current?.injectJavaScript(js);
    },

    // 3. Fermer la modale
    close: () => {
      setVisible(false);
      setLoading(false);
    }
  }));

  // Gestion des messages reçus depuis la WebView
  const handleMessage = (event) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data);

      if (type === 'VERIFIER_READY') {
        isVerifierReady.current = true;
        setLoading(false);
        if (pendingPhone) {
          const js = `window.sendPhoneCode('${pendingPhone}'); true;`;
          webViewRef.current?.injectJavaScript(js);
        }
      } else if (type === 'CODE_SENT') {
        setLoading(false);
        setVisible(false); // Masquer la WebView dès que le SMS est parti
        if (onCodeSent) {
          onCodeSent({
            success: true,
            verificationId: data?.verificationId,
            phoneNumber: data?.phoneNumber,
          });
        }
      } else if (type === 'CODE_VERIFIED') {
        setLoading(false);
        setVisible(false);
        if (onVerified) {
          onVerified({
            success: true,
            uid: data?.uid,
            phoneNumber: data?.phoneNumber,
          });
        }
      } else if (type === 'SEND_ERROR') {
        setLoading(false);
        setVisible(false);
        let errorMsg = data?.message || "Impossible d'envoyer le SMS de vérification.";
        if (data?.code === 'auth/operation-not-allowed') {
          errorMsg = "L'authentification par téléphone n'est pas encore activée dans votre console Firebase.";
        } else if (data?.code === 'auth/invalid-phone-number') {
          errorMsg = "Le format du numéro de téléphone est invalide. Exemple sénégalais : +221 77 123 45 67.";
        } else if (data?.code === 'auth/too-many-requests') {
          errorMsg = "Trop de tentatives d'envoi. Veuillez patienter quelques instants avant de réessayer.";
        }
        if (onError) onError({ code: data?.code, error: errorMsg });
      } else if (type === 'CONFIRM_ERROR') {
        setLoading(false);
        let errorMsg = data?.message || "Code de vérification invalide.";
        if (data?.code === 'auth/invalid-verification-code') {
          errorMsg = "Le code à 6 chiffres saisi est incorrect. Veuillez vérifier le SMS reçu.";
        } else if (data?.code === 'auth/code-expired') {
          errorMsg = "Ce code a expiré. Veuillez demander un nouveau code.";
        }
        if (onError) onError({ code: data?.code, error: errorMsg });
      }
    } catch (e) {
      console.warn('[FirebasePhoneVerifier] Message parse error:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Entête */}
          <View style={styles.header}>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={18} color="#003880" />
              <Text style={styles.badgeText}>Sécurité Firebase</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
            >
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.title}>Vérification du numéro</Text>
          <Text style={styles.subtitle}>{statusMessage}</Text>

          {/* WebView de vérification reCAPTCHA & Firebase */}
          <View style={styles.webviewContainer}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: HTML_CONTENT, baseUrl: BASE_URL }}
              onMessage={handleMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mixedContentMode="always"
              style={styles.webview}
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#003880" />
                <Text style={styles.loadingText}>Validation de sécurité...</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
});

export default FirebasePhoneVerifierModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    color: '#003880',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14,
  },
  webviewContainer: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#003880',
    fontWeight: '600',
  },
});
