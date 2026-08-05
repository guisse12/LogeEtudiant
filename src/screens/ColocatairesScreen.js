import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../config/firebase';

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
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.authorName}>👤 {item.nomEtudiant || "Étudiant"}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.universiteId}</Text>
                </View>
              </View>

              <Text style={styles.description}>{item.description}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.budget}>Budget max : <Text style={styles.budgetVal}>{item.budgetMax} FCFA</Text></Text>
                
                <TouchableOpacity 
                  style={styles.chatButton}
                  onPress={() => navigation.navigate('Chat', { 
                    recipientId: item.etudiantId, 
                    recipientName: item.nomEtudiant || "Étudiant",
                    propertyTitle: `Coloc - ${item.universiteId}`
                  })}
                >
                  <Text style={styles.chatButtonText}>💬 Discuter</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A365D' },
  addButton: { backgroundColor: '#3182CE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  filterContainer: { flexDirection: 'row', marginBottom: 20, maxHeight: 45 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 20, marginRight: 10, height: 38 },
  filterChipSelected: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
  filterText: { fontSize: 13, color: '#4A5568', fontWeight: '500' },
  filterTextSelected: { color: '#fff' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#718096', fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  authorName: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  badge: { backgroundColor: '#EBF8FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { color: '#3182CE', fontSize: 11, fontWeight: 'bold' },
  description: { fontSize: 14, color: '#4A5568', marginBottom: 12, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 10 },
  budget: { fontSize: 13, color: '#718096' },
  budgetVal: { fontWeight: 'bold', color: '#38A169' },
  chatButton: { backgroundColor: '#3182CE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  chatButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});