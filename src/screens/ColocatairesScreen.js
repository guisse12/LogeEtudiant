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
  Alert
} from 'react-native';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { db, auth } from '../config/firebase';
import { formatCleanFullName } from '../utils/nameFormatter';

const UNIVERSITES = [
  { id: 'TOUS', nom: 'Toutes les zones' },
  { id: 'UCAD', nom: 'UCAD (Dakar)' },
  { id: 'UGB', nom: 'UGB (Saint-Louis)' },
  { id: 'USSEIN', nom: 'USSEIN (Sine Saloum)'},
  { id: 'UASZ', nom: 'UASZ (Ziguinchor)' },
  { id: 'UIDT', nom: 'UIDT (Thiès)' },
  { id: 'UAM', nom: 'UAM (Diamniadio)'},
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
    }
    setLoading(false);
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
    <View style={styles.container}>
      {/* En-tête avec bouton de publication */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recherche Colocataires</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('AjouterColocAnnonce')}
        >
          <Text style={styles.addButtonText}>+ Publier</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres par zone */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {UNIVERSITES.map((uni) => (
          <TouchableOpacity
            key={uni.id}
            style={[styles.filterChip, selectedUni === uni.id && styles.filterChipSelected]}
            onPress={() => setSelectedUni(uni.id)}
          >
            <Text style={[styles.filterText, selectedUni === uni.id && styles.filterTextSelected]}>
              {uni.nom}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des annonces */}
      {loading ? (
        <ActivityIndicator size="large" color="#3182CE" style={{ marginTop: 40 }} />
      ) : annonces.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune annonce de colocation pour cette zone.</Text>
        </View>
      ) : (
        <FlatList
          data={annonces}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isMyPost = auth.currentUser && item.etudiantId === auth.currentUser.uid;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.authorRow}>
                    <Text style={styles.authorName}>👤 {formatCleanFullName(item.nomEtudiant)}</Text>
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
                    {/* Bouton Contacter par WhatsApp */}
                    <TouchableOpacity 
                      style={styles.whatsappButton}
                      onPress={() => handleWhatsAppContact(item.telephone, item.nomEtudiant, item.universiteId)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.whatsappButtonText}>📞 WhatsApp</Text>
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
                        <Text style={styles.chatButtonText}>💬 Discuter</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        {/* Bouton Modifier pour le propriétaire de l'annonce */}
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => navigation.navigate('AjouterColocAnnonce', { annonceToEdit: item })}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.editButtonText}>✏️ Modifier</Text>
                        </TouchableOpacity>

                        {/* Bouton Supprimer */}
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteAnnonce(item.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A365D' },
  addButton: { backgroundColor: '#3182CE', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  filterContainer: { flexDirection: 'row', marginBottom: 20, maxHeight: 45 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 20, marginRight: 10, height: 38 },
  filterChipSelected: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
  filterText: { fontSize: 13, color: '#4A5568', fontWeight: '500' },
  filterTextSelected: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#718096', fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap', marginRight: 8 },
  authorName: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginRight: 8 },
  myPostBadge: { backgroundColor: '#FEFCBF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: '#F6E05E' },
  myPostText: { fontSize: 11, fontWeight: 'bold', color: '#744210' },
  badge: { backgroundColor: '#EBF8FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#BEE3F8' },
  badgeText: { color: '#3182CE', fontSize: 12, fontWeight: 'bold' },
  description: { fontSize: 14, color: '#4A5568', marginBottom: 14, lineHeight: 20 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 12 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  budgetLabel: { fontSize: 13, color: '#718096', fontWeight: '500' },
  budgetVal: { fontSize: 16, fontWeight: 'bold', color: '#38A169' },
  actionButtonsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  whatsappButton: { backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8 },
  whatsappButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  chatButton: { backgroundColor: '#3182CE', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8 },
  chatButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  editButton: { 
    backgroundColor: '#EBF8FF', 
    borderWidth: 1, 
    borderColor: '#BEE3F8', 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: { 
    color: '#3182CE', 
    fontWeight: 'bold', 
    fontSize: 13 
  },
  deleteButton: { backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FEB2B2', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { fontSize: 14 },
});