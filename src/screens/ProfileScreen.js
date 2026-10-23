import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { logoutUser, resetPassword } from '../services/authService';

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [universite, setUniversite] = useState('');
  const [fonction, setFonction] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

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
          
          let fullName = '';

          // 1. Priorité au champ nomComplet s'il existe
          if (data.nomComplet) {
            fullName = data.nomComplet;
          } 
          // 2. Sinon, on combine prenom et nom
          else if (data.prenom && data.nom) {
            const prenomClean = data.prenom.trim();
            const nomClean = data.nom.trim();

            if (nomClean.toLowerCase().startsWith(prenomClean.toLowerCase())) {
              fullName = nomClean;
            } else {
              fullName = `${prenomClean} ${nomClean}`;
            }
          } 
          // 3. Sinon, on prend juste nom ou prenom
          else {
            fullName = data.nom || data.prenom || '';
          }

          fullName = fullName.trim().replace(/\s+/g, ' ');

          setNom(fullName);
          setTelephone(data.telephone || '');
          setUniversite(data.universite || '');
          setFonction(data.fonction || data.poste || 'Super-Administrateur');
          setRole((data.role || 'etudiant').toLowerCase());
        }
      } catch (error) {
        console.error("Erreur chargement profil :", error);
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  // Mettre à jour les informations du profil
  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const user = auth.currentUser;
      if (!user) return;

      const cleanName = nom.trim().replace(/\s+/g, ' ');

      const userDocRef = doc(db, "users", user.uid);
      const updateData = {
        nom: cleanName,
        nomComplet: cleanName,
        telephone: telephone.trim(),
        updatedAt: new Date()
      };

      if (role === 'admin') {
        updateData.fonction = (fonction || 'Super-Administrateur').trim();
      } else {
        updateData.universite = universite.trim();
      }

      await updateDoc(userDocRef, updateData);

      Alert.alert(
        "Succès ✨", 
        role === 'admin' 
          ? "Votre profil administrateur a été mis à jour avec succès !" 
          : "Vos informations personnelles ont été enregistrées avec succès !"
      );
    } catch (error) {
      console.error("Erreur mise à jour profil :", error);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil pour le moment.");
    }
    setUpdating(false);
  };

  // Réinitialisation sécurisée du mot de passe
  const handleResetPassword = () => {
    Alert.alert(
      "Modifier mon mot de passe",
      `Souhaitez-vous recevoir un lien officiel de réinitialisation sécurisé à l'adresse suivante :\n\n${email} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "M'envoyer le lien",
          onPress: async () => {
            setResettingPassword(true);
            try {
              const res = await resetPassword(email);
              if (res.success) {
                Alert.alert(
                  "E-mail envoyé 📬", 
                  "Un lien sécurisé vient d'être envoyé à votre boîte de réception pour définir votre nouveau mot de passe."
                );
              } else {
                Alert.alert("Erreur", res.error);
              }
            } catch (err) {
              Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi de l'e-mail.");
            }
            setResettingPassword(false);
          }
        }
      ]
    );
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter de votre compte ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: async () => {
            try {
              await logoutUser();
              navigation.replace('Login');
            } catch (error) {
              console.error("Erreur déconnexion :", error);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3182CE" />
        <Text style={styles.loaderText}>Chargement des informations du profil...</Text>
      </View>
    );
  }

  const isAdmin = role === 'admin';
  const isBailleur = role === 'bailleur';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* BARRE DE RETOUR */}
      <View style={styles.topNavRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#3182CE" style={{ marginRight: 4 }} />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        
        {isAdmin && (
          <View style={styles.adminMiniTag}>
            <Ionicons name="shield-checkmark" size={13} color="#9B2C2C" style={{ marginRight: 4 }} />
            <Text style={styles.adminMiniTagText}>Panneau Admin</Text>
          </View>
        )}
      </View>

      {/* CARTE PRINCIPALE DU PROFIL */}
      <View style={styles.card}>
        
        {/* AVATAR DYNAMIQUE */}
        <View style={[
          styles.avatarContainer,
          isAdmin && { backgroundColor: '#9B2C2C', borderColor: '#FEB2B2' },
          isBailleur && { backgroundColor: '#D69E2E', borderColor: '#F6E05E' },
        ]}>
          {isAdmin ? (
            <Ionicons name="shield-checkmark" size={36} color="#FFFFFF" />
          ) : (
            <Text style={styles.avatarText}>
              {nom ? nom.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}
            </Text>
          )}
        </View>

        <Text style={styles.userNameText}>{nom || 'Administrateur'}</Text>
        <Text style={styles.userEmail}>{email}</Text>

        {/* BADGE DE RÔLE OFFICIEL */}
        <View style={[
          styles.roleBadge,
          isAdmin && { backgroundColor: '#FED7D7', borderColor: '#FEB2B2' },
          isBailleur && { backgroundColor: '#FEFCBF', borderColor: '#F6E05E' },
        ]}>
          <Text style={[
            styles.roleBadgeText,
            isAdmin && { color: '#9B2C2C' },
            isBailleur && { color: '#744210' },
          ]}>
            {isAdmin ? '🛡️ Administrateur Système' : (isBailleur ? '🏢 Propriétaire Bailleur' : '👨‍🎓 Compte Étudiant')}
          </Text>
        </View>

        {/* NOTICE SPÉCIALE ADMIN */}
        {isAdmin && (
          <View style={styles.adminNoticeBox}>
            <Ionicons name="lock-closed" size={16} color="#2B6CB0" style={{ marginRight: 6 }} />
            <Text style={styles.adminNoticeText}>
              Ce compte dispose des autorisations complètes sur la modération des logements et la sécurité de LogeÉtudiant.
            </Text>
          </View>
        )}

        {/* CHAMP NOM */}
        <Text style={styles.label}>Nom complet</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Votre prénom et nom" 
          placeholderTextColor="#A0AEC0"
          value={nom} 
          onChangeText={setNom} 
        />

        {/* CHAMP TÉLÉPHONE */}
        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ex: +221 77 000 00 00" 
          placeholderTextColor="#A0AEC0"
          keyboardType="phone-pad"
          value={telephone} 
          onChangeText={setTelephone} 
        />

        {/* CHAMP SELON LE RÔLE */}
        {isAdmin ? (
          <>
            <Text style={styles.label}>Fonction / Rôle administratif</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Super-Administrateur, Responsable Sécurité..." 
              placeholderTextColor="#A0AEC0"
              value={fonction} 
              onChangeText={setFonction} 
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Université / Campus principal</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: UCAD, UGB, UIDT..." 
              placeholderTextColor="#A0AEC0"
              value={universite} 
              onChangeText={setUniversite} 
            />
          </>
        )}

        {/* BOUTON ENREGISTRER */}
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleUpdateProfile}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>💾 Enregistrer les modifications</Text>
          )}
        </TouchableOpacity>

        {/* SECTION MOT DE PASSE ET SÉCURITÉ */}
        <View style={styles.securityDivider} />
        
        <TouchableOpacity 
          style={styles.passwordBtn} 
          onPress={handleResetPassword}
          disabled={resettingPassword}
        >
          {resettingPassword ? (
            <ActivityIndicator color="#3182CE" />
          ) : (
            <>
              <Ionicons name="key-outline" size={18} color="#3182CE" style={{ marginRight: 6 }} />
              <Text style={styles.passwordBtnText}>Changer mon mot de passe</Text>
            </>
          )}
        </TouchableOpacity>

      </View>

      {/* BOUTON DÉCONNEXION */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#9B2C2C" style={{ marginRight: 6 }} />
        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 18, 
    backgroundColor: '#F7FAFC', 
    flexGrow: 1, 
    paddingTop: 36,
    paddingBottom: 40 
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F7FAFC' 
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    color: '#718096',
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  backButtonText: { 
    fontSize: 15, 
    color: '#3182CE', 
    fontWeight: 'bold' 
  },
  adminMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FED7D7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEB2B2',
  },
  adminMiniTagText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9B2C2C',
  },
  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    alignItems: 'center', 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: { 
    width: 76, 
    height: 76, 
    borderRadius: 38, 
    backgroundColor: '#3182CE', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#BEE3F8',
    elevation: 2,
  },
  avatarText: { 
    fontSize: 30, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  userNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: 2,
  },
  userEmail: { 
    fontSize: 13, 
    fontWeight: '500', 
    color: '#718096', 
    marginBottom: 10 
  },
  roleBadge: { 
    backgroundColor: '#EBF8FF', 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 14, 
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  roleBadgeText: { 
    color: '#3182CE', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  adminNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3182CE',
    marginBottom: 16,
    width: '100%',
  },
  adminNoticeText: {
    fontSize: 11,
    color: '#2B6CB0',
    flex: 1,
    lineHeight: 16,
  },
  label: { 
    alignSelf: 'flex-start', 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#4A5568', 
    marginBottom: 6,
    marginTop: 2,
  },
  input: { 
    width: '100%', 
    backgroundColor: '#F7FAFC', 
    borderWidth: 1, 
    borderColor: '#CBD5E0', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 14, 
    fontSize: 14, 
    color: '#2D3748' 
  },
  saveButton: { 
    width: '100%', 
    backgroundColor: '#38A169', 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 6,
    elevation: 2,
  },
  saveButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 15 
  },
  securityDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EDF2F7',
    marginVertical: 16,
  },
  passwordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BEE3F8',
    padding: 12,
    borderRadius: 10,
  },
  passwordBtnText: {
    color: '#3182CE',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logoutButton: { 
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5', 
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#FEB2B2',
  },
  logoutButtonText: { 
    color: '#9B2C2C', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
});
