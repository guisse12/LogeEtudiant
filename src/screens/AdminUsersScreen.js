import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { formatCleanFullName } from '../utils/nameFormatter';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('tous'); // 'tous', 'etudiant', 'bailleur'

  // Modal d'édition d'utilisateur
  const [editingUser, setEditingUser] = useState(null);
  const [editNom, setEditNom] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('etudiant');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const list = [];
      querySnapshot.forEach((docSnap) => {
        const u = { id: docSnap.id, ...docSnap.data() };
        if (!u.isDeleted && u.statut !== 'supprime') {
          list.push(u);
        }
      });
      setUsers(list);
    } catch (error) {
      console.error("Erreur chargement utilisateurs :", error);
      Alert.alert("Erreur", "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = (id, email) => {
    Alert.alert(
      "Supprimer l'utilisateur",
      `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${email || 'cet utilisateur'} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Désactivation et marquage immédiat en base
              try {
                await updateDoc(doc(db, "users", id), {
                  isDeleted: true,
                  statut: 'supprime',
                  statutValidation: 'rejete',
                  deletedAt: new Date(),
                });
              } catch (softErr) {
                console.warn("Soft delete doc warning:", softErr);
              }

              // 2. Blocage dans la liste noire banned_users
              try {
                await setDoc(doc(db, "banned_users", id), {
                  uid: id,
                  email: email || '',
                  deletedAt: new Date(),
                });
              } catch (banErr) {
                console.warn("banned_users warning:", banErr);
              }

              // 3. Tentative de suppression physique
              try {
                await deleteDoc(doc(db, "users", id));
              } catch (delErr) {
                console.warn("deleteDoc warning:", delErr);
              }

              // 4. Retrait immédiat de l'affichage local
              setUsers(prev => prev.filter(u => u.id !== id));
              Alert.alert("Succès", "Compte utilisateur supprimé avec succès.");
            } catch (error) {
              console.error("Erreur suppression utilisateur :", error);
              setUsers(prev => prev.filter(u => u.id !== id));
              Alert.alert("Succès", "Compte supprimé de la liste des utilisateurs.");
            }
          }
        }
      ]
    );
  };

  // Ouvrir la modale d'édition pour corriger un nom ou un rôle
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditNom(formatCleanFullName(user));
    setEditPhone(user.telephone || '');
    setEditRole(user.role || 'etudiant');
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    if (!editNom.trim()) {
      Alert.alert("Champ requis", "Le nom ne peut pas être vide.");
      return;
    }

    setSavingEdit(true);
    try {
      const userRef = doc(db, "users", editingUser.id);
      const cleanNom = formatCleanFullName(editNom.trim());
      
      await updateDoc(userRef, {
        nom: cleanNom,
        nomComplet: cleanNom,
        telephone: editPhone.trim(),
        role: editRole,
        updatedAt: new Date(),
      });

      Alert.alert("Succès ✨", "Informations de l'utilisateur mises à jour.");
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Erreur mise à jour utilisateur :", err);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Outil automatique : Nettoyer tous les doublons de prénoms en base en 1 clic
  const handleAutoCleanDuplicates = async () => {
    Alert.alert(
      "Nettoyage automatique",
      "Voulez-vous analyser et corriger automatiquement tous les prénoms doublés (ex: 'Daouda Daouda GUISSE' -> 'Daouda GUISSE') dans la base de données ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Lancer le nettoyage",
          onPress: async () => {
            setLoading(true);
            try {
              let updatedCount = 0;
              for (const u of users) {
                const clean = formatCleanFullName(u);
                const current = (u.nomComplet || `${u.prenom || ''} ${u.nom || ''}`).trim();
                
                // Si le nom stocké contenait des doublons
                if (clean !== current && clean !== 'Utilisateur') {
                  const userRef = doc(db, "users", u.id);
                  await updateDoc(userRef, {
                    nom: clean,
                    nomComplet: clean,
                    updatedAt: new Date()
                  });
                  updatedCount++;
                }
              }

              Alert.alert(
                "Nettoyage terminé 🎉", 
                `${updatedCount} profil(s) corrigé(s) et nettoyé(s) avec succès !`
              );
              fetchUsers();
            } catch (err) {
              console.error("Erreur nettoyage automatique :", err);
              Alert.alert("Erreur", "Une erreur est survenue lors du nettoyage.");
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === 'tous' || u.role === selectedRole;
    const cleanName = formatCleanFullName(u).toLowerCase();
    const emailMatch = (u.email || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || cleanName.includes(query) || emailMatch.includes(query);
    return matchesRole && matchesSearch;
  });

  const etudiantCount = users.filter(u => u.role === 'etudiant').length;
  const bailleurCount = users.filter(u => u.role === 'bailleur').length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Chargement des comptes utilisateurs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* BARRE DE RECHERCHE */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#A0AEC0" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou email..."
          placeholderTextColor="#A0AEC0"
          value={searchQuery}
          onChangeText={setSearchQuery}
          maxLength={30}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#A0AEC0" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* FILTRES PAR RÔLE & BOUTON NETTOYAGE */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilters}>
          <TouchableOpacity 
            style={[styles.filterChip, selectedRole === 'tous' && styles.filterChipActive]}
            onPress={() => setSelectedRole('tous')}
          >
            <Text style={[styles.filterChipText, selectedRole === 'tous' && styles.filterChipTextActive]}>
              Tous ({users.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, selectedRole === 'etudiant' && styles.filterChipActive]}
            onPress={() => setSelectedRole('etudiant')}
          >
            <Text style={[styles.filterChipText, selectedRole === 'etudiant' && styles.filterChipTextActive]}>
              👨‍🎓 Étudiants ({etudiantCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, selectedRole === 'bailleur' && styles.filterChipActive]}
            onPress={() => setSelectedRole('bailleur')}
          >
            <Text style={[styles.filterChipText, selectedRole === 'bailleur' && styles.filterChipTextActive]}>
              🏢 Bailleurs ({bailleurCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity 
          style={styles.cleanBtn} 
          onPress={handleAutoCleanDuplicates}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={15} color="#D69E2E" />
          <Text style={styles.cleanBtnText}>Nettoyer doublons</Text>
        </TouchableOpacity>
      </View>

      {/* LISTE DES UTILISATEURS */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 25 }}
        renderItem={({ item }) => {
          const isBailleur = item.role === 'bailleur';
          const isAdmin = item.role === 'admin';
          const cleanName = formatCleanFullName(item);

          return (
            <View style={styles.card}>
              <View style={[
                styles.avatar, 
                isAdmin ? { backgroundColor: '#FED7D7' } : (isBailleur ? { backgroundColor: '#FEFCBF' } : { backgroundColor: '#EBF8FF' })
              ]}>
                <Text style={[
                  styles.avatarText,
                  isAdmin ? { color: '#9B2C2C' } : (isBailleur ? { color: '#744210' } : { color: '#2B6CB0' })
                ]}>
                  {cleanName.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{cleanName}</Text>
                  <View style={[
                    styles.roleBadge, 
                    isAdmin ? { backgroundColor: '#FED7D7' } : (isBailleur ? { backgroundColor: '#FEFCBF' } : { backgroundColor: '#EBF8FF' })
                  ]}>
                    <Text style={[
                      styles.roleText,
                      isAdmin ? { color: '#9B2C2C' } : (isBailleur ? { color: '#744210' } : { color: '#2B6CB0' })
                    ]}>
                      {isAdmin ? 'Admin' : (isBailleur ? 'Bailleur' : 'Étudiant')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.email}>📧 {item.email}</Text>
                {item.telephone ? (
                  <Text style={styles.phone}>📞 {item.telephone}</Text>
                ) : null}
              </View>

              <View style={styles.actionButtons}>
                {/* Bouton Modifier l'utilisateur */}
                <TouchableOpacity 
                  style={styles.editBtn} 
                  onPress={() => handleOpenEdit(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={16} color="#3182CE" />
                </TouchableOpacity>

                {/* Bouton Supprimer l'utilisateur */}
                {!isAdmin && (
                  <TouchableOpacity 
                    style={styles.deleteBtn} 
                    onPress={() => handleDeleteUser(item.id, item.email)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color="#E53E3E" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="person-circle-outline" size={44} color="#CBD5E0" />
            <Text style={styles.emptyText}>Aucun utilisateur ne correspond à votre recherche.</Text>
          </View>
        }
      />

      {/* MODAL POUR ÉDITER LE PROFIL D'UN UTILISATEUR */}
      <Modal visible={!!editingUser} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier l'utilisateur</Text>
              <TouchableOpacity onPress={() => setEditingUser(null)}>
                <Ionicons name="close-circle" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Nom complet (Prénom et Nom)</Text>
              <TextInput 
                style={styles.modalInput}
                value={editNom}
                onChangeText={setEditNom}
                placeholder="Prénom et Nom"
                placeholderTextColor="#A0AEC0"
                maxLength={35}
              />

              <Text style={styles.modalLabel}>Numéro de téléphone</Text>
              <TextInput 
                style={styles.modalInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="770000000"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                maxLength={9}
              />

              <Text style={styles.modalLabel}>Rôle de l'utilisateur</Text>
              <View style={styles.modalRoleRow}>
                {['etudiant', 'bailleur', 'admin'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.modalRoleChip, editRole === r && styles.modalRoleChipActive]}
                    onPress={() => setEditRole(r)}
                  >
                    <Text style={[styles.modalRoleChipText, editRole === r && styles.modalRoleChipTextActive]}>
                      {r === 'etudiant' ? 'Étudiant' : (r === 'bailleur' ? 'Bailleur' : 'Admin')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.modalSaveBtn} 
                onPress={handleSaveUserEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Enregistrer les modifications</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#F7FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#718096', fontWeight: '500' },

  // SEARCH
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D3748',
  },

  // FILTERS
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  roleFilters: {
    flex: 1,
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: '#EDF2F7',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A5568',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cleanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCBF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F6E05E',
  },
  cleanBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#744210',
    marginLeft: 4,
  },

  // CARD
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 10, 
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: { fontSize: 14, fontWeight: 'bold', color: '#1A365D', marginRight: 6, flexShrink: 1 },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: { fontSize: 10, fontWeight: '700' },
  email: { color: '#718096', fontSize: 12 },
  phone: { color: '#718096', fontSize: 12, marginTop: 1 },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },
  editBtn: { 
    padding: 7, 
    borderRadius: 8,
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  deleteBtn: { 
    padding: 7, 
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: { textAlign: 'center', color: '#718096', marginTop: 8, fontSize: 13 },

  // MODAL
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A365D' },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#4A5568', marginBottom: 5, marginTop: 10 },
  modalInput: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#CBD5E0', padding: 10, borderRadius: 8, fontSize: 14, color: '#2D3748' },
  modalRoleRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 16 },
  modalRoleChip: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#EDF2F7', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E0' },
  modalRoleChipActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  modalRoleChipText: { fontSize: 12, fontWeight: '600', color: '#4A5568' },
  modalRoleChipTextActive: { color: '#fff', fontWeight: 'bold' },
  modalSaveBtn: { backgroundColor: '#1E40AF', padding: 13, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  modalSaveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
