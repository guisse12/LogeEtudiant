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
  Animated,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { cleanRegistrationNames } from '../utils/nameFormatter';
import CountryPickerModal, { CountryPickerButton } from '../components/CountryPickerModal';
import { LanguagePill } from '../components/LanguageSelector';
import { useTranslation } from '../i18n';
import { DEFAULT_COUNTRY } from '../services/countryService';
import { 
  sendPhoneVerificationCode, 
  verifyPhoneCode, 
  registerUserWithPhone,
  cleanPhoneDigits,
  isPhoneAlreadyRegistered 
} from '../services/authService';

export default function RegisterScreen({ navigation, route }) {
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState(route?.params?.prefilledPhone || '');
  const [role, setRole] = useState('etudiant'); // 'etudiant' ou 'bailleur'
  const [justificatifsUris, setJustificatifsUris] = useState([]); // Jusqu'à 3 pièces
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);

  // Détecter l'ouverture/fermeture du clavier pour adapter dynamiquement la vue
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (route?.params?.prefilledPhone) {
      setTelephone(route.params.prefilledPhone);
    }
  }, [route?.params?.prefilledPhone]);

  // Modale de vérification par code SMS à 6 chiffres
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
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
    if (justificatifsUris.length >= 3) {
      Alert.alert(t('common.limitReached'), t('auth.maxDocsReached'));
      return;
    }

    Alert.alert(
      t('auth.justificationDocs'),
      t('auth.justificationSub'),
      [
        {
          text: `📷 ${t('common.photo')}`,
          onPress: handleTakePhoto,
        },
        {
          text: `📁 ${t('common.gallery')}`,
          onPress: handlePickFromGallery,
        },
        {
          text: t('common.cancel'),
          style: "cancel",
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t('common.permissionRequired'), t('common.cameraPermission'));
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
      Alert.alert(t('common.error'), t('common.cameraCaptureError'));
    }
  };

  const handlePickFromGallery = async () => {
    const remainingSlots = 3 - justificatifsUris.length;
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t('common.permissionRequired'), t('common.galleryPermission'));
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
      Alert.alert(t('common.error'), t('common.galleryLoadError'));
    }
  };

  const handleRemoveJustificatif = (indexToRemove) => {
    setJustificatifsUris(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Étape 1 : Valider les champs et envoyer le code de confirmation par message
  const handleInitiateRegister = async () => {
    const rawDigits = telephone.replace(/[^0-9]/g, '');
    const cleanPhone = cleanPhoneDigits(telephone, selectedCountry.dialCode);
    const requiredLen = selectedCountry.phoneLength || 9;

    if (!rawDigits || rawDigits.length !== requiredLen) {
      Alert.alert(
        t('common.error'), 
        t('auth.enterValidPhone')
      );
      return;
    }

    if (!prenom.trim()) {
      Alert.alert(t('common.requiredFields'), t('auth.firstNameRequired'));
      return;
    }

    if (!nom.trim()) {
      Alert.alert(t('common.requiredFields'), t('auth.lastNameRequired'));
      return;
    }

    if (!password || password.length !== 6) {
      Alert.alert(t('common.error'), t('auth.passwordSixDigits'));
      return;
    }

    if (role === 'bailleur' && justificatifsUris.length === 0) {
      Alert.alert(
        t('common.requiredFields'), 
        t('auth.docRequired')
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Contrôle strict d'unicité : 1 numéro de téléphone = 1 et 1 seul compte Logetudiant
      const checkResult = await isPhoneAlreadyRegistered(cleanPhone, selectedCountry.dialCode);
      
      if (checkResult.networkError) {
        Alert.alert(t('auth.networkError'), t('auth.networkErrorDesc'));
        setLoading(false);
        return;
      }

      if (checkResult.registered) {
        setLoading(false);
        Alert.alert(
          t('auth.alreadyRegisteredTitle'),
          t('auth.phoneAlreadyUsedDesc'),
          [
            {
              text: t('auth.loginButton'),
              onPress: () => navigation.navigate('Login', { prefilledPhone: telephone }),
            },
            {
              text: t('auth.modifyPhone'),
              style: "cancel",
            }
          ]
        );
        return;
      }

      // 2. Envoi du code SMS de vérification
      const res = await sendPhoneVerificationCode(cleanPhone, 'inscription', selectedCountry.dialCode);
      if (res.success) {
        setExpectedCode(res.code);
        setVerificationCode('');
        setCountdown(30);
        setCodeModalVisible(true);
        setTimeout(() => otpInputRef.current?.focus(), 350);
      } else {
        if (res.errorType === 'NETWORK_ERROR') {
          Alert.alert(t('auth.networkError'), t('auth.networkErrorDesc'));
        } else {
          Alert.alert(t('common.error'), res.error || t('auth.codeInvalid'));
        }
      }
    } catch (err) {
      console.error("Erreur register initiate :", err);
      Alert.alert(t('common.error'), t('auth.networkErrorDesc'));
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Vérification du code 6 chiffres et création effective du compte
  const handleConfirmCodeAndRegister = async () => {
    const cleanPhone = cleanPhoneDigits(telephone, selectedCountry.dialCode);
    const cleanCode = verificationCode.trim();

    if (cleanCode.length !== 6) {
      Alert.alert(t('auth.incompleteCode'), t('auth.incompleteCodeDesc'));
      return;
    }

    setVerifying(true);
    try {
      const verif = await verifyPhoneCode(cleanPhone, cleanCode, expectedCode, selectedCountry.dialCode);
      if (!verif.success) {
        Alert.alert(t('auth.invalidCode'), t('auth.invalidCodeDesc'));
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
        countryId: selectedCountry.id,
        countryNom: selectedCountry.name,
        dialCode: selectedCountry.dialCode,
        currency: selectedCountry.currency,
        piecesJustificatives: justificatifsUris,
      }, selectedCountry.dialCode);

      if (result.success) {
        setCodeModalVisible(false);
        Alert.alert(
          t('auth.registrationSuccess'), 
          t('auth.registrationSuccessDesc'),
          [
            {
              text: t('auth.loginButton'),
              onPress: () => navigation.replace('Login', { prefilledPhone: telephone }),
            }
          ]
        );
      } else {
        if (result.errorType === 'PHONE_EXISTS') {
          Alert.alert(
            t('auth.alreadyRegisteredTitle'),
            t('auth.alreadyRegisteredDesc'),
            [
              {
                text: t('auth.loginButton'),
                onPress: () => {
                  setCodeModalVisible(false);
                  navigation.replace('Login', { prefilledPhone: telephone });
                }
              }
            ]
          );
        } else if (result.errorType === 'NETWORK_ERROR') {
          Alert.alert(t('auth.networkError'), t('auth.networkErrorDesc'));
        } else {
          Alert.alert(t('common.error'), result.error || t('auth.completeRegistrationError'));
        }
      }
    } catch (error) {
      console.error("Erreur inscription :", error);
      Alert.alert(t('common.error'), t('auth.networkErrorDesc'));
    } finally {
      setVerifying(false);
    }
  };

  // Renvoyer le code par message si non reçu
  const handleResendCode = async () => {
    if (countdown > 0) return;
    const cleanPhone = cleanPhoneDigits(telephone, selectedCountry.dialCode);
    setResendingCode(true);
    try {
      const res = await sendPhoneVerificationCode(cleanPhone, 'inscription', selectedCountry.dialCode);
      if (res.success) {
        setExpectedCode(res.code);
        setVerificationCode('');
        setCountdown(30);
      }
    } catch (e) {
      Alert.alert(t('common.error'), t('auth.resendCodeFailed'));
    } finally {
      setResendingCode(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.container,
            isKeyboardVisible && styles.containerKeyboardOpen
          ]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          
          {/* SÉLECTEUR DE LANGUE DISCRET (FR / EN) */}
          <View style={styles.topLangRow}>
            <View style={{ flex: 1 }} />
            <LanguagePill />
          </View>

          {/* LOGO PARFAITEMENT DÉTOURÉ & ADAPTÉ AU CLAVIER */}
          <View style={[styles.logoWrapper, isKeyboardVisible && styles.logoWrapperCompact]}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={[styles.logo, isKeyboardVisible && styles.logoCompact]} 
              resizeMode="contain" 
            />
          </View>

          <Text style={[styles.title, isKeyboardVisible && styles.titleCompact]}>{t('auth.registerTitle')}</Text>
          <Text style={[styles.subtitle, isKeyboardVisible && styles.subtitleCompact]}>{t('auth.registerSubtitle')}</Text>

          {/* SÉLECTEUR DE RÔLE MODERNE */}
          <View style={[styles.roleContainer, isKeyboardVisible && { marginBottom: 12 }]}>
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
              <Text style={[styles.roleText, role === 'etudiant' && styles.roleTextActive]}>{t('auth.roleStudent')}</Text>
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
              <Text style={[styles.roleText, role === 'bailleur' && styles.roleTextActive]}>{t('auth.roleLandlord')}</Text>
            </TouchableOpacity>
          </View>

          {/* CHAMP PRÉNOM */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={19} color="#003880" style={styles.inputIcon} />
            <TextInput 
              style={styles.inputField} 
              placeholder={t('auth.firstName')} 
              placeholderTextColor="#94A3B8"
              value={prenom} 
              onChangeText={setPrenom}
              maxLength={20}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 40, animated: true });
                }, 100);
              }}
            />
          </View>

          {/* CHAMP NOM */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={19} color="#003880" style={styles.inputIcon} />
            <TextInput 
              style={styles.inputField} 
              placeholder={t('auth.lastName')} 
              placeholderTextColor="#94A3B8"
              value={nom} 
              onChangeText={setNom}
              maxLength={15}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 90, animated: true });
                }, 100);
              }}
            />
          </View>

          {/* CHAMP NUMÉRO DE TÉLÉPHONE AVEC SÉLECTEUR DE PAYS AFRICAIN */}
          <View style={styles.inputContainer}>
            <CountryPickerButton
              selectedCountry={selectedCountry}
              onPress={() => setCountryModalVisible(true)}
            />
            <TextInput 
              style={styles.inputField} 
              placeholder={selectedCountry.samplePhone || t('auth.phonePlaceholder')} 
              placeholderTextColor="#94A3B8"
              value={telephone} 
              onChangeText={setTelephone} 
              keyboardType="numeric"
              maxLength={selectedCountry.phoneLength || 10}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 140, animated: true });
                }, 100);
              }}
            />
          </View>

          {/* CHAMP MOT DE PASSE (6 CHIFFRES AVEC ŒIL) */}
          <View style={styles.passwordContainer}>
            <Ionicons name="lock-closed-outline" size={19} color="#003880" style={styles.inputIcon} />
            <TextInput 
              style={styles.passwordInput} 
              placeholder={t('auth.passwordPlaceholder')} 
              placeholderTextColor="#94A3B8"
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry={!showPassword}
              keyboardType="numeric"
              maxLength={6}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 190, animated: true });
                }, 120);
              }}
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
                <Text style={styles.bailleurTitle}>{t('auth.justificationDocs')}</Text>
              </View>
              <Text style={styles.bailleurDesc}>
                {t('auth.justificationSub')}
              </Text>
              
              <TouchableOpacity style={styles.filePickerBtn} onPress={handleAddJustificatif}>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.filePickerText}>
                  {t('auth.addDoc')} ({justificatifsUris.length}/3)
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
                <Text style={styles.submitBtnText}>{t('auth.registerButton')}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
              </View>
            )}
          </TouchableOpacity>

          {/* LIEN VERS CONNEXION */}
          <View style={styles.loginLinkContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>
                {t('auth.alreadyAccount')} <Text style={styles.loginLinkHighlight}>{t('auth.loginButton')}</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </TouchableWithoutFeedback>

      {/* MODALE DE VÉRIFICATION DU CODE SMS ULTRA-PROFESSIONNELLE */}
      <Modal 
        visible={codeModalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setCodeModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity 
            style={styles.modalBackdropDismiss} 
            activeOpacity={1} 
            onPress={Keyboard.dismiss} 
          />
          <View style={[styles.modalCard, isKeyboardVisible && styles.modalCardWithKeyboard]}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 36 : 10 }}
              bounces={false}
            >
              <View style={styles.modalBar} />

              <View style={[styles.modalTopRow, isKeyboardVisible && { marginBottom: 6 }]}>
                <View style={[styles.modalBadgeCircle, isKeyboardVisible && { width: 44, height: 44, borderRadius: 22 }]}>
                  <Ionicons name="shield-checkmark" size={isKeyboardVisible ? 20 : 26} color="#003880" />
                </View>
                <TouchableOpacity 
                  style={styles.modalCloseTopRight} 
                  onPress={() => setCodeModalVisible(false)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalTitleCentered, isKeyboardVisible && { fontSize: 18, marginBottom: 2 }]}>
                Vérification du compte
              </Text>
              <Text style={styles.modalDescCentered}>
                Saisissez le code à 6 chiffres envoyé au{'\n'}
                <Text style={styles.phoneHighlight}>{selectedCountry.dialCode} {telephone}</Text>
              </Text>

              {/* 6 CELLULES DU CODE PIN OTP ULTRA-PROFESSIONNEL */}
              <View style={styles.otpContainer}>
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
                  caretHidden={true}
                />
                <View style={styles.otpCellsRow} pointerEvents="none">
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
                </View>
              </View>

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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SÉLECTEUR DE PAYS AFRICAINS */}
      <CountryPickerModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
        onSelectCountry={(country) => {
          setSelectedCountry(country);
          setTelephone('');
        }}
        selectedCountry={selectedCountry}
      />

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topLangRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  container: { 
    paddingHorizontal: 24, 
    backgroundColor: '#F8FAFC', 
    flexGrow: 1, 
    justifyContent: 'center',
    paddingTop: 36,
    paddingBottom: 36,
  },
  containerKeyboardOpen: {
    justifyContent: 'flex-start',
    paddingTop: 12,
    paddingBottom: 240, // Espace généreux pour faire défiler bien au-dessus du clavier
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  logoWrapperCompact: {
    marginBottom: 6,
  },
  logo: {
    width: 140,
    height: 120,
  },
  logoCompact: {
    width: 65,
    height: 50,
  },
  title: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#003880', // Bleu officiel de l'application
    textAlign: 'center', 
    marginBottom: 4 
  },
  titleCompact: {
    fontSize: 21,
    marginBottom: 2,
  },
  subtitle: { 
    fontSize: 13, 
    color: '#E8A008', // Ocre doré officiel du logo
    fontWeight: '700',
    textAlign: 'center', 
    marginBottom: 20 
  },
  subtitleCompact: {
    marginBottom: 10,
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
  modalBackdropDismiss: {
    flex: 1,
    width: '100%',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 26,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  modalCardWithKeyboard: {
    maxHeight: '85%',
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
    position: 'relative',
    height: 58,
    justifyContent: 'center',
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  otpCellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 58,
    opacity: 0.01,
    zIndex: 10,
    color: 'transparent',
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
