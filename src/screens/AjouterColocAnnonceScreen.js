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
  Platform
} from 'react-native';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { formatCleanFullName } from '../utils/nameFormatter';

const UNIVERSITES_DISPO = ['UCAD', 'UGB', 'USSEIN', 'UASZ', 'UIDT', 'UAM'];

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
    // Nettoyage et vérification rigoureuse
    if (!budgetMax.trim() || !telephone.trim() || !description.trim()) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const budgetNum = Number(budgetMax);
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
        // Mise à jour de l'annonce existante
        const docRef = doc(db, "coloc_annonces", annonceToEdit.id);
        await updateDoc(docRef, {
          universiteId: universiteId,
          budgetMax: budgetNum,
          telephone: telephone.trim(),
          description: description.trim(),
          updatedAt: serverTimestamp(),
        });

        Alert.alert("Succès ✨", "Votre annonce de colocation a été mise à jour !");
        navigation.goBack();
      } else {
        // Création d'une nouvelle annonce
        let userName = auth.currentUser.displayName;
        if (!userName) {
          try {
            const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (userSnap.exists()) {
              userName = formatCleanFullName(userSnap.data());
            }
          } catch (e) {
            // fallback
          }
        }
        if (!userName) {
          userName = auth.currentUser.email?.split('@')[0] || "Étudiant";
        }

        await addDoc(collection(db, "coloc_annonces"), {
          etudiantId: auth.currentUser.uid,
          nomEtudiant: userName,
          universiteId: universiteId,
          budgetMax: budgetNum,
          telephone: telephone.trim(),
          description: description.trim(),
          createdAt: serverTimestamp(),
        });

        Alert.alert("Succès 🎉", "Votre annonce de colocation a été publiée avec succès !");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Erreur enregistrement annonce colocation :", error);
      Alert.alert("Erreur technique", "Impossible d'enregistrer l'annonce pour le moment.");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Retour</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{isEditing ? "Modifier mon annonce" : "Publier une recherche"}</Text>
        <Text style={styles.subtitle}>
          {isEditing ? "Mettez à jour vos critères pour trouver le colocataire idéal" : "Trouvez un partenaire pour partager votre loyer"}
        </Text>

        <Text style={styles.label}>Zone / Université cible :</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.uniContainer}>
          {UNIVERSITES_DISPO.map((uni) => (
            <TouchableOpacity
              key={uni}
              style={[styles.uniChip, universiteId === uni && styles.uniChipSelected]}
              onPress={() => setUniversiteId(uni)}
            >
              <Text style={[styles.uniText, universiteId === uni && styles.uniTextSelected]}>{uni}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Votre budget maximum (FCFA) :</Text>
        <TextInput 
          style={styles.input}
          placeholder="ex: 35000"
          placeholderTextColor="#A0AEC0"
          keyboardType="numeric"
          value={budgetMax}
          onChangeText={setBudgetMax}
        />

        <Text style={styles.label}>Votre numéro WhatsApp :</Text>
        <TextInput 
          style={styles.input}
          placeholder="ex: 771234567"
          placeholderTextColor="#A0AEC0"
          keyboardType="phone-pad"
          value={telephone}
          onChangeText={setTelephone}
        />

        <Text style={styles.label}>Description & Critères de colocation :</Text>
        <TextInput 
          style={[styles.input, styles.textArea]}
          placeholder="Décrivez vos critères (ex: Je cherche un colocataire calme, proche campus, partage électricité et wifi...)"
          placeholderTextColor="#A0AEC0"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handlePublier}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? "💾 Enregistrer les modifications" : "🚀 Publier l'annonce"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8F9FA', flexGrow: 1, paddingTop: 30 },
  headerRow: { marginBottom: 10 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  backBtnText: { color: '#3182CE', fontWeight: 'bold', fontSize: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A365D', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#718096', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
  uniContainer: { flexDirection: 'row', marginBottom: 20, maxHeight: 45 },
  uniChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 20, marginRight: 10, height: 38 },
  uniChipSelected: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
  uniText: { fontSize: 13, color: '#4A5568', fontWeight: '500' },
  uniTextSelected: { color: '#FFF' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16, color: '#2D3748' },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#3182CE', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, elevation: 2 },
  submitButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
