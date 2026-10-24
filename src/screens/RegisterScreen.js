import React, { useState, useRef } from 'react';
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
  cleanPhoneDigits 
} from '../services/authService';

export default function RegisterScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [role, setRole] = useState('etudiant'); // 'etudiant' ou 'bailleur'
  const [justificatifsUris, setJustificatifsUris] = useState([]); // Jusqu'à 5 pièces
  const [loading, setLoading] = useState(false);

  // Modale de vérification par code SMS à 6 chiffres
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);

  // Animation Bannière SMS style Wave
  const [smsBannerVisible, setSmsBannerVisible] = useState(false);
  const [smsBannerCode, setSmsBannerCode] = useState('');
  const bannerAnim = useRef(new Animated.Value(-120)).current;

  const showWaveSmsBanner = (code) => {
    setSmsBannerCode(code);
    setSmsBannerVisible(true);
    Animated.spring(bannerAnim, {
      toValue: Platform.OS === 'ios' ? 45 : 20,
      useNativeDriver: true,
      friction: 6,
    }).start();

    setTimeout(() => {
      hideWaveSmsBanner();
    }, 9000);
  };

  const hideWaveSmsBanner = () => {
    Animated.timing(bannerAnim, {
      toValue: -140,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSmsBannerVisible(false));
  };

  const handleBannerTap = () => {
    if (smsBannerCode) {
      setVerificationCode(smsBannerCode);
    }
    hideWaveSmsBanner();
  };

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

  // Étape 1 : Valider les champs et envoyer le code de confirmation SMS style Wave
  const handleInitiateRegister = async () => {
    const cleanPhone = cleanPhoneDigits(telephone);

    if (!cleanPhone || cleanPhone.length !== 9) {
      Alert.alert("Numéro de téléphone invalide", "Le numéro de téléphone doit comporter exactement 9 chiffres.");
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
      const res = await sendPhoneVerificationCode(cleanPhone, 'inscription');
      if (res.success) {
        setExpectedCode(res.code);
        setVerificationCode('');
        setCodeModalVisible(true);
        // Déclencher le message SMS direct style Wave
        showWaveSmsBanner(res.code);
      } else {
        Alert.alert("Erreur", res.error || "Impossible d'envoyer le code.");
      }
    } catch (err) {
      Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi du code.");
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
              onPress: () => navigation.replace('Login'),
            }
          ]
        );
      } else {
        Alert.alert("Erreur création", result.error || "Impossible de finaliser l'inscription.");
      }
    } catch (error) {
      console.error("Erreur inscription :", error);
      Alert.alert("Erreur", "Une erreur technique est survenue.");
    } finally {
      setVerifying(false);
    }
  };

  // Renvoyer le code SMS style Wave si non reçu
  const handleResendCode = async () => {
    const cleanPhone = cleanPhoneDigits(telephone);
    setResendingCode(true);
    try {
      const res = await sendPhoneVerificationCode(cleanPhone, 'inscription');
      if (res.success) {
        setExpectedCode(res.code);
        showWaveSmsBanner(res.code);
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
      {/* BANNIÈRE SMS DIRECTE FLOTTANTE STYLE WAVE */}
      {smsBannerVisible && (
        <Animated.View 
          style={[
            styles.waveSmsBanner,
            { transform: [{ translateY: bannerAnim }] }
          ]}
        >
          <TouchableOpacity 
            style={styles.waveSmsContent} 
            onPress={handleBannerTap}
            activeOpacity={0.9}
          >
            <View style={styles.waveSmsHeader}>
              <View style={styles.waveAppBadge}>
                <Ionicons name="chatbubble-ellipses" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.waveSenderTitle}>MESSAGE • LogeÉtudiant</Text>
              <Text style={styles.waveTimeText}>À l'instant</Text>
            </View>

            <Text style={styles.waveBodyText}>
              Votre code de confirmation LogeÉtudiant est : <Text style={styles.waveCodeHighlight}>{smsBannerCode}</Text>. Ne le partagez avec personne.
            </Text>
            <Text style={styles.waveTapHint}>👉 Touchez pour copier et insérer le code</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

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
        <Text style={styles.subtitle}>Rejoignez la communauté LogeÉtudiant Sénégal</Text>

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
            style={[styles.roleButton, role === 'bailleur' && styles.roleActive]}
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
          <Ionicons name="person-outline" size={19} color="#1E40AF" style={styles.inputIcon} />
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
          <Ionicons name="person-outline" size={19} color="#1E40AF" style={styles.inputIcon} />
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
          <Ionicons name="call-outline" size={19} color="#1E40AF" style={styles.inputIcon} />
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
          <Ionicons name="lock-closed-outline" size={19} color="#1E40AF" style={styles.inputIcon} />
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
              <Ionicons name="shield-checkmark-outline" size={20} color="#1E40AF" style={{ marginRight: 6 }} />
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

      {/* MODALE DE VÉRIFICATION DU CODE SMS À 6 CHIFFRES */}
      <Modal visible={codeModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalBar} />

            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconBox}>
                <Ionicons name="phone-portrait-outline" size={24} color="#1E40AF" />
              </View>
              <TouchableOpacity 
                style={styles.modalCloseBtn} 
                onPress={() => setCodeModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Confirmation du compte</Text>
            <Text style={styles.modalDesc}>
              Un code à 6 chiffres a été envoyé au <Text style={{ fontWeight: 'bold' }}>{telephone}</Text>. Saisissez-le ci-dessous pour activer votre compte.
            </Text>

            {/* CHAMP CODE À 6 CHIFFRES */}
            <View style={[styles.inputContainer, { marginTop: 8 }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#1E40AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { letterSpacing: 8, fontSize: 20, fontWeight: 'bold', textAlign: 'center' }]}
                placeholder="208341"
                placeholderTextColor="#94A3B8"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
              />
            </View>

            {/* BOUTON CONFIRMER LE CODE */}
            <TouchableOpacity 
              style={styles.modalActionBtn} 
              onPress={handleConfirmCodeAndRegister}
              disabled={verifying}
              activeOpacity={0.85}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalActionBtnText}>Confirmer et activer mon compte</Text>
              )}
            </TouchableOpacity>

            {/* BOUTON RENVOYER LE CODE */}
            <TouchableOpacity 
              style={{ alignSelf: 'center', marginTop: 12, padding: 6 }} 
              onPress={handleResendCode}
              disabled={resendingCode}
            >
              {resendingCode ? (
                <ActivityIndicator color="#1E40AF" size="small" />
              ) : (
                <Text style={{ color: '#1E40AF', fontSize: 13, fontWeight: '700' }}>
                  Renvoyer un nouveau code
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancelBtn} 
              onPress={() => setCodeModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    color: '#0F172A', 
    textAlign: 'center', 
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#64748B', 
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
    backgroundColor: '#1E40AF',
    shadowColor: '#1E40AF',
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
    color: '#1E40AF', 
  },
  bailleurDesc: { 
    fontSize: 12, 
    color: '#475569', 
    marginBottom: 12, 
    lineHeight: 18 
  },
  filePickerBtn: { 
    flexDirection: 'row',
    backgroundColor: '#1E40AF',
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
    backgroundColor: '#1E40AF',
    paddingVertical: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 6,
    shadowColor: '#1E40AF',
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
    color: '#1E40AF',
    fontWeight: '700',
  },

  /* Notification SMS style Wave */
  waveSmsBanner: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    zIndex: 9999,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  waveSmsContent: {},
  waveSmsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  waveAppBadge: {
    backgroundColor: '#1E40AF',
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  waveSenderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    flex: 1,
    letterSpacing: 0.5,
  },
  waveTimeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  waveBodyText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  waveCodeHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#60A5FA',
    letterSpacing: 1.5,
  },
  waveTapHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    fontStyle: 'italic',
  },

  /* Modale Code 6 chiffres */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalActionBtn: {
    backgroundColor: '#1E40AF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});
