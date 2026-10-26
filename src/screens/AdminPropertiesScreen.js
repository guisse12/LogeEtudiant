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
  Image,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80';

export default function AdminPropertiesScreen({ navigation }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "properties"));
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setProperties(list);
    } catch (error) {
      console.error("Erreur chargement logements :", error);
      Alert.alert("Erreur", "Impossible de charger les annonces.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleDeleteProperty = (id, titre) => {
    Alert.alert(
      "Suppression d'annonce",
      `Êtes-vous sûr de vouloir supprimer définitivement l'annonce "${titre || 'Sans titre'}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "properties", id));
              setProperties(prev => prev.filter(p => p.id !== id));
              Alert.alert("Succès", "Annonce supprimée avec succès.");
            } catch (error) {
              console.error("Erreur suppression annonce :", error);
              setProperties(prev => prev.filter(p => p.id !== id));
              Alert.alert("Succès", "Annonce retirée de la liste.");
            }
          }
        }
      ]
    );
  };

  const filteredProperties = properties.filter((p) => {
    const titleMatch = (p.titre || p.titreAnnonce || '').toLowerCase();
    const addressMatch = (p.localisation?.adresse || p.localisation?.ville || p.adresse || p.quartier || '').toLowerCase();
    const uniMatch = (p.universiteId || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    return !q || titleMatch.includes(q) || addressMatch.includes(q) || uniMatch.includes(q);
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003880" />
        <Text style={styles.loadingText}>Chargement des annonces immobilières...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* NAVBAR ADMINISTRATIVE FIXE */}
      <View style={styles.fixedNavbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#003880" />
          <Text style={styles.backBtnText}>Admin</Text>
        </TouchableOpacity>
        <Text style={styles.navbarTitle}>Modération Annonces ({filteredProperties.length})</Text>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={fetchProperties} activeOpacity={0.8}>
          <Ionicons name="refresh" size={18} color="#003880" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* BARRE DE RECHERCHE */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#A0AEC0" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par titre, quartier ou campus..."
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

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Annonces Publiées ({filteredProperties.length})</Text>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={fetchProperties}>
          <Ionicons name="refresh" size={16} color="#3182CE" />
        </TouchableOpacity>
      </View>

      {/* LISTE DES PROPRIÉTÉS */}
      <FlatList
        data={filteredProperties}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 25 }}
        renderItem={({ item }) => {
          const photo = (item.images && item.images.length > 0 && item.images[0]) || item.image || DEFAULT_IMAGE;
          const displayPhoto = photo.startsWith('http') ? photo : DEFAULT_IMAGE;

          return (
            <View style={styles.card}>
              <Image source={{ uri: displayPhoto }} style={styles.thumbnail} />

              <View style={styles.info}>
                <View style={styles.badgeRow}>
                  <View style={styles.campusBadge}>
                    <Text style={styles.campusBadgeText}>{item.universiteId || "Campus"}</Text>
                  </View>
                  <Text style={styles.typeText}>{item.type || 'Logement'}</Text>
                </View>

                <Text style={styles.title} numberOfLines={1}>
                  {item.titre || item.titreAnnonce || "Logement sans titre"}
                </Text>
                
                <Text style={styles.price}>
                  {item.prix ? `${Number(item.prix).toLocaleString()} FCFA/mois` : "Prix non renseigné"}
                </Text>
                
                <Text style={styles.location} numberOfLines={1}>
                  📍 {item.localisation?.ville ? `${item.localisation.ville} • ` : ''}{item.localisation?.adresse || item.adresse || item.quartier || "Adresse non spécifiée"}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={() => handleDeleteProperty(item.id, item.titre || item.titreAnnonce)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#E53E3E" />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={44} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>Aucune annonce trouvée</Text>
            <Text style={styles.emptyText}>Aucun logement ne correspond aux critères.</Text>
          </View>
        }
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, padding: 15, backgroundColor: '#F7FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#718096', fontWeight: '500' },

  // NAVBAR FIXE
  fixedNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003880',
    marginLeft: 4,
  },
  navbarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  refreshIconBtn: {
    padding: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D3748',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A365D' },
  refreshIconBtn: {
    padding: 6,
    backgroundColor: '#EBF8FF',
    borderRadius: 6,
  },

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
  thumbnail: {
    width: 65,
    height: 65,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#EDF2F7',
  },
  info: { flex: 1 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  campusBadge: {
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  campusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#003880',
  },
  typeText: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
  },
  title: { fontSize: 14, fontWeight: 'bold', color: '#1A365D', marginBottom: 2 },
  price: { color: '#003880', fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
  location: { color: '#718096', fontSize: 11 },
  deleteBtn: { 
    padding: 9, 
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#4A5568', marginTop: 10 },
  emptyText: { textAlign: 'center', color: '#718096', marginTop: 4, fontSize: 13 },
});
