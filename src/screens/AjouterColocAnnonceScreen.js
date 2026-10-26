import React, { useState, useEffect } from 'react';
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
import { UNIVERSITES } from '../services/universityService';

export default function AjouterColocAnnonceScreen({ navigation, route }) {
  const annonceToEdit = route?.params?.annonceToEdit;
  const isEditing = !!annonceToEdit;

  const [universiteId, setUniversiteId] = useState('UCAD');
  const [budgetMax, setBudgetMax] = useState('');
  const [telephone, setTelephone] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (annonceToEdit) {
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

    if (!cleanBudget || !cleanPhone || !cleanDesc) {
      Alert.alert("Champs manquants", "Veuillez renseigner votre budget, votre numéro WhatsApp et la description.");
      return;
    }

    if (cleanPhone.length !== 9) {
      Alert.alert("Numéro invalide", "Le numéro WhatsApp doit comporter exactement 9 chiffres (ex: 771234567).");
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
          universiteId: universiteId,
          budgetMax: budgetNum,
          telephone: cleanPhone,
          description: cleanDesc,
          createdAt: serverTimestamp(),
        });

        Alert.alert("Succès", "Votre annonce de colocation a été publiée avec succès !");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Erreur enregistrement annonce colocation :", error);
      Alert.alert("Erreur technique", "Impossible d'enregistrer l'annonce pour le moment.");
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
        <Text style={styles.navTitle}>{isEditing ? "Modifier l'annonce" : "Nouvelle Colocation"}</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{isEditing ? "Modifier mon annonce" : "Publier une recherche"}</Text>
          <Text style={styles.subtitle}>
            {isEditing ? "Mettez à jour vos critères pour trouver le colocataire idéal" : "Trouvez un camarade pour partager votre futur logement"}
          </Text>

          <Text style={styles.label}>Zone / Université cible :</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.uniContainer}>
            {UNIVERSITES.map((uni) => (
              <TouchableOpacity
                key={uni.id}
                style={[styles.uniChip, universiteId === uni.id && styles.uniChipSelected]}
                onPress={() => setUniversiteId(uni.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.uniText, universiteId === uni.id && styles.uniTextSelected]}>
                  {uni.id} ({uni.ville})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Votre budget maximum (FCFA) :</Text>
          <TextInput 
            style={styles.input}
            placeholder="35000"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={7}
            value={budgetMax}
            onChangeText={setBudgetMax}
          />

          <Text style={styles.label}>Numéro WhatsApp (9 chiffres) :</Text>
          <TextInput 
            style={styles.input}
            placeholder="770000000"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={9}
            value={telephone}
            onChangeText={setTelephone}
          />

          <Text style={styles.label}>Description & Critères de colocation :</Text>
          <TextInput 
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez vos critères (ex: Je cherche un colocataire calme, proche campus, partage électricité et wifi...)"
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
                  {isEditing ? "Enregistrer les modifications" : "Publier l'annonce"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  container: { padding: 18, backgroundColor: '#F8FAFC', flexGrow: 1 },
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
