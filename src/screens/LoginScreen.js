import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { loginUser, resetPassword } from '../services/authService'; // Assure-toi d'importer ta fonction de réinitialisation

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(email, password);

      if (result.success) {
        const role = result.userInfo?.role;
        if (role === 'bailleur') {
          navigation.replace('BailleurHome');
        } else {
          navigation.replace('EtudiantHome');
        }
      } else {
        Alert.alert('Erreur de connexion', result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur technique est survenue.');
    } finally {
      // GARANTIE : Le chargement s'arrêtera dans tous les cas (succès ou échec)
      setLoading(false);
    }
  };

  // Fonction pour gérer le mot de passe oublié
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Champ requis', 'Veuillez entrer votre adresse email ci-dessus pour réinitialiser votre mot de passe.');
      return;
    }

    try {
      // Appel de la fonction de réinitialisation (ex: Firebase sendPasswordResetEmail)
      const result = await resetPassword(email);
      if (result.success) {
        Alert.alert('Succès', 'Un lien de réinitialisation a été envoyé à votre adresse email.');
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi du mail de réinitialisation.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <Text style={styles.subtitle}>Bienvenue sur LogeÉtudiant</Text>

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

      {/* Lien Mot de passe oublié */}
      <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
        <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Se connecter</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Pas encore de compte ? S'inscrire</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
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
    marginBottom: 30,
    textAlign: 'center',
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
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: '#3182CE',
    fontSize: 14,
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