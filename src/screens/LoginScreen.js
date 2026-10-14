import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loginUser, resetPassword } from '../services/authService';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState(null); // Stocke l'utilisateur non vérifié pour le renvoi

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    setUnverifiedUser(null);
    try {
      const result = await loginUser(email, password);

      if (result.success) {
        const role = result.userInfo?.role;
        
        // Redirection selon le rôle récupéré depuis Firestore
        if (role === 'admin') {
          navigation.replace('AdminHome');
        } else if (role === 'bailleur') {
          navigation.replace('BailleurHome');
        } else {
          navigation.replace('EtudiantHome');
        }
      } else {
        // Si l'erreur concerne le compte non vérifié, on garde l'instance sous le coude pour proposer le renvoi
        if (auth.currentUser && !auth.currentUser.emailVerified) {
          setUnverifiedUser(auth.currentUser);
        }
        Alert.alert('Erreur de connexion', result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur technique est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    try {
      await sendEmailVerification(unverifiedUser);
      Alert.alert('Succès', 'Un nouvel e-mail de confirmation vient de vous être envoyé.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de renvoyer l\'e-mail pour le moment. Réessayez plus tard.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Champ requis', 'Veuillez entrer votre adresse email ci-dessus pour réinitialiser votre mot de passe.');
      return;
    }

    try {
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

      {/* Champ Mot de passe avec icône œil intégrée */}
      <View style={[styles.inputContainer, styles.input]}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={22} 
            color="#718096" 
          />
        </TouchableOpacity>
      </View>

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

      {/* Bouton conditionnel si l'utilisateur n'a pas validé son e-mail */}
      {unverifiedUser && (
        <TouchableOpacity style={styles.resendButton} onPress={handleResendVerification}>
          <Text style={styles.resendButtonText}>Renvoyer l'e-mail de confirmation</Text>
        </TouchableOpacity>
      )}
      
      {/* Lien Inscription sur la même ligne */}
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <Text style={{ color: '#666', fontSize: 14 }}>
          Pas encore de compte ?{' '}
          <Text 
            style={{ color: '#3182CE', fontWeight: 'bold' }} 
            onPress={() => navigation.navigate('Register')}
          >
            S'inscrire
          </Text>
        </Text>
      </View>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeIcon: {
    paddingRight: 12,
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
  resendButton: {
    backgroundColor: '#ED8936',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#3182CE',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});