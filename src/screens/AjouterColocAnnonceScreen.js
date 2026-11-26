import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { formatCleanFullName } from '../utils/nameFormatter';
import { UNIVERSITES, getUniversitiesForCountry } from '../services/universityService';
import { DEFAULT_COUNTRY, getCountryById } from '../services/countryService';
import CountryPickerModal, { CountryPickerButton } from '../components/CountryPickerModal';
import { broadcastNotification } from '../services/notificationService';
import { useTranslation } from '../i18n';

export default function AjouterColocAnnonceScreen({ navigation, route }) {
  const { t } = useTranslation();
  const annonceToEdit = route?.params?.annonceToEdit;
  const isEditing = !!annonceToEdit;

  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [universiteId, setUniversiteId] = useState('UCAD');
  const [budgetMax, setBudgetMax] = useState('');
  const [telephone, setTelephone] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const availableUnis = useMemo(() => {
    return (selectedCountry?.id === 'SN' || !selectedCountry)
      ? UNIVERSITES
      : getUniversitiesForCountry(selectedCountry?.id);
  }, [selectedCountry]);

  useEffect(() => {
    if (annonceToEdit) {
      if (annonceToEdit.countryId) {
        setSelectedCountry(getCountryById(annonceToEdit.countryId));
      }
      setUniversiteId(annonceToEdit.universiteId || 'UCAD');
      setBudgetMax(String(annonceToEdit.budgetMax || ''));
      setTelephone(annonceToEdit.telephone || '');
      setDescription(annonceToEdit.description || '');
    } else {
      const prefillUserData = async () => {
        if (!auth.currentUser) return;
        try {
          const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.telephone) {
              setTelephone(data.telephone);
            }
          }
        } catch (err) {
          console.log("Info utilisateur non récupérée :", err);
        }
      };
      prefillUserData();
    }
  }, [annonceToEdit]);

  const handlePublier = async () => {
    const cleanBudget = budgetMax.trim();
    const cleanPhone = telephone.replace(/[^0-9]/g, '');
    const cleanDesc = description.trim();
    const requiredLen = selectedCountry.phoneLength || 9;

    if (!cleanBudget || !cleanPhone || !cleanDesc) {
      Alert.alert("Champs manquants", "Veuillez renseigner votre budget, votre numéro WhatsApp et la description.");
      return;
    }

    if (cleanPhone.length !== requiredLen) {
      Alert.alert(
        "Numéro invalide", 
        `Le numéro WhatsApp pour ${selectedCountry.name} doit comporter exactement ${requiredLen} chiffres (ex: ${selectedCountry.samplePhone || ''}).`
      );
      return;
    }

    const budgetNum = Number(cleanBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      Alert.alert("Format invalide", "Veuillez entrer un budget maximum valide (chiffres uniquement).");
      return;
    }

    setLoading(true);
    try {
      if (!auth.currentUser) {
        Alert.alert("Erreur", "Vous devez être connecté pour publier ou modifier une annonce.");
        setLoading(false);
        return;
      }

      if (isEditing) {
        const docRef = doc(db, "coloc_annonces", annonceToEdit.id);
        await updateDoc(docRef, {
          countryId: selectedCountry.id,
          countryNom: selectedCountry.name,
          currency: selectedCountry.currency,
          dialCode: selectedCountry.dialCode,
          universiteId: universiteId,
          budgetMax: budgetNum,
          telephone: cleanPhone,
          description: cleanDesc,
          updatedAt: serverTimestamp(),
        });

        Alert.alert("Succès", "Votre annonce de colocation a été mise à jour !");
        navigation.goBack();
      } else {
        let userName = auth.currentUser.displayName;
        if (!userName) {
          try {
            const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (userSnap.exists()) {
              userName = formatCleanFullName(userSnap.data());
            }
          } catch (e) {}
        }
        if (!userName) {
          userName = auth.currentUser.email?.split('@')[0] || "Étudiant";
        }

        await addDoc(collection(db, "coloc_annonces"), {
          etudiantId: auth.currentUser.uid,
          nomEtudiant: userName,
          countryId: selectedCountry.id,
          countryNom: selectedCountry.name,
          currency: selectedCountry.currency,
          dialCode: selectedCountry.dialCode,
          universiteId: universiteId,
          budgetMax: budgetNum,
          telephone: cleanPhone,
          description: cleanDesc,
          createdAt: serverTimestamp(),
        });

        // Notification automatique diffusée aux étudiants
        broadcastNotification({
          title: "Nouvelle recherche de colocation 👥",
          body: `${userName} cherche un colocataire (${universiteId}) - Budget max : ${budgetNum} ${selectedCountry.currency || 'FCFA'}.`,
          type: 'new_coloc',
          data: { universiteId, countryId: selectedCountry.id }
        }).catch(() => {});

        Alert.alert(t('common.success'), isEditing ? t('coloc.updateSuccess') : t('coloc.publishSuccess'));
        navigation.goBack();
      }
    } catch (error) {
      console.error("Erreur enregistrement annonce colocation :", error);
      Alert.alert(t('common.error'), "Impossible d'enregistrer l'annonce pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP NAVBAR FIXE */}
      <View style={styles.fixedNavbar}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.navBackBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#003880" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{isEditing ? t('coloc.editTitle') : t('coloc.newTitle')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.title}>{isEditing ? t('coloc.editScreenTitle') : t('coloc.newScreenTitle')}</Text>
          <Text style={styles.subtitle}>
            {isEditing ? t('coloc.editScreenSubtitle') : t('coloc.newScreenSubtitle')}
          </Text>

          <Text style={styles.label}>{t('coloc.targetCountryUni')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <CountryPickerButton
              selectedCountry={selectedCountry}
              onPress={() => setCountryModalVisible(true)}
            />
            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>{selectedCountry.name}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.uniContainer}>
            {availableUnis.map((uni) => (
              <TouchableOpacity
                key={uni.id}
                style={[styles.uniChip, universiteId === uni.id && styles.uniChipSelected]}
                onPress={() => setUniversiteId(uni.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.uniText, universiteId === uni.id && styles.uniTextSelected]}>
                  {uni.nom || uni.id}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>{t('coloc.maxBudgetLabel', { currency: selectedCountry.currency || 'FCFA' })}</Text>
          <TextInput 
            style={styles.input}
            placeholder={t('coloc.budgetPlaceholder', { currency: selectedCountry.currency || 'FCFA' })}
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={10}
            value={budgetMax}
            onChangeText={setBudgetMax}
          />

          <Text style={styles.label}>{t('coloc.whatsappLabel', { dialCode: selectedCountry.dialCode })}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <CountryPickerButton
              selectedCountry={selectedCountry}
              onPress={() => setCountryModalVisible(true)}
            />
            <TextInput 
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder={selectedCountry.samplePhone || "Numéro WhatsApp"}
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={selectedCountry.phoneLength || 10}
              value={telephone}
              onChangeText={setTelephone}
            />
          </View>

          <Text style={styles.label}>{t('coloc.descLabel')}</Text>
          <TextInput 
            style={[styles.input, styles.textArea]}
            placeholder={t('coloc.descPlaceholder')}
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            maxLength={300}
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handlePublier}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitButtonText}>
                  {isEditing ? t('coloc.saveChanges') : t('coloc.publishListing')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* SÉLECTEUR DE PAYS AFRICAINS */}
      <CountryPickerModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
        onSelectCountry={(country) => {
          setSelectedCountry(country);
          const unis = country.id === 'SN' ? UNIVERSITES : getUniversitiesForCountry(country.id);
          if (unis && unis.length > 0) {
            setUniversiteId(unis[0].id);
          }
        }}
        selectedCountry={selectedCountry}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  fixedNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  navBackBtn: {
    padding: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  container: { padding: 18, backgroundColor: '#F8FAFC', flexGrow: 1, paddingBottom: 60 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  uniContainer: { flexDirection: 'row', marginBottom: 18, maxHeight: 42 },
  uniChip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 20, marginRight: 8, height: 36 },
  uniChipSelected: { backgroundColor: '#003880', borderColor: '#003880' },
  uniText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  uniTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16, color: '#1E293B' },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#003880', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10, elevation: 2 },
  submitButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
