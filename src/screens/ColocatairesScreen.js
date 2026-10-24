import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  Linking,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { db, auth } from '../config/firebase';
import { formatCleanFullName } from '../utils/nameFormatter';

const UNIVERSITES = [
  { id: 'TOUS', nom: 'Toutes les zones' },
  { id: 'UCAD', nom: 'UCAD (Dakar)' },
  { id: 'UGB', nom: 'UGB (Saint-Louis)' },
  { id: 'USSEIN', nom: 'USSEIN (Sine Saloum)' },
  { id: 'UASZ', nom: 'UASZ (Ziguinchor)' },
  { id: 'UIDT', nom: 'UIDT (Thiès)' },
  { id: 'UAM', nom: 'UAM (Diamniadio)' },
  { id: 'URDFS', nom: 'URDFS (Dakar-Plateau)' },
  { id: 'USO', nom: 'USO (Tambacounda)' },
  { id: 'ISM', nom: 'ISM (Dakar)' },
  { id: 'IAM', nom: 'IAM (Dakar)' },
  { id: 'SupDeCo', nom: 'SupDeCo (Dakar)' },
  { id: 'ESMT', nom: 'ESMT (Dakar)' },
  { id: 'CESAG', nom: 'CESAG (Dakar)' },
  { id: 'UCAO', nom: 'UCAO (Dakar)' },
  { id: 'DIT', nom: 'DIT (Dakar)' },
  { id: 'AFI-UE', nom: 'AFI-UE (Dakar)' },
  { id: 'ESEBAT', nom: 'ESEBAT (Dakar)' },
  { id: 'CEFAS', nom: 'CEFAS (Dakar)' },
];

