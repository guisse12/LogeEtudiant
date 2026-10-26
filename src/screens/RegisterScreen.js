import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  ActivityIndicator, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  Modal,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { cleanRegistrationNames } from '../utils/nameFormatter';
import { 
  sendPhoneVerificationCode, 
  verifyPhoneCode, 
  registerUserWithPhone,
  cleanPhoneDigits,
  isPhoneAlreadyRegistered 
} from '../services/authService';

export default function RegisterScreen({ navigation, route }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState(route?.params?.prefilledPhone || '');
  const [role, setRole] = useState('etudiant'); // 'etudiant' ou 'bailleur'
  const [justificatifsUris, setJustificatifsUris] = useState([]); // Jusqu'à 5 pièces
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route?.params?.prefilledPhone) {
      setTelephone(route.params.prefilledPhone);
    }
  }, [route?.params?.prefilledPhone]);

  // Modale de vérification par code SMS à 6 chiffres
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [demoCode, setDemoCode] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [verifying, setVerifying] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const otpInputRef = useRef(null);

  // Compte à rebours automatique pour le renvoi de SMS
  useEffect(() => {
    let timer;
    if (codeModalVisible && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [codeModalVisible, countdown]);

  // Choix Appareil photo ou Galerie pour le bailleur
  const handleAddJustificatif = () => {
    if (justificatifsUris.length >= 5) {
      Alert.alert("Limite atteinte", "Vous pouvez ajouter 5 pièces justificatives au maximum.");
      return;
    }

    Alert.alert(
      "Pièce justificative",
      "Transmettez votre pièce d'identité ou titre (CNI, passeport, RCCM...)",
      [
        {
          text: "📷 Prendre une photo",
          onPress: handleTakePhoto,
        },
        {
          text: "📁 Choisir dans la galerie",
          onPress: handlePickFromGallery,
        },
        {
          text: "Annuler",
          style: "cancel",
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission requise", "L'accès à l'appareil photo est nécessaire.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setJustificatifsUris(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de capturer la photo.");
    }
  };

  const handlePickFromGallery = async () => {
    const remainingSlots = 5 - justificatifsUris.length;
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission requise", "L'accès à la galerie photo est nécessaire.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map(asset => asset.uri);
        setJustificatifsUris(prev => [...prev, ...newUris]);
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les photos.");
    }
  };

  const handleRemoveJustificatif = (indexToRemove) => {
    setJustificatifsUris(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Étape 1 : Valider les champs et envoyer le code de confirmation par message
  const handleInitiateRegister = async () => {
    const cleanPhone = cleanPhoneDigits(telephone);

    if (!cleanPhone || cleanPhone.length !== 9) {
      Alert.alert("Numéro de téléphone invalide", "Le numéro de téléphone doit comporter exactement 9 chiffres (ex: 77 123 45 67).");
      return;
    }

    if (!prenom.trim()) {
      Alert.alert("Prénom requis", "Veuillez renseigner votre prénom (maximum 20 lettres).");
      return;
    }

    if (!nom.trim()) {
      Alert.alert("Nom requis", "Veuillez renseigner votre nom (maximum 15 lettres).");
      return;
    }

    if (!password || password.length !== 6) {
      Alert.alert("Mot de passe invalide", "Le mot de passe doit comporter exactement 6 chiffres.");
      return;
    }

    if (role === 'bailleur' && justificatifsUris.length === 0) {
      Alert.alert(
        "Justificatif requis", 
        "En tant que bailleur, vous devez ajouter au moins un document justificatif (CNI, titre de propriété...) pour valider votre compte."
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Contrôle strict d'unicité : 1 numéro de téléphone = 1 et 1 seul compte Logetu
      const checkResult = await isPhoneAlreadyRegistered(cleanPhone);
      
      if (checkResult.networkError) {
        Alert.alert("Connexion impossible", "Veuillez vérifier votre connexion Internet puis réessayer.");
        setLoading(false);
        return;
      }

      if (checkResult.registered) {
        setLoading(false);
        Alert.alert(
          "Numéro déjà enregistré",
          `Le numéro +221 ${cleanPhone} est déjà associé à un compte Logetu.\n\nChaque numéro de téléphone ne peut avoir qu'un seul et unique compte.`,
          [
            {
              text: "Se connecter",
              onPress: () => navigation.navigate('Login', { prefilledPhone: cleanPhone }),
            },
            {
              text: "Modifier le numéro",
              style: "cancel",
            }
          ]
        );
        return;
      }

      // 2. Envoi du code SMS de vérification
      const res = await sendPhoneVerificationCode(cleanPhone, 'inscription');
      if (res.success) {
        setExpectedCode(res.code);
        setVerificationCode('');
        setDemoCode(!res.delivered ? res.code : null);
        setCountdown(30);
        setCodeModalVisible(true);
        setTimeout(() => otpInputRef.current?.focus(), 350);
      } else {
        if (res.errorType === 'NETWORK_ERROR') {
          Alert.alert("Connexion impossible", "Veuillez vérifier votre connexion Internet.");
        } else {
          Alert.alert("Erreur", res.error || "Impossible d'envoyer le code.");
        }
      }
    } catch (err) {
      console.error("Erreur register initiate :", err);
      Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi du code. Veuillez vérifier votre connexion Internet.");
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Vérification du code 6 chiffres et création effective du compte
  const handleConfirmCodeAndRegister = async () => {
    const cleanPhone = cleanPhoneDigits(telephone);
    const cleanCode = verificationCode.trim();

    if (cleanCode.length !== 6) {
      Alert.alert("Code incomplet", "Veuillez saisir les 6 chiffres du code de confirmation.");
      return;
    }

    setVerifying(true);
    try {
      const verif = await verifyPhoneCode(cleanPhone, cleanCode, expectedCode);
      if (!verif.success) {
        Alert.alert("Code incorrect", verif.error || "Le code saisi est invalide.");
        setVerifying(false);
        return;
      }

      // Nettoyer et dédoublonner le prénom et le nom
      const { prenom: finalPrenom, nom: finalNom, nomComplet: finalNomComplet } = cleanRegistrationNames(prenom, nom);

      // Créer le compte avec le téléphone
      const result = await registerUserWithPhone(cleanPhone, password, {
        nom: finalNom,
        prenom: finalPrenom,
        nomComplet: finalNomComplet,
        role: role,
        piecesJustificatives: justificatifsUris,
      });

      if (result.success) {
        setCodeModalVisible(false);
        Alert.alert(
          "Inscription réussie 🎉", 
          `Votre compte a été vérifié et créé avec succès !\n\nVous pouvez maintenant vous connecter avec votre numéro de téléphone ${cleanPhone}.`,
          [
            {
              text: "Se connecter",
              onPress: () => navigation.replace('Login', { prefilledPhone: cleanPhone }),
            }
          ]
        );
      } else {
        if (result.errorType === 'PHONE_EXISTS') {
          Alert.alert(
            "Compte déjà existant",
            "Ce numéro de téléphone est déjà associé à un compte. Veuillez vous connecter.",
            [
              {
                text: "Se connecter",
                onPress: () => {
                  setCodeModalVisible(false);
                  navigation.replace('Login', { prefilledPhone: cleanPhone });
                }
              }
            ]
          );
        } else if (result.errorType === 'NETWORK_ERROR') {
          Alert.alert("Connexion impossible", "Veuillez vérifier votre connexion Internet puis réessayer.");
        } else {
          Alert.alert("Erreur création", result.error || "Impossible de finaliser l'inscription.");
        }
      }
    } catch (error) {
      console.error("Erreur inscription :", error);
      Alert.alert("Erreur", "Une erreur technique est survenue. Veuillez vérifier votre connexion.");
    } finally {
      setVerifying(false);
    }
  };

  // Renvoyer le code par message si non reçu
  const handleResendCode = async () => {
    if (countdown > 0) return;
    const cleanPhone = cleanPhoneDigits(telephone);
    setResendingCode(true);
    try {
      const res = await sendPhoneVerificationCode(cleanPhone, 'inscription');
      if (res.success) {
        setExpectedCode(res.code);
        setVerificationCode('');
        setDemoCode(!res.delivered ? res.code : null);
        setCountdown(30);
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible de renvoyer le code.");
    } finally {
      setResendingCode(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* LOGO PARFAITEMENT DÉTOURÉ & AGRANDI EN HAUTE DÉFINITION */}
        <View style={styles.logoWrapper}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </View>

        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez la communauté Logetu Sénégal</Text>

        {/* SÉLECTEUR DE RÔLE MODERNE */}
        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[styles.roleButton, role === 'etudiant' && styles.roleActive]}
            onPress={() => setRole('etudiant')}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="school-outline" 
              size={18} 
              color={role === 'etudiant' ? '#fff' : '#475569'} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.roleText, role === 'etudiant' && styles.roleTextActive]}>Étudiant</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleButton, role === 'bailleur' && { backgroundColor: '#E8A008' }]}
            onPress={() => setRole('bailleur')}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="home-outline" 
              size={18} 
              color={role === 'bailleur' ? '#fff' : '#475569'} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.roleText, role === 'bailleur' && styles.roleTextActive]}>Bailleur</Text>
          </TouchableOpacity>
        </View>

        {/* CHAMP PRÉNOM */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={19} color="#003880" style={styles.inputIcon} />
          <TextInput 
            style={styles.inputField} 
            placeholder="Prénom" 
            placeholderTextColor="#94A3B8"
            value={prenom} 
            onChangeText={setPrenom}
            maxLength={20}
          />
        </View>

        {/* CHAMP NOM */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={19} color="#003880" style={styles.inputIcon} />
          <TextInput 
            style={styles.inputField} 
            placeholder="Nom" 
            placeholderTextColor="#94A3B8"
            value={nom} 
            onChangeText={setNom}
            maxLength={15}
          />
        </View>

        {/* CHAMP NUMÉRO DE TÉLÉPHONE (9 CHIFFRES UNIQUEMENT) */}
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={19} color="#003880" style={styles.inputIcon} />
          <TextInput 
            style={styles.inputField} 
            placeholder="Numéro de téléphone" 
            placeholderTextColor="#94A3B8"
            value={telephone} 
            onChangeText={setTelephone} 
            keyboardType="numeric"
            maxLength={9}
          />
        </View>

        {/* CHAMP MOT DE PASSE (6 CHIFFRES AVEC ŒIL) */}
        <View style={styles.passwordContainer}>
          <Ionicons name="lock-closed-outline" size={19} color="#003880" style={styles.inputIcon} />
          <TextInput 
            style={styles.passwordInput} 
            placeholder="Mot de passe (6 chiffres)" 
            placeholderTextColor="#94A3B8"
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry={!showPassword}
            keyboardType="numeric"
            maxLength={6}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)} 
            style={styles.eyeIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={22} 
              color="#64748B" 
            />
          </TouchableOpacity>
        </View>

        {/* SECTION SPÉCIFIQUE BAILLEUR */}
        {role === 'bailleur' && (
          <View style={styles.bailleurCard}>
            <View style={styles.bailleurHeader}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#003880" style={{ marginRight: 6 }} />
              <Text style={styles.bailleurTitle}>Vérification du profil Bailleur</Text>
            </View>
            <Text style={styles.bailleurDesc}>
              Fournissez au moins une pièce justificative (CNI, passeport, titre de propriété) pour authentifier votre identité.
            </Text>
            
            <TouchableOpacity style={styles.filePickerBtn} onPress={handleAddJustificatif}>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.filePickerText}>
                Ajouter un document ({justificatifsUris.length}/5)
              </Text>
            </TouchableOpacity>

            {/* Aperçu des pièces ajoutées */}
            {justificatifsUris.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                {justificatifsUris.map((uri, index) => (
                  <View key={index} style={styles.thumbContainer}>
                    <Image source={{ uri }} style={styles.thumbImage} />
                    <TouchableOpacity 
                      style={styles.removeBtn} 
                      onPress={() => handleRemoveJustificatif(index)}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* BOUTON S'INSCRIRE AVEC CODE 6 CHIFFRES */}
        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleInitiateRegister} 
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.submitBtnContent}>
              <Text style={styles.submitBtnText}>S'inscrire</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </View>
          )}
        </TouchableOpacity>

        {/* LIEN VERS CONNEXION */}
        <View style={styles.loginLinkContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>
              Vous avez déjà un compte ? <Text style={styles.loginLinkHighlight}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MODALE DE VÉRIFICATION DU CODE SMS ULTRA-PROFESSIONNELLE */}
      <Modal 
        visible={codeModalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setCodeModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalBar} />

            <View style={styles.modalTopRow}>
              <View style={styles.modalBadgeCircle}>
                <Ionicons name="shield-checkmark" size={26} color="#003880" />
              </View>
              <TouchableOpacity 
                style={styles.modalCloseTopRight} 
                onPress={() => setCodeModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitleCentered}>Vérification du compte</Text>
            <Text style={styles.modalDescCentered}>
              Saisissez le code à 6 chiffres envoyé au{'\n'}
              <Text style={styles.phoneHighlight}>+221 {telephone}</Text>
            </Text>

            {/* 6 CELLULES DU CODE PIN OTP ULTRA-PROFESSIONNEL */}
            <TouchableOpacity 
              style={styles.otpContainer} 
              activeOpacity={1} 
              onPress={() => otpInputRef.current?.focus()}
            >
              <TextInput
                ref={otpInputRef}
                value={verificationCode}
                onChangeText={(txt) => {
                  const clean = txt.replace(/[^0-9]/g, '').slice(0, 6);
                  setVerificationCode(clean);
                }}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.hiddenInput}
                autoFocus={true}
              />
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const char = verificationCode[i] || '';
                const isCurrent = verificationCode.length === i;
                const isFilled = char !== '';
                return (
                  <View 
                    key={i} 
                    style={[
                      styles.otpCell,
                      isCurrent && styles.otpCellActive,
                      isFilled && styles.otpCellFilled
                    ]}
                  >
                    <Text style={styles.otpCellText}>{char}</Text>
                  </View>
                );
              })}
            </TouchableOpacity>

            {/* BADGE CODE DÉMO DISCRET EN MODE ATTENTE PASSERELLE */}
            {demoCode ? (
              <TouchableOpacity 
                style={styles.demoCodePill}
                onPress={() => setVerificationCode(demoCode)}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={14} color="#E8A008" style={{ marginRight: 6 }} />
                <Text style={styles.demoCodeText}>
                  Code reçu : <Text style={styles.demoCodeBold}>{demoCode}</Text>  (Toucher pour insérer)
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* COMPTE À REBOURS / RENVOYER UN NOUVEAU CODE */}
            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Renvoyer un nouveau code dans <Text style={styles.countdownNumber}>{countdown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity 
                  onPress={handleResendCode}
                  disabled={resendingCode}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendActiveText}>
                    {resendingCode ? "Envoi en cours..." : "Renvoyer un nouveau code"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* BOUTON CONFIRMER LE CODE */}
            <TouchableOpacity 
              style={[
                styles.modalConfirmBtn, 
                verificationCode.length === 6 ? styles.modalConfirmBtnActive : styles.modalConfirmBtnDisabled
              ]} 
              onPress={handleConfirmCodeAndRegister}
              disabled={verifying || verificationCode.length !== 6}
              activeOpacity={0.85}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={styles.modalConfirmBtnText}>Confirmer et activer mon compte</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancelLink} 
              onPress={() => setCodeModalVisible(false)}
            >
              <Text style={styles.modalCancelLinkText}>Modifier le numéro de téléphone</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 24, 
    backgroundColor: '#F8FAFC', 
    flexGrow: 1, 
    justifyContent: 'center',
    paddingTop: 36,
    paddingBottom: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  logo: {
    width: 140,
    height: 120,
  },
  title: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#003880', // Bleu officiel de l'application
    textAlign: 'center', 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 13, 
    color: '#E8A008', // Ocre doré officiel du logo
    fontWeight: '700',
    textAlign: 'center', 
    marginBottom: 20 
  },
  roleContainer: { 
    flexDirection: 'row', 
    marginBottom: 18, 
    backgroundColor: '#E2E8F0', 
    borderRadius: 12, 
    padding: 4 
  },
  roleButton: { 
    flex: 1, 
    flexDirection: 'row',
    paddingVertical: 11, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 10,
  },
  roleActive: { 
    backgroundColor: '#003880',
    shadowColor: '#003880',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  roleText: { 
    color: '#475569', 
    fontWeight: '700', 
    fontSize: 14 
  },
  roleTextActive: { 
    color: '#FFFFFF' 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  eyeIcon: {
    padding: 6,
  },
  bailleurCard: { 
    backgroundColor: '#EFF6FF', 
    borderWidth: 1.5, 
    borderColor: '#BFDBFE', 
    padding: 16, 
    borderRadius: 14, 
    marginBottom: 16 
  },
  bailleurHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bailleurTitle: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#003880', 
  },
  bailleurDesc: { 
    fontSize: 12, 
    color: '#475569', 
    marginBottom: 12, 
    lineHeight: 18 
  },
  filePickerBtn: { 
    flexDirection: 'row',
    backgroundColor: '#003880',
    paddingVertical: 10, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 10 
  },
  filePickerText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 13 
  },
  previewScroll: { 
    marginTop: 6 
  },
  thumbContainer: { 
    position: 'relative', 
    marginRight: 10 
  },
  thumbImage: { 
    width: 65, 
    height: 65, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#CBD5E1' 
  },
  removeBtn: { 
    position: 'absolute', 
    top: -6, 
    right: -6, 
    backgroundColor: '#EF4444', 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  submitBtn: { 
    backgroundColor: '#003880',
    paddingVertical: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 6,
    shadowColor: '#003880',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 16 
  },
  loginLinkContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  loginLinkText: {
    color: '#64748B',
    fontSize: 14,
  },
  loginLinkHighlight: {
    color: '#E8A008', // Ocre doré officiel du logo
    fontWeight: '800',
  },

  /* Modale Code 6 chiffres Ultra-Professionnelle */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  modalBar: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  modalBadgeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  modalCloseTopRight: {
    position: 'absolute',
    right: 0,
    top: 4,
    padding: 6,
  },
  modalTitleCentered: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalDescCentered: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 8,
  },
  phoneHighlight: {
    fontWeight: '800',
    color: '#003880',
    fontSize: 14,
  },

  /* 6 Cellules OTP Pin */
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  otpCell: {
    width: 46,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  otpCellActive: {
    borderColor: '#003880',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: '#003880',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  otpCellFilled: {
    borderColor: '#003880',
    backgroundColor: '#F0F7FF',
  },
  otpCellText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#003880',
  },

  /* Code démo */
  demoCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 8,
  },
  demoCodeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  demoCodeBold: {
    fontWeight: '800',
    color: '#B45309',
    fontSize: 13,
  },

  /* Compte à rebours renvoi */
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  countdownText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  countdownNumber: {
    color: '#003880',
    fontWeight: '700',
  },
  resendActiveText: {
    fontSize: 13,
    color: '#E8A008',
    fontWeight: '800',
  },

  /* Bouton confirmation */
  modalConfirmBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnActive: {
    backgroundColor: '#003880',
    shadowColor: '#003880',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  modalConfirmBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalCancelLink: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCancelLinkText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
