import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { registerUser } from '../services/authService';

export default function RegisterScreen({ navigation }) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('etudiant'); // Par défaut : étudiant
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nom || !prenom || !email || !telephone || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    const userData = { nom, prenom, telephone, role };
    const result = await registerUser(email, password, userData);
    setLoading(false);

    if (result.success) {
      Alert.alert('Succès', 'Compte créé avec succès !');
      
      // Redirection automatique selon le rôle choisi
      if (role === 'bailleur') {
        navigation.replace('BailleurHome');
      } else {
        navigation.replace('EtudiantHome');
      }
    } else {
      Alert.alert('Erreur d\'inscription', result.error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>
      <Text style={styles.subtitle}>Rejoignez LogeÉtudiant</Text>

      {/* Sélection du rôle */}
      <View style={styles.roleContainer}>
        <TouchableOpacity 
          style={[styles.roleButton, role === 'etudiant' && styles.roleSelectedEtudiant]} 
          onPress={() => setRole('etudiant')}
        >
          <Text style={[styles.roleText, role === 'etudiant' && styles.roleTextSelected]}>Étudiant</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleButton, role === 'bailleur' && styles.roleSelectedBailleur]} 
          onPress={() => setRole('bailleur')}
        >
          <Text style={[styles.roleText, role === 'bailleur' && styles.roleTextSelected]}>Bailleur</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nom"
        value={nom}
        onChangeText={setNom}
      />
      <TextInput
        style={styles.input}
        placeholder="Prénom"
        value={prenom}
        onChangeText={setPrenom}
      />
      <TextInput
        style={styles.input}
        placeholder="Téléphone"
        value={telephone}
        onChangeText={setTelephone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>S'inscrire</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Déjà un compte ? Connectez-vous</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#fff',
  },
  roleSelectedEtudiant: {
    backgroundColor: '#3182CE',
    borderColor: '#3182CE',
  },
  roleSelectedBailleur: {
    backgroundColor: '#38A169',
    borderColor: '#38A169',
  },
  roleText: {
    fontSize: 16,
    color: '#4A5568',
    fontWeight: '600',
  },
  roleTextSelected: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3182CE',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#3182CE',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});