import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  Alert, 
  ActivityIndicator, 
  Image, 
  Modal, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Animated,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  loginUser, 
  sendPhoneVerificationCode, 
  verifyPhoneCode, 
  resetPasswordWithPhone 
} from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState(''); // Email ou Numéro de téléphone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modale personnalisée Mot de passe oublié
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = Saisie, 2 = Code 6 chiffres + Nouveau mot de passe
  const [forgotCode, setForgotCode] = useState('');
  const [expectedForgotCode, setExpectedForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

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

    // Fermeture automatique après 9 secondes
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
      setForgotCode(smsBannerCode);
    }
    hideWaveSmsBanner();
  };

  const handleLogin = async () => {
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      Alert.alert('Champs requis', 'Veuillez saisir votre email (ou numéro de téléphone) et votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(cleanId, password);

      if (result.success) {
        const role = result.userInfo?.role;
        const cleanDigits = cleanId.replace(/[^0-9]/g, '');
        const isAdmin = 
          role === 'admin' || 
          cleanDigits === '763318157' || 
          cleanId === '763318157' ||
          cleanId.toLowerCase() === 'aeers1997@gmail.com' ||
          cleanId === '763318157@logeetudiant.sn' ||
          cleanId === 'capico767@gmail.com' ||
          cleanId === 'capico115@gmail.com';
        
        // Redirection selon le rôle
        if (isAdmin) {
          navigation.replace('AdminHome');
        } else if (role === 'bailleur') {
          navigation.replace('BailleurHome');
        } else {
          navigation.replace('EtudiantHome');
        }
      } else {
        Alert.alert('Connexion impossible', result.error || 'Identifiant ou mot de passe incorrect.');
      }
    } catch (error) {
      console.error("Erreur login :", error);
      Alert.alert('Erreur', 'Une erreur technique est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // Étape 1 : Envoi du code SMS style Wave pour mot de passe oublié
  const handleSendForgotCode = async () => {
    const clean = forgotId.trim();
    if (!clean) {
      Alert.alert('Champ requis', 'Veuillez saisir votre numéro de téléphone ou adresse email.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await sendPhoneVerificationCode(clean, 'recuperation');
      if (res.success) {
        setExpectedForgotCode(res.code);
        setForgotStep(2);
        // Déclencher la notification SMS directe style Wave
        showWaveSmsBanner(res.code);
      } else {
        Alert.alert('Erreur', res.error || 'Impossible d\'envoyer le code.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi du code.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Étape 2 : Vérification du code 6 chiffres et mise à jour du mot de passe
  const handleConfirmNewPassword = async () => {
    const cleanCode = forgotCode.trim();
    const cleanPass = newPassword.trim();

    if (cleanCode.length !== 6) {
      Alert.alert('Code requis', 'Veuillez saisir le code de confirmation à 6 chiffres.');
      return;
    }

    if (cleanPass.length < 6) {
      Alert.alert('Mot de passe trop court', 'Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setForgotLoading(true);
    try {
      const verif = await verifyPhoneCode(forgotId, cleanCode, expectedForgotCode);
      if (!verif.success) {
        Alert.alert('Code incorrect', verif.error || 'Le code à 6 chiffres est erroné.');
        setForgotLoading(false);
        return;
      }

      const res = await resetPasswordWithPhone(forgotId, cleanPass);
      if (res.success) {
        Alert.alert('Succès 🎉', res.message || 'Votre mot de passe a été modifié avec succès !');
        setIdentifier(forgotId);
        setForgotModalVisible(false);
        setForgotStep(1);
        setForgotCode('');
        setNewPassword('');
        setForgotId('');
      } else {
        Alert.alert('Erreur', res.error || 'Impossible de mettre à jour le mot de passe.');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur technique est survenue.');
    } finally {
      setForgotLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotId(identifier.trim());
    setForgotStep(1);
    setForgotCode('');
    setNewPassword('');
    setForgotModalVisible(true);
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
              Votre code de validation LogeÉtudiant est : <Text style={styles.waveCodeHighlight}>{smsBannerCode}</Text>. Ne le partagez avec personne.
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

        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Bienvenue sur LogeÉtudiant Sénégal</Text>

        {/* CHAMP IDENTIFIANT : ACCEPTE EMAIL OU NUMÉRO DE TÉLÉPHONE */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#1E40AF" style={styles.inputIcon} />
          <TextInput
            style={styles.inputField}
            placeholder="Numéro de téléphone ou Email"
            placeholderTextColor="#94A3B8"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="default"
            maxLength={45}
          />
        </View>

        {/* CHAMP MOT DE PASSE AVEC ŒIL */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#1E40AF" style={styles.inputIcon} />
          <TextInput
            style={styles.inputField}
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

        {/* LIEN MOT DE PASSE OUBLIÉ */}
        <TouchableOpacity 
          onPress={openForgotModal} 
          style={styles.forgotPasswordContainer}
        >
          <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        {/* BOUTON SE CONNECTER (BLEU ROYAL HARMONISÉ) */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin} 
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Se connecter</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </View>
          )}
        </TouchableOpacity>
        
        {/* LIEN VERS L'INSCRIPTION */}
        <View style={styles.registerLinkRow}>
          <Text style={styles.registerPromptText}>Pas encore de compte ? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLinkText}>S'inscrire</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODALE RÉCUPÉRATION DE MOT DE PASSE PAR TÉLÉPHONE OU EMAIL */}
      <Modal visible={forgotModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalBar} />
            
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconBox}>
                <Ionicons name="key-outline" size={24} color="#1E40AF" />
              </View>
              <TouchableOpacity 
                style={styles.modalCloseBtn} 
                onPress={() => setForgotModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Récupération de compte</Text>
            
            {forgotStep === 1 ? (
              <>
                <Text style={styles.modalDesc}>
                  Saisissez votre <Text style={{ fontWeight: 'bold' }}>numéro de téléphone</Text>. Un code direct à 6 chiffres vous sera envoyé comme sur Wave.
                </Text>

                <View style={[styles.inputContainer, { marginTop: 8 }]}>
                  <Ionicons name="call-outline" size={20} color="#1E40AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Numéro de téléphone"
                    placeholderTextColor="#94A3B8"
                    value={forgotId}
                    onChangeText={setForgotId}
                    autoCapitalize="none"
                    keyboardType="numeric"
                    maxLength={9}
                  />
                </View>

                <TouchableOpacity 
                  style={styles.modalActionBtn} 
                  onPress={handleSendForgotCode}
                  disabled={forgotLoading}
                  activeOpacity={0.85}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalActionBtnText}>Recevoir mon code à 6 chiffres</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalDesc}>
                  Code envoyé à <Text style={{ fontWeight: 'bold' }}>{forgotId}</Text>. Saisissez le code à 6 chiffres reçu et définissez votre nouveau mot de passe.
                </Text>

                {/* CHAMP CODE 6 CHIFFRES */}
                <View style={[styles.inputContainer, { marginTop: 8 }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#1E40AF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.inputField, { letterSpacing: 6, fontSize: 18, fontWeight: 'bold', textAlign: 'center' }]}
                    placeholder="208341"
                    placeholderTextColor="#94A3B8"
                    value={forgotCode}
                    onChangeText={setForgotCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                {/* CHAMP NOUVEAU MOT DE PASSE */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#1E40AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Nouveau mot de passe (6 chiffres)"
                    placeholderTextColor="#94A3B8"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#64748B" 
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.modalActionBtn} 
                  onPress={handleConfirmNewPassword}
                  disabled={forgotLoading}
                  activeOpacity={0.85}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalActionBtnText}>Valider mon nouveau mot de passe</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ alignSelf: 'center', marginTop: 10, padding: 4 }}
                  onPress={() => setForgotStep(1)}
                >
                  <Text style={{ color: '#1E40AF', fontSize: 13, fontWeight: '600' }}>
                    Changer de numéro / email
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity 
              style={styles.modalCancelBtn} 
              onPress={() => setForgotModalVisible(false)}
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
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
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
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1E293B',
  },
  eyeIcon: {
    padding: 6,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 18,
    marginTop: 2,
  },
  forgotPasswordText: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1E40AF',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  registerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerPromptText: {
    color: '#64748B',
    fontSize: 14,
  },
  registerLinkText: {
    color: '#1E40AF',
    fontSize: 14,
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

  /* Modale personnalisée */
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
