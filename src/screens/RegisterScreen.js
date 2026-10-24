import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Image } from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../config/firebase';
import { cleanRegistrationNames } from '../utils/nameFormatter';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [role, setRole] = useState('etudiant'); // 'etudiant' ou 'bailleur'
  const [justificatifsUris, setJustificatifsUris] = useState([]); // Tableau contenant jusqu'à 5 fichiers/photos
  const [loading, setLoading] = useState(false);

  // Fonction pour proposer le choix : Appareil photo ou Galerie
  const handleAddJustificatif = () => {
    if (justificatifsUris.length >= 5) {
      Alert.alert("Limite atteinte", "Vous pouvez ajouter 5 pièces justificatives au maximum.");
      return;
    }

    Alert.alert(
      "Ajouter une pièce justificative",
      "Choisissez une option pour transmettre votre document (CNI, RCCM, etc.)",
      [
        {
          text: "📷 Prendre une photo",
          onPress: handleTakePhoto,
        },
        {
          text: "📁 Choisir dans la galerie",
          onPress: handlePickFromGallery,
        },
        {
          text: "Annuler",
          style: "cancel",
        },
      ]
    );
  };

  // 1. Prendre une photo directement avec l'appareil photo
  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission refusée", "L'accès à l'appareil photo est requis.");
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
      console.error("Erreur prise de photo :", error);
      Alert.alert("Erreur", "Impossible de prendre la photo.");
    }
  };

  // 2. Sélectionner une ou plusieurs images depuis la galerie
  const handlePickFromGallery = async () => {
    const remainingSlots = 5 - justificatifsUris.length;

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission refusée", "L'accès à la galerie est requis.");
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
      console.error("Erreur sélection galerie :", error);
      Alert.alert("Erreur", "Impossible de sélectionner les fichiers.");
    }
  };

  // Supprimer un document spécifique de la liste
  const handleRemoveJustificatif = (indexToRemove) => {
    setJustificatifsUris(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleRegister = async () => {
    const cleanEmail = email.trim();
    const cleanPhone = telephone.trim();

    if (!cleanEmail || !password || !nom.trim() || !prenom.trim() || !cleanPhone) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Mot de passe trop court", "Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    const { prenom: finalPrenom, nom: finalNom, nomComplet: finalNomComplet } = cleanRegistrationNames(prenom, nom);

    if (role === 'bailleur' && justificatifsUris.length === 0) {
      Alert.alert(
        "Justificatif requis", 
        "En tant que bailleur, vous devez fournir au moins une pièce justificative pour la vérification de votre compte."
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Création du compte dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // 2. Envoi du lien de confirmation par e-mail
      try {
        await sendEmailVerification(user);
      } catch (emailErr) {
        console.warn("Erreur envoi email vérification :", emailErr);
      }

      // 3. Enregistrement dans Firestore avec noms nettoyés
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: cleanEmail,
        nom: finalNom,
        prenom: finalPrenom,
        nomComplet: finalNomComplet,
        telephone: cleanPhone,
        role: role,
        statutValidation: role === 'bailleur' ? 'en_attente' : 'valide',
        piecesJustificatives: justificatifsUris, // Enregistre le tableau de 1 à 5 justificatifs
        createdAt: new Date(),
      });

      // 4. Déconnexion immédiate : l'utilisateur doit obligatoirement confirmer son email avant de pouvoir se connecter
      await signOut(auth);

      // 5. Message clair informant l'utilisateur
      Alert.alert(
        "Inscription réussie ✉️", 
        `Un e-mail de confirmation a été envoyé à l'adresse :\n${cleanEmail}\n\n1. Ouvrez votre boîte mail (pensez à vérifier vos courriers indésirables / spams).\n2. Cliquez sur le lien pour valider votre compte.\n3. Connectez-vous ensuite à l'application.`,
        [
          {
            text: "Se connecter",
            onPress: () => navigation.replace('Login'),
          }
        ]
      );

    } catch (error) {
      console.error("Erreur d'inscription :", error);
      let errorMsg = "Une erreur est survenue lors de l'inscription.";
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = "Cette adresse e-mail est déjà utilisée par un autre compte.";
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = "L'adresse e-mail saisie n'est pas valide.";
      } else if (error.code === 'auth/weak-password') {
        errorMsg = "Le mot de passe doit comporter au moins 6 caractères.";
      }
      Alert.alert("Erreur", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>
      <Text style={styles.subtitle}>Rejoignez LogeÉtudiant</Text>

      {/* Sélecteur de Rôle */}
      <View style={styles.roleContainer}>
        <TouchableOpacity 
          style={[styles.roleButton, role === 'etudiant' && styles.roleActive]}
          onPress={() => setRole('etudiant')}
        >
          <Text style={[styles.roleText, role === 'etudiant' && styles.roleTextActive]}>Étudiant</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.roleButton, role === 'bailleur' && styles.roleActive]}
          onPress={() => setRole('bailleur')}
        >
          <Text style={[styles.roleText, role === 'bailleur' && styles.roleTextActive]}>Bailleur</Text>
        </TouchableOpacity>
      </View>

      <TextInput 
        style={styles.input} 
        placeholder="Prénom" 
        placeholderTextColor="#A0AEC0"
        value={prenom} 
        onChangeText={setPrenom} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Nom" 
        placeholderTextColor="#A0AEC0"
        value={nom} 
        onChangeText={setNom} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Numéro de téléphone" 
        placeholderTextColor="#A0AEC0"
        value={telephone} 
        onChangeText={setTelephone} 
        keyboardType="phone-pad" 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Adresse email" 
        placeholderTextColor="#A0AEC0"
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address" 
        autoCapitalize="none" 
      />

      {/* Champ Mot de passe avec icône œil intégrée */}
      <View style={styles.passwordContainer}>
        <TextInput 
          style={styles.passwordInput} 
          placeholder="Mot de passe (6 caractères min)" 
          placeholderTextColor="#A0AEC0"
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry={!showPassword} 
        />
        <TouchableOpacity 
          onPress={() => setShowPassword(!showPassword)} 
          style={styles.eyeIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={22} 
            color="#718096" 
          />
        </TouchableOpacity>
      </View>

      {/* Section spécifique Bailleur */}
      {role === 'bailleur' && (
        <View style={styles.bailleurSection}>
          <Text style={styles.bailleurSectionTitle}>Vérification du profil Bailleur</Text>
          <Text style={styles.bailleurDesc}>
            Veuillez joindre au moins une pièce justificative (CNI, carte professionnelle ou titre de propriété) pour prouver votre identité.
          </Text>
          
          <TouchableOpacity style={styles.filePickerBtn} onPress={handleAddJustificatif}>
            <Text style={styles.filePickerText}>
              ➕ Ajouter un document ({justificatifsUris.length}/5)
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
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>S'inscrire</Text>
        )}
      </TouchableOpacity>

      {/* Lien vers Connexion */}
      <View style={styles.loginLinkContainer}>
        <Text style={styles.loginLinkText}>
          Vous avez déjà un compte ?{' '}
          <Text 
            style={styles.loginLinkHighlight} 
            onPress={() => navigation.replace('Login')}
          >
            Se connecter
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8F9FA', flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1A365D', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#718096', textAlign: 'center', marginBottom: 20 },
  roleContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#EDF2F7', borderRadius: 8, padding: 4 },
  roleButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  roleActive: { backgroundColor: '#3182CE' },
  roleText: { color: '#4A5568', fontWeight: 'bold', fontSize: 14 },
  roleTextActive: { color: '#fff' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E0', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 14, color: '#2D3748' },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#2D3748',
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  loginLinkContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  loginLinkText: {
    color: '#718096',
    fontSize: 14,
  },
  loginLinkHighlight: {
    color: '#3182CE',
    fontWeight: 'bold',
  },
  bailleurSection: { backgroundColor: '#EBF8FF', borderWidth: 1, borderColor: '#BEE3F8', padding: 15, borderRadius: 8, marginBottom: 15 },
  bailleurSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#2B6CB0', marginBottom: 5 },
  bailleurDesc: { fontSize: 12, color: '#4A5568', marginBottom: 10, lineHeight: 18 },
  filePickerBtn: { backgroundColor: '#3182CE', padding: 10, borderRadius: 6, alignItems: 'center', marginBottom: 10 },
  filePickerText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  previewScroll: { marginTop: 5 },
  thumbContainer: { position: 'relative', marginRight: 10 },
  thumbImage: { width: 65, height: 65, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E0' },
  removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#E53E3E', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#38A169', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});