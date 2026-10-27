import React, { useState, useRef, useEffect } from 'react';
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
  resetPasswordWithPhone,
  isPhoneAlreadyRegistered,
  cleanPhoneDigits
} from '../services/authService';

export default function LoginScreen({ navigation, route }) {
  const [identifier, setIdentifier] = useState(route?.params?.prefilledPhone || ''); // Numéro de téléphone (9 chiffres)
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route?.params?.prefilledPhone) {
      setIdentifier(route.params.prefilledPhone);
    }
  }, [route?.params?.prefilledPhone]);

  // Modale personnalisée Mot de passe oublié
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = Saisie, 2 = Code 6 chiffres + Nouveau mot de passe
  const [forgotCode, setForgotCode] = useState('');
  const [expectedForgotCode, setExpectedForgotCode] = useState('');
  const [forgotDemoCode, setForgotDemoCode] = useState(null);
  const [forgotCountdown, setForgotCountdown] = useState(30);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const forgotOtpRef = useRef(null);

  // Compte à rebours automatique
  useEffect(() => {
    let timer;
    if (forgotModalVisible && forgotStep === 2 && forgotCountdown > 0) {
      timer = setInterval(() => {
        setForgotCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [forgotModalVisible, forgotStep, forgotCountdown]);

  const handleLogin = async () => {
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      Alert.alert('Champs requis', 'Veuillez saisir votre numéro de téléphone et votre mot de passe.');
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
        if (result.errorType === 'NO_ACCOUNT') {
          Alert.alert(
            "Compte introuvable",
            result.error || "Aucun compte n'est associé à ce numéro de téléphone. Veuillez d'abord vous inscrire.",
            [
              { 
                text: "S'inscrire", 
                onPress: () => navigation.navigate('Register', { prefilledPhone: cleanPhoneDigits(cleanId) }) 
              },
              { text: "Annuler", style: "cancel" }
            ]
          );
        } else if (result.errorType === 'NETWORK_ERROR') {
          Alert.alert(
            "Connexion impossible",
            result.error || "Veuillez vérifier votre connexion Internet puis réessayer."
          );
        } else if (result.errorType === 'WRONG_PASSWORD') {
          Alert.alert(
            "Mot de passe incorrect",
            result.error || "Le mot de passe saisi est incorrect.",
            [
              { 
                text: "Mot de passe oublié ?", 
                onPress: () => {
                  setForgotId(cleanPhoneDigits(cleanId));
                  setForgotModalVisible(true);
                } 
              },
              { text: "Réessayer", style: "cancel" }
            ]
          );
        } else {
          Alert.alert('Connexion impossible', result.error || 'Numéro de téléphone ou mot de passe incorrect.');
        }
      }
    } catch (error) {
      console.error("Erreur login :", error);
      Alert.alert('Erreur', 'Une erreur technique est survenue. Veuillez vérifier votre connexion Internet.');
    } finally {
      setLoading(false);
    }
  };

  // Étape 1 : Envoi du code par message pour mot de passe oublié
  const handleSendForgotCode = async () => {
    const clean = forgotId.trim();
    if (!clean) {
      Alert.alert('Champ requis', 'Veuillez saisir votre numéro de téléphone.');
      return;
    }

    setForgotLoading(true);
    try {
      // Vérifier si le compte existe avant d'envoyer le code
      const check = await isPhoneAlreadyRegistered(clean);
      if (check.networkError) {
        Alert.alert("Connexion impossible", "Veuillez vérifier votre connexion Internet puis réessayer.");
        setForgotLoading(false);
        return;
      }
      if (!check.registered) {
        setForgotLoading(false);
        Alert.alert(
          "Compte introuvable",
          "Aucun compte n'est associé à ce numéro de téléphone. Veuillez d'abord vous inscrire.",
          [
            { 
              text: "S'inscrire", 
              onPress: () => {
                setForgotModalVisible(false);
                navigation.navigate('Register', { prefilledPhone: cleanPhoneDigits(clean) });
              } 
            },
            { text: "Annuler", style: "cancel" }
          ]
        );
        return;
      }

      const res = await sendPhoneVerificationCode(clean, 'recuperation');
      if (res.success) {
        setExpectedForgotCode(res.code);
        setForgotDemoCode(!res.delivered ? res.code : null);
        setForgotCountdown(30);
        setForgotCode('');
        setForgotStep(2);
        setTimeout(() => forgotOtpRef.current?.focus(), 350);
      } else {
        if (res.errorType === 'NETWORK_ERROR') {
          Alert.alert("Connexion impossible", "Veuillez vérifier votre connexion Internet.");
        } else {
          Alert.alert('Erreur', res.error || 'Impossible d\'envoyer le code.');
        }
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi du code. Veuillez vérifier votre connexion.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendForgotCode = async () => {
    if (forgotCountdown > 0) return;
    const clean = forgotId.trim();
    setForgotLoading(true);
    try {
      const res = await sendPhoneVerificationCode(clean, 'recuperation');
      if (res.success) {
        setExpectedForgotCode(res.code);
        setForgotDemoCode(!res.delivered ? res.code : null);
        setForgotCountdown(30);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de renvoyer le code.');
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
        <Text style={styles.subtitle}>Bienvenue sur Logetudiant Sénégal</Text>

        {/* CHAMP NUMÉRO DE TÉLÉPHONE (9 CHIFFRES) */}
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#003880" style={styles.inputIcon} />
          <TextInput
            style={styles.inputField}
            placeholder="Numéro de téléphone"
            placeholderTextColor="#94A3B8"
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType="numeric"
            maxLength={9}
          />
        </View>

        {/* CHAMP MOT DE PASSE AVEC ŒIL */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#003880" style={styles.inputIcon} />
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

      {/* MODALE RÉCUPÉRATION DE MOT DE PASSE ULTRA-PROFESSIONNELLE */}
      <Modal 
        visible={forgotModalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalBar} />
            
            <View style={styles.modalTopRow}>
              <View style={styles.modalBadgeCircle}>
                <Ionicons 
                  name={forgotStep === 1 ? "key" : "shield-checkmark"} 
                  size={26} 
                  color="#003880" 
                />
              </View>
              <TouchableOpacity 
                style={styles.modalCloseTopRight} 
                onPress={() => setForgotModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitleCentered}>
              {forgotStep === 1 ? "Mot de passe oublié" : "Vérification du code"}
            </Text>
            
            {forgotStep === 1 ? (
              <>
                <Text style={styles.modalDescCentered}>
                  Saisissez votre numéro de téléphone pour recevoir votre code de réinitialisation.
                </Text>

                <View style={[styles.inputContainer, { marginTop: 8 }]}>
                  <Ionicons name="call-outline" size={20} color="#003880" style={styles.inputIcon} />
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
                  style={[
                    styles.modalConfirmBtn,
                    forgotId.trim().length === 9 ? styles.modalConfirmBtnActive : styles.modalConfirmBtnDisabled
                  ]} 
                  onPress={handleSendForgotCode}
                  disabled={forgotLoading || forgotId.trim().length !== 9}
                  activeOpacity={0.85}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={styles.modalConfirmBtnText}>Recevoir le code</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalCancelLink} 
                  onPress={() => setForgotModalVisible(false)}
                >
                  <Text style={styles.modalCancelLinkText}>Annuler</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalDescCentered}>
                  Saisissez le code à 6 chiffres envoyé au{'\n'}
                  <Text style={styles.phoneHighlight}>+221 {forgotId}</Text>
                </Text>

                {/* 6 CELLULES DU CODE PIN OTP ULTRA-PROFESSIONNEL */}
                <TouchableOpacity 
                  style={styles.otpContainer} 
                  activeOpacity={1} 
                  onPress={() => forgotOtpRef.current?.focus()}
                >
                  <TextInput
                    ref={forgotOtpRef}
                    value={forgotCode}
                    onChangeText={(txt) => {
                      const clean = txt.replace(/[^0-9]/g, '').slice(0, 6);
                      setForgotCode(clean);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.hiddenInput}
                    autoFocus={true}
                  />
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const char = forgotCode[i] || '';
                    const isCurrent = forgotCode.length === i;
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
                {forgotDemoCode ? (
                  <TouchableOpacity 
                    style={styles.demoCodePill}
                    onPress={() => setForgotCode(forgotDemoCode)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="sparkles" size={14} color="#E8A008" style={{ marginRight: 6 }} />
                    <Text style={styles.demoCodeText}>
                      Code reçu : <Text style={styles.demoCodeBold}>{forgotDemoCode}</Text>  (Toucher pour insérer)
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* COMPTE À REBOURS RENVOI */}
                <View style={styles.resendRow}>
                  {forgotCountdown > 0 ? (
                    <Text style={styles.countdownText}>
                      Renvoyer le code dans <Text style={styles.countdownNumber}>{forgotCountdown}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity 
                      onPress={handleResendForgotCode}
                      disabled={forgotLoading}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.resendActiveText}>
                        {forgotLoading ? "Envoi..." : "Renvoyer un nouveau code"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* CHAMP NOUVEAU MOT DE PASSE */}
                <View style={[styles.inputContainer, { marginTop: 4 }]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#003880" style={styles.inputIcon} />
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
                  style={[
                    styles.modalConfirmBtn,
                    (forgotCode.length === 6 && newPassword.length >= 6) ? styles.modalConfirmBtnActive : styles.modalConfirmBtnDisabled
                  ]} 
                  onPress={handleConfirmNewPassword}
                  disabled={forgotLoading || forgotCode.length !== 6 || newPassword.length < 6}
                  activeOpacity={0.85}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={styles.modalConfirmBtnText}>Valider mon nouveau mot de passe</Text>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginLeft: 6 }} />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalCancelLink} 
                  onPress={() => setForgotStep(1)}
                >
                  <Text style={styles.modalCancelLinkText}>Changer de numéro de téléphone</Text>
                </TouchableOpacity>
              </>
            )}
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
    color: '#003880', // Bleu officiel de l'application
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#E8A008', // Ocre doré officiel du logo
    fontWeight: '700',
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
    color: '#003880',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#003880',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#003880',
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
    color: '#E8A008', // Ocre doré officiel du logo
    fontSize: 14,
    fontWeight: '800',
  },

  /* Modale Récupération Ultra-Professionnelle */
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
    marginBottom: 12,
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
    marginTop: 6,
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
