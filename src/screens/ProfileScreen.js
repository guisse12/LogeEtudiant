import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { logoutUser } from '../services/authService';

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Modale de changement de mot de passe en direct (100% par numéro, sans email)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  
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
        if (!user) {
          setLoading(false);
          return;
        }

        const initialAuthEmail = (user.email || '').toLowerCase();
        const isAuthAdmin = 
          initialAuthEmail === '763318157@logeetudiant.sn' || 
          initialAuthEmail === 'aeers1997@gmail.com' ||
          initialAuthEmail.includes('763318157') ||
          initialAuthEmail === 'capico767@gmail.com' ||
          initialAuthEmail === 'capico115@gmail.com' ||
          initialAuthEmail.includes('admin');

        if (isAuthAdmin) {
          setEmail('aeers1997@gmail.com');
          setRole('admin');
          setNom('Daouda GUISSE');
          setTelephone('763318157');
          setFonction('Super-Administrateur');
        } else {
          setEmail(user.email || '');
        }

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

          const userPhone = data.telephone || '';
          const userEmail = (user.email || '').toLowerCase();
          const cleanDigits = userPhone.replace(/[^0-9]/g, '');

          const isSuperAdmin = 
            isAuthAdmin ||
            data.role === 'admin' ||
            cleanDigits === '763318157' ||
            userEmail === 'aeers1997@gmail.com' ||
            userEmail === '763318157@logeetudiant.sn' ||
            userEmail === 'capico767@gmail.com' ||
            userEmail === 'capico115@gmail.com' ||
            userEmail.includes('admin') ||
            data.email === 'aeers1997@gmail.com' ||
            data.adminEmail === 'aeers1997@gmail.com';

          if (isSuperAdmin) {
            setEmail('aeers1997@gmail.com');
          } else {
            setEmail(data.email || user.email || '');
          }

          setNom(fullName || (isSuperAdmin ? 'Daouda GUISSE' : ''));
          setTelephone(userPhone || (isSuperAdmin ? '763318157' : ''));
          setUniversite(data.universite || '');
          setFonction(data.fonction || data.poste || 'Super-Administrateur');
          setRole(isSuperAdmin ? 'admin' : (data.role || 'etudiant').toLowerCase());
        }
      } catch (error) {
        console.error("Erreur chargement profil :", error);
        // Fallback sécurisé en cas d'erreur réseau
        const curEmail = (auth.currentUser?.email || '').toLowerCase();
        if (curEmail.includes('763318157') || curEmail === 'aeers1997@gmail.com') {
          setEmail('aeers1997@gmail.com');
          setRole('admin');
          setNom('Daouda GUISSE');
          setTelephone('763318157');
          setFonction('Super-Administrateur');
        }
      } finally {
        setLoading(false);
      }
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
        updateData.role = 'admin';
        updateData.email = 'aeers1997@gmail.com';
        updateData.adminEmail = 'aeers1997@gmail.com';
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

  // Modification directe du mot de passe en direct (100% sans aucun e-mail)
  const handleSaveDirectPassword = async () => {
    const p1 = newPass.trim();
    const p2 = confirmPass.trim();

    if (p1.length !== 6) {
      Alert.alert("Mot de passe invalide", "Le mot de passe doit comporter exactement 6 chiffres.");
      return;
    }

    if (p1 !== p2) {
      Alert.alert("Erreur", "Les deux mots de passe saisis ne sont pas identiques.");
      return;
    }

    setSavingPass(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Session expirée", "Veuillez vous reconnecter.");
        return;
      }

      await updatePassword(user, p1);

      try {
        await updateDoc(doc(db, "users", user.uid), {
          authKey: p1,
          updatedAt: new Date()
        });
      } catch (e) {}

      Alert.alert("Succès 🎉", "Votre mot de passe a été modifié avec succès !");
      setPasswordModalVisible(false);
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      console.error("Erreur updatePassword :", err);
      if (err.code === 'auth/requires-recent-login') {
        Alert.alert(
          "Sécurité renforcée", 
          "Pour changer votre mot de passe, veuillez vous reconnecter avec votre numéro avant de réessayer."
        );
      } else {
        Alert.alert("Erreur", "Impossible de mettre à jour le mot de passe pour le moment.");
      }
    } finally {
      setSavingPass(false);
    }
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

  const curAuthEmail = (auth.currentUser?.email || '').toLowerCase();
  const isAdmin = 
    role === 'admin' || 
    email.toLowerCase() === 'aeers1997@gmail.com' ||
    curAuthEmail === '763318157@logeetudiant.sn' ||
    curAuthEmail === 'aeers1997@gmail.com' ||
    curAuthEmail.includes('763318157') ||
    telephone === '763318157';
  const isBailleur = !isAdmin && role === 'bailleur';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* BARRE DE RETOUR */}
      <View style={styles.topNavRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#003880" style={{ marginRight: 4 }} />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        
        {isAdmin && (
          <View style={styles.adminMiniTag}>
            <Ionicons name="shield-checkmark" size={13} color="#E8A008" style={{ marginRight: 4 }} />
            <Text style={styles.adminMiniTagText}>Panneau Admin</Text>
          </View>
        )}
      </View>

      {/* CARTE PRINCIPALE DU PROFIL */}
      <View style={styles.card}>
        
        {/* AVATAR DYNAMIQUE (BLEU DU LOGO & OR DORÉ) */}
        <View style={[
          styles.avatarContainer,
          isAdmin && { backgroundColor: '#003880', borderColor: '#E8A008', borderWidth: 3 },
        ]}>
          {isAdmin ? (
            <Ionicons name="shield-checkmark" size={38} color="#E8A008" />
          ) : (
            <Text style={styles.avatarText}>
              {nom ? nom.charAt(0).toUpperCase() : (telephone ? telephone.charAt(0) : 'U')}
            </Text>
          )}
        </View>

        <Text style={styles.userNameText}>{nom || (isAdmin ? 'Daouda GUISSE' : 'Utilisateur')}</Text>
        <Text style={styles.userEmail}>
          {isAdmin 
            ? 'aeers1997@gmail.com' 
            : (telephone 
                ? `📞 +221 ${telephone}` 
                : (email && !email.endsWith('@logeetudiant.sn') ? email : ''))}
        </Text>

        {/* BADGE DE RÔLE OFFICIEL (BLEU & OR) */}
        <View style={[
          styles.roleBadge,
          isAdmin && { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
          isBailleur && { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
        ]}>
          <Text style={[
            styles.roleBadgeText,
            isAdmin && { color: '#003880' },
            isBailleur && { color: '#92400E' },
          ]}>
            {isAdmin ? '🛡️ Administrateur Système' : (isBailleur ? '🏢 Propriétaire Bailleur' : '👨‍🎓 Compte Étudiant')}
          </Text>
        </View>

        {/* NOTICE SPÉCIALE ADMIN */}
        {isAdmin && (
          <View style={styles.adminNoticeBox}>
            <Ionicons name="lock-closed" size={16} color="#003880" style={{ marginRight: 6 }} />
            <Text style={styles.adminNoticeText}>
              Ce compte dispose des autorisations complètes sur la modération des logements et la sécurité de Logetu.
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
          maxLength={35}
        />

        {/* CHAMP TÉLÉPHONE */}
        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Numéro de téléphone" 
          placeholderTextColor="#A0AEC0"
          keyboardType="numeric"
          maxLength={9}
          value={telephone} 
          onChangeText={setTelephone} 
        />

        {/* CHAMP SELON LE RÔLE */}
        {isAdmin ? (
          <>
            <Text style={styles.label}>Fonction / Rôle administratif</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Super-Administrateur, Responsable Sécurité..." 
              placeholderTextColor="#A0AEC0"
              value={fonction} 
              onChangeText={setFonction} 
              maxLength={30}
            />
          </>
        ) : (
          <>
            <Text style={styles.label}>Université / Campus principal</Text>
            <TextInput 
              style={styles.input} 
              placeholder="UCAD, UGB, UIDT..." 
              placeholderTextColor="#A0AEC0"
              value={universite} 
              onChangeText={setUniversite} 
              maxLength={25}
            />
          </>
        )}

        {/* BOUTON ENREGISTRER (BLEU ROYAL HARMONISÉ) */}
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

        {/* ACCÈS DIRECT AU TABLEAU DE BORD ADMIN */}
        {isAdmin && (
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: '#003880', marginTop: 10, borderColor: '#003880' }]} 
            onPress={() => navigation.navigate('AdminHome')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="speedometer-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveButtonText}>📊 Tableau de Bord Administrateur</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* SECTION MOT DE PASSE ET SÉCURITÉ (100% PAR NUMÉRO, AUCUN E-MAIL) */}
        <View style={styles.securityDivider} />
        
        <TouchableOpacity 
          style={styles.passwordBtn} 
          onPress={() => {
            setNewPass('');
            setConfirmPass('');
            setPasswordModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="key-outline" size={18} color="#003880" style={{ marginRight: 6 }} />
          <Text style={styles.passwordBtnText}>Changer mon mot de passe</Text>
        </TouchableOpacity>

      </View>

      {/* BOUTON DÉCONNEXION */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#9B2C2C" style={{ marginRight: 6 }} />
        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
      </TouchableOpacity>

      {/* MODALE DE MODIFICATION DU MOT DE PASSE SANS AUCUN EMAIL */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalBar} />

            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconBox}>
                <Ionicons name="lock-closed" size={22} color="#003880" />
              </View>
              <TouchableOpacity 
                style={styles.modalCloseBtn} 
                onPress={() => setPasswordModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Modifier mon mot de passe</Text>
            <Text style={styles.modalDesc}>
              Saisissez votre nouveau mot de passe à <Text style={{ fontWeight: 'bold' }}>6 chiffres</Text> pour sécuriser votre compte.
            </Text>

            {/* CHAMP NOUVEAU MOT DE PASSE */}
            <View style={[styles.modalInputContainer, { marginTop: 14 }]}>
              <Ionicons name="key-outline" size={19} color="#003880" style={{ marginRight: 8 }} />
              <TextInput 
                style={styles.modalInputField}
                placeholder="Nouveau mot de passe (6 chiffres)"
                placeholderTextColor="#94A3B8"
                value={newPass}
                onChangeText={setNewPass}
                secureTextEntry={!showPass}
                keyboardType="numeric"
                maxLength={6}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* CHAMP CONFIRMATION */}
            <View style={[styles.modalInputContainer, { marginTop: 10 }]}>
              <Ionicons name="shield-checkmark-outline" size={19} color="#003880" style={{ marginRight: 8 }} />
              <TextInput 
                style={styles.modalInputField}
                placeholder="Confirmer les 6 chiffres"
                placeholderTextColor="#94A3B8"
                value={confirmPass}
                onChangeText={setConfirmPass}
                secureTextEntry={!showPass}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <TouchableOpacity 
              style={styles.modalActionBtn}
              onPress={handleSaveDirectPassword}
              disabled={savingPass}
              activeOpacity={0.85}
            >
              {savingPass ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalActionBtnText}>Valider mon nouveau mot de passe</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancelBtn}
              onPress={() => setPasswordModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    color: '#003880', 
    fontWeight: 'bold' 
  },
  adminMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  adminMiniTagText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#003880',
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
    backgroundColor: '#003880', // Bleu nuit officiel
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#E8A008', // Ocre doré officiel du logo
    elevation: 2,
  },
  avatarText: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  },
  userNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  userEmail: { 
    fontSize: 13, 
    fontWeight: '500', 
    color: '#64748B', 
    marginBottom: 10 
  },
  roleBadge: { 
    backgroundColor: '#EFF6FF', 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 14, 
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleBadgeText: { 
    color: '#003880', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  adminNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#003880',
    marginBottom: 16,
    width: '100%',
  },
  adminNoticeText: {
    fontSize: 11,
    color: '#003880',
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
    backgroundColor: '#003880', // Remplacé par Bleu Royal
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    borderRadius: 10,
  },
  passwordBtnText: {
    color: '#003880',
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

  // STYLES MODALE DIRECTE
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalBar: {
    width: 44,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalInputField: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  modalActionBtn: {
    backgroundColor: '#003880',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalCancelBtn: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});
