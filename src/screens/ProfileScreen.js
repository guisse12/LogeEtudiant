import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { logoutUser } from '../services/authService';

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [universite, setUniversite] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  // Charger les informations du profil depuis Firestore
  // Charger les informations du profil depuis Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        setEmail(user.email || '');

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Si le prénom et le nom sont séparés dans Firestore, on les combine
          let fullName = data.nom || '';
          if (data.prenom) {
            fullName = `${data.prenom} ${data.nom}`.trim();
          }
          // S'il y a un champ nomComplet direct, on le prend en priorité
          if (data.nomComplet) {
            fullName = data.nomComplet;
          }

          setNom(fullName);
          setTelephone(data.telephone || '');
          setUniversite(data.universite || '');
          setRole(data.role || 'Etudiant');
        }
      } catch (error) {
        console.error("Erreur chargement profil :", error);
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);
  // Mettre à jour le profil
  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        nom: nom.trim(),
        nomComplet: nom.trim(), // Enregistre aussi sous nomComplet pour éviter les désynchronisations
        telephone: telephone.trim(),
        universite: universite.trim(),
      });

      Alert.alert("Succès", "Vos informations ont été mises à jour avec succès !");
    } catch (error) {
      console.error("Erreur mise à jour profil :", error);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil.");
    }
    setUpdating(false);
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigation.replace('Login');
    } catch (error) {
      console.error("Erreur déconnexion :", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3182CE" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Retour</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {nom ? nom.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'E')}
          </Text>
        </View>

        <Text style={styles.userEmail}>{email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Rôle : {role === 'bailleur' ? 'Bailleur' : 'Étudiant'}</Text>
        </View>

        <Text style={styles.label}>Nom complet</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Votre nom" 
          value={nom} 
          onChangeText={setNom} 
        />

        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: +221770000000" 
          keyboardType="phone-pad"
          value={telephone} 
          onChangeText={setTelephone} 
        />

        <Text style={styles.label}>Université / Zone principale</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: UCAD, UGB..." 
          value={universite} 
          onChangeText={setUniversite} 
        />

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleUpdateProfile}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8F9FA', flexGrow: 1, paddingTop: 40 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  backButton: { marginBottom: 15 },
  backButtonText: { fontSize: 16, color: '#3182CE', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginBottom: 20 },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#3182CE', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  userEmail: { fontSize: 16, fontWeight: '600', color: '#2D3748', marginBottom: 6 },
  roleBadge: { backgroundColor: '#EBF8FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 20 },
  roleBadgeText: { color: '#3182CE', fontSize: 12, fontWeight: 'bold' },
  label: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 6 },
  input: { width: '100%', backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#CBD5E0', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 14, color: '#2D3748' },
  saveButton: { width: '100%', backgroundColor: '#38A169', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  logoutButton: { backgroundColor: '#FED7D7', padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FEB2B2' },
  logoutButtonText: { color: '#9B2C2C', fontWeight: 'bold', fontSize: 15 },
});