export default function ColocatairesScreen({ navigation }) {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUni, setSelectedUni] = useState('TOUS');

  // Recharge automatiquement les annonces dès qu'on revient sur l'écran
  useFocusEffect(
    useCallback(() => {
      fetchAnnonces(selectedUni);
    }, [selectedUni])
  );

  const fetchAnnonces = async (uniFilter) => {
    setLoading(true);
    try {
      let q = collection(db, "coloc_annonces");
      if (uniFilter !== 'TOUS') {
        q = query(collection(db, "coloc_annonces"), where("universiteId", "==", uniFilter));
      }

      const querySnapshot = await getDocs(q);
      let list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });

      setAnnonces(list);
    } catch (error) {
      console.error("Erreur lors du chargement des annonces de colocation :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppContact = (telephone, nomEtudiant, universiteId) => {
    if (!telephone) {
      Alert.alert(
        "Numéro indisponible",
        "Cet étudiant n'a pas laissé de numéro WhatsApp dans son annonce. Vous pouvez lui envoyer un message via le bouton 'Discuter'."
      );
      return;
    }

    // Nettoyage et formatage du numéro pour le Sénégal
    let cleanPhone = String(telephone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('00221')) {
      cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.startsWith('221')) {
      // Déjà avec l'indicatif 221
    } else if (cleanPhone.length === 9) {
      cleanPhone = `221${cleanPhone}`;
    }

    const prenom = nomEtudiant ? nomEtudiant.split(' ')[0] : 'camarade';
    const message = `Bonjour ${prenom}, j'ai vu votre annonce de colocation (${universiteId || 'LogeÉtudiant'}) sur l'application LogeÉtudiant. Êtes-vous toujours à la recherche d'un colocataire ?`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch((err) => {
      console.error("Erreur ouverture WhatsApp :", err);
      Linking.openURL(`tel:${cleanPhone}`);
    });
  };

  const handleDeleteAnnonce = (id) => {
    Alert.alert(
      "Supprimer l'annonce",
      "Voulez-vous vraiment retirer votre annonce de colocation ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "coloc_annonces", id));
              setAnnonces(prev => prev.filter(a => a.id !== id));
              Alert.alert("Succès", "Votre annonce a bien été supprimée.");
            } catch (err) {
              console.error("Erreur suppression annonce :", err);
              Alert.alert("Erreur", "Impossible de supprimer l'annonce pour le moment.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP NAVBAR FIXE SANS SUPERPOSITION */}
      <View style={styles.fixedNavbar}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.navBackBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1E40AF" />
        </TouchableOpacity>

        <Text style={styles.navTitle}>Recherche Colocataires</Text>

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('AjouterColocAnnonce')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 2 }} />
          <Text style={styles.addButtonText}>Publier</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Filtres par zone (Toutes les 18 universités du Sénégal) */}
        <View style={styles.filterWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            {UNIVERSITES.map((uni) => (
              <TouchableOpacity
                key={uni.id}
                style={[styles.filterChip, selectedUni === uni.id && styles.filterChipSelected]}
                onPress={() => setSelectedUni(uni.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterText, selectedUni === uni.id && styles.filterTextSelected]}>
                  {uni.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Liste des annonces */}
        {loading ? (
          <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 40 }} />
        ) : annonces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#94A3B8" style={{ marginBottom: 10 }} />
            <Text style={styles.emptyText}>Aucune annonce de colocation pour cette zone.</Text>
          </View>
        ) : (
          <FlatList
            data={annonces}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => {
              const isMyPost = auth.currentUser && item.etudiantId === auth.currentUser.uid;

              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.authorRow}>
                      <Ionicons name="person-circle" size={20} color="#1E40AF" style={{ marginRight: 6 }} />
                      <Text style={styles.authorName}>{formatCleanFullName(item.nomEtudiant)}</Text>
                      {isMyPost && (
                        <View style={styles.myPostBadge}>
                          <Text style={styles.myPostText}>Mon annonce</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.universiteId}</Text>
                    </View>
                  </View>

                  <Text style={styles.description}>{item.description}</Text>

                  <View style={styles.cardFooter}>
                    <View style={styles.budgetRow}>
                      <Text style={styles.budgetLabel}>Budget max recherché :</Text>
                      <Text style={styles.budgetVal}>
                        {Number(item.budgetMax || 0).toLocaleString()} FCFA
                      </Text>
                    </View>
                    
                    <View style={styles.actionButtonsRow}>
                      {/* Bouton Contacter par WhatsApp (vert authentique WhatsApp #128C7E) */}
                      <TouchableOpacity 
                        style={styles.whatsappButton}
                        onPress={() => handleWhatsAppContact(item.telephone, item.nomEtudiant, item.universiteId)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="logo-whatsapp" size={15} color="#FFF" style={{ marginRight: 5 }} />
                        <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                      </TouchableOpacity>

                      {/* Si ce n'est pas mon annonce : bouton Discuter */}
                      {!isMyPost ? (
                        <TouchableOpacity 
                          style={styles.chatButton}
                          onPress={() => navigation.navigate('Chat', { 
                            recipientId: item.etudiantId, 
                            recipientName: formatCleanFullName(item.nomEtudiant) || "Étudiant",
                            propertyTitle: `Coloc - ${item.universiteId}`
                          })}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="chatbubbles" size={14} color="#FFF" style={{ marginRight: 5 }} />
                          <Text style={styles.chatButtonText}>Discuter</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          {/* Bouton Modifier pour le propriétaire de l'annonce */}
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => navigation.navigate('AjouterColocAnnonce', { annonceToEdit: item })}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="create-outline" size={14} color="#1E40AF" style={{ marginRight: 4 }} />
                            <Text style={styles.editButtonText}>Modifier</Text>
                          </TouchableOpacity>

                          {/* Bouton Supprimer */}
                          <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => handleDeleteAnnonce(item.id)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="trash-outline" size={16} color="#DC2626" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  fixedNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  navBackBtn: {
    padding: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  addButton: { 
    backgroundColor: '#1E40AF', 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 12 },
  filterWrapper: { marginBottom: 12 },
  filterContainer: { flexDirection: 'row', maxHeight: 42 },
  filterChip: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#CBD5E0', 
    borderRadius: 20, 
    marginRight: 8, 
    height: 36 
  },
  filterChipSelected: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  filterText: { fontSize: 12, color: '#4A5568', fontWeight: '500' },
  filterTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#718096', fontSize: 14, textAlign: 'center' },
  card: { 
    backgroundColor: '#FFFFFF', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 2 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap', marginRight: 8 },
  authorName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  myPostBadge: { backgroundColor: '#FEFCBF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#F6E05E', marginLeft: 8 },
  myPostText: { fontSize: 10, fontWeight: 'bold', color: '#744210' },
  badge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE' },
  badgeText: { color: '#1E40AF', fontSize: 11, fontWeight: 'bold' },
  description: { fontSize: 14, color: '#475569', marginBottom: 12, lineHeight: 20 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  budgetLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  budgetVal: { fontSize: 15, fontWeight: 'bold', color: '#16A34A' },
  actionButtonsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  whatsappButton: { 
    backgroundColor: '#128C7E', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 8 
  },
  whatsappButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  chatButton: { 
    backgroundColor: '#1E40AF', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 8 
  },
  chatButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  editButton: { 
    backgroundColor: '#EFF6FF', 
    borderWidth: 1, 
    borderColor: '#BFDBFE', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: { 
    color: '#1E40AF', 
    fontWeight: 'bold', 
    fontSize: 12 
  },
  deleteButton: { 
    backgroundColor: '#FFF5F5', 
    borderWidth: 1, 
    borderColor: '#FEB2B2', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
});
