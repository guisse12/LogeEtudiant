import React, { useState } from 'react';
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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const UNIVERSITES_DISPO = ['UCAD', 'UGB', 'UIT', 'UASZ', 'UIDT'];

export default function AjouterColocAnnonceScreen({ navigation }) {
  const [universiteId, setUniversiteId] = useState('UCAD');
  const [budgetMax, setBudgetMax] = useState('');
  const [telephone, setTelephone] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

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
        Alert.alert("Erreur", "Vous devez être connecté pour publier une annonce.");
        setLoading(false);
        return;
      }

      const userName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "Étudiant";

      await addDoc(collection(db, "coloc_annonces"), {
        etudiantId: auth.currentUser.uid,
        nomEtudiant: userName,
        universiteId: universiteId,
        budgetMax: budgetNum,
        telephone: telephone.trim(),
        description: description.trim(),
        createdAt: serverTimestamp(),
      });

      Alert.alert("Succès", "Votre annonce de colocation a été publiée avec succès !");
      navigation.goBack();
    } catch (error) {
      console.error("Erreur lors de la publication de l'annonce :", error);
      Alert.alert("Erreur technique", "Impossible de publier l'annonce pour le moment.");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Publier une recherche</Text>
        <Text style={styles.subtitle}>Trouvez un partenaire pour partager votre loyer</Text>

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
          placeholder="ex: 30000"
          keyboardType="numeric"
          value={budgetMax}
          onChangeText={setBudgetMax}
        />

        <Text style={styles.label}>Votre numéro de téléphone :</Text>
        <TextInput 
          style={styles.input}
          placeholder="ex: 771234567"
          keyboardType="phone-pad"
          value={telephone}
          onChangeText={setTelephone}
        />

        <Text style={styles.label}>Description & Critères :</Text>
        <TextInput 
          style={[styles.input, styles.textArea]}
          placeholder="Décrivez ce que vous recherchez (ex: Je cherche un colocataire calme, proche de la fac...)"
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
            <Text style={styles.submitButtonText}>Publier l'annonce</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8F9FA', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A365D', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#718096', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
  uniContainer: { flexDirection: 'row', marginBottom: 20, maxHeight: 45 },
  uniChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 20, marginRight: 10, height: 38 },
  uniChipSelected: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
  uniText: { fontSize: 13, color: '#4A5568', fontWeight: '500' },
  uniTextSelected: { color: '#FFF' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#3182CE', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});