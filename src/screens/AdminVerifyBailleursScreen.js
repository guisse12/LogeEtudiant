import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Linking,
  ScrollView,
  Image,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { formatCleanFullName } from '../utils/nameFormatter';

export default function AdminVerifyBailleursScreen() {
  const [bailleurs, setBailleurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('en_attente'); // 'en_attente', 'valide', 'rejete', 'tous'
  const [previewDocModal, setPreviewDocModal] = useState({ visible: false, uris: [] });

  const fetchBailleurs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "bailleur"));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setBailleurs(list);
    } catch (error) {
      console.error("Erreur chargement bailleurs :", error);
      Alert.alert("Erreur", "Impossible de charger les bailleurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBailleurs();
  }, []);

  const handleUpdateStatus = (userId, nomBailleur, nouveauStatut) => {
    const actionLabel = nouveauStatut === 'valide' ? 'valider et certifier' : 'rejeter';
    
    Alert.alert(
      "Confirmation",
      `Voulez-vous vraiment ${actionLabel} le compte de ${nomBailleur || 'ce bailleur'} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: nouveauStatut === 'valide' ? "Valider" : "Rejeter",
          style: nouveauStatut === 'valide' ? "default" : "destructive",
          onPress: async () => {
            try {
              const userRef = doc(db, "users", userId);
              await updateDoc(userRef, {
                statutValidation: nouveauStatut,
                updatedAt: new Date()
              });
              Alert.alert("Succès ✨", `Le compte bailleur est désormais : ${nouveauStatut.toUpperCase()}`);
              fetchBailleurs();
            } catch (error) {
              console.error("Erreur modification statut :", error);
              Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
            }
          }
        }
      ]
    );
  };

  const handleOpenJustificatifs = (docs) => {
    if (!docs) {
      Alert.alert("Information", "Aucun justificatif fourni.");
      return;
    }

    let uris = [];
    if (Array.isArray(docs)) {
      uris = docs;
    } else if (typeof docs === 'string') {
      uris = [docs];
    }

    if (uris.length === 0) {
      Alert.alert("Information", "Aucun justificatif disponible.");
      return;
    }

    setPreviewDocModal({ visible: true, uris });
  };

  const filteredBailleurs = bailleurs.filter((b) => {
    if (filterTab === 'tous') return true;
    if (filterTab === 'en_attente') return !b.statutValidation || b.statutValidation === 'en_attente';
    return b.statutValidation === filterTab;
  });

  const pendingCount = bailleurs.filter(b => !b.statutValidation || b.statutValidation === 'en_attente').length;
  const validCount = bailleurs.filter(b => b.statutValidation === 'valide').length;
  const rejectedCount = bailleurs.filter(b => b.statutValidation === 'rejete').length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3182CE" />
        <Text style={styles.loadingText}>Vérification des profils bailleurs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ONGLET DE FILTRAGE DES STATUTS */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, filterTab === 'en_attente' && styles.tabBtnActive]}
          onPress={() => setFilterTab('en_attente')}
        >
          <Text style={[styles.tabText, filterTab === 'en_attente' && styles.tabTextActive]}>
            ⚡ En attente ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, filterTab === 'valide' && styles.tabBtnActive]}
          onPress={() => setFilterTab('valide')}
        >
          <Text style={[styles.tabText, filterTab === 'valide' && styles.tabTextActive]}>
            ✅ Validés ({validCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, filterTab === 'rejete' && styles.tabBtnActive]}
          onPress={() => setFilterTab('rejete')}
        >
          <Text style={[styles.tabText, filterTab === 'rejete' && styles.tabTextActive]}>
            ❌ Rejetés ({rejectedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, filterTab === 'tous' && styles.tabBtnActive]}
          onPress={() => setFilterTab('tous')}
        >
          <Text style={[styles.tabText, filterTab === 'tous' && styles.tabTextActive]}>
            Tous ({bailleurs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTE DES BAILLEURS */}
      <FlatList
        data={filteredBailleurs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 25 }}
        renderItem={({ item }) => {
          const isPending = !item.statutValidation || item.statutValidation === 'en_attente';
          const isValid = item.statutValidation === 'valide';
          const isRejected = item.statutValidation === 'rejete';

          const docCount = Array.isArray(item.piecesJustificatives) 
            ? item.piecesJustificatives.length 
            : (item.piecesJustificatives ? 1 : 0);

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>
                    {formatCleanFullName(item).charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.info}>
                  <Text style={styles.name}>{formatCleanFullName(item)}</Text>
                  <Text style={styles.metaText}>📧 {item.email}</Text>
                  <Text style={styles.metaText}>📞 {item.telephone || 'Numéro non renseigné'}</Text>
                </View>

                <View style={[
                  styles.statusBadge, 
                  isValid && { backgroundColor: '#C6F6D5', borderColor: '#9AE6B4' },
                  isPending && { backgroundColor: '#FEFCBF', borderColor: '#F6E05E' },
                  isRejected && { backgroundColor: '#FED7D7', borderColor: '#FEB2B2' },
                ]}>
                  <Text style={[
                    styles.statusText,
                    isValid && { color: '#22543D' },
                    isPending && { color: '#744210' },
                    isRejected && { color: '#9B2C2C' },
                  ]}>
                    {isValid ? 'Certifié' : (isRejected ? 'Rejeté' : 'En attente')}
                  </Text>
                </View>
              </View>

              {/* PIÈCES JUSTIFICATIVES & BOUTONS D'ACTION */}
              <View style={styles.actionsRow}>
                {docCount > 0 ? (
                  <TouchableOpacity 
                    style={styles.docBtn}
                    onPress={() => handleOpenJustificatifs(item.piecesJustificatives)}
                  >
                    <Ionicons name="document-attach" size={16} color="#FFFFFF" />
                    <Text style={styles.docBtnText}>Voir pièces ({docCount})</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noDocBadge}>
                    <Text style={styles.noDocText}>Aucune pièce jointe</Text>
                  </View>
                )}

                <View style={styles.statusButtonsGroup}>
                  {!isValid && (
                    <TouchableOpacity 
                      style={styles.approveBtn} 
                      onPress={() => handleUpdateStatus(item.id, item.nom || item.prenom, 'valide')}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.btnText}>Valider</Text>
                    </TouchableOpacity>
                  )}

                  {!isRejected && (
                    <TouchableOpacity 
                      style={styles.rejectBtn} 
                      onPress={() => handleUpdateStatus(item.id, item.nom || item.prenom, 'rejete')}
                    >
                      <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.btnText}>Rejeter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color="#A0AEC0" />
            <Text style={styles.emptyTitle}>Aucun bailleur dans cette catégorie</Text>
            <Text style={styles.emptyText}>Tous les profils bailleurs sont à jour.</Text>
          </View>
        }
      />

      {/* MODAL POUR CONSULTER LES PIÈCES JUSTIFICATIVES */}
      <Modal visible={previewDocModal.visible} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Documents Justificatifs ({previewDocModal.uris.length})</Text>
              <TouchableOpacity onPress={() => setPreviewDocModal({ visible: false, uris: [] })}>
                <Ionicons name="close-circle" size={26} color="#718096" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalDocScroll}>
              {previewDocModal.uris.map((uri, idx) => (
                <View key={idx} style={styles.docImageContainer}>
                  <Text style={styles.docNumberText}>Document #{idx + 1}</Text>
                  <Image source={{ uri }} style={styles.docImage} resizeMode="contain" />
                </View>
              ))}
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
  
  // TABS
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    padding: 3,
    borderRadius: 10,
    marginBottom: 15,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718096',
  },
  tabTextActive: {
    color: '#3182CE',
    fontWeight: 'bold',
  },

  // CARD
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3182CE',
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1A365D' },
  metaText: { color: '#4A5568', fontSize: 12, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: 'bold' },

  // ACTIONS
  actionsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#EDF2F7', 
    paddingTop: 12,
  },
  docBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#3182CE', 
    paddingVertical: 7, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  docBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  noDocBadge: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  noDocText: { fontSize: 11, color: '#A0AEC0', fontStyle: 'italic' },
  statusButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#38A169', 
    paddingVertical: 7, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  rejectBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#E53E3E', 
    paddingVertical: 7, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

  // EMPTY
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#4A5568', marginTop: 10 },
  emptyText: { fontSize: 13, color: '#718096', marginTop: 4, textAlign: 'center' },

  // MODAL
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A365D' },
  modalDocScroll: { maxHeight: 400 },
  docImageContainer: { marginBottom: 15, alignItems: 'center' },
  docNumberText: { alignSelf: 'flex-start', fontSize: 13, fontWeight: 'bold', color: '#4A5568', marginBottom: 6 },
  docImage: { width: '100%', height: 260, backgroundColor: '#EDF2F7', borderRadius: 10 },
});
