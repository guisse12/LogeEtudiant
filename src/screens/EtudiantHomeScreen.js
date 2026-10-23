import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, Linking, Alert, TextInput } from 'react-native';
import { collection, getDocs, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { logoutUser } from '../services/authService';

const UNIVERSITES = [
  { id: 'TOUS', nom: 'Toutes les zones' },
  { id: 'FAVORIS', nom: '❤️ Mes favoris' },
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
  { id: 'CESAG', nom: 'CESAG (Thiès)' },
  { id: 'UCAO', nom: 'UCAO (Thiès)' },
  { id: 'DIT', nom: 'DIT (Dakar)' },
  { id: 'AFI-UE', nom: 'AFI-UE (Dakar)' },
  { id: 'ESEBAT ', nom: 'ESEBAT  (Dakar)' },
  { id: 'CEFAS', nom: 'CEFAS (Dakar)' },

];

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80';

const PropertyImageItem = ({ uri }) => {
  const [imageUri, setImageUri] = useState(() => {
    if (uri && typeof uri === 'string' && (uri.startsWith('http://') || uri.startsWith('https://'))) {
      return uri;
    }
    return DEFAULT_PROPERTY_IMAGE;
  });

  return (
    <Image 
      source={{ uri: imageUri }} 
      style={styles.propertyImage} 
      onError={() => setImageUri(DEFAULT_PROPERTY_IMAGE)}
      resizeMode="cover"
    />
  );
};

export default function EtudiantHomeScreen({ navigation }) {
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUni, setSelectedUni] = useState('TOUS');
  const [favorisIds, setFavorisIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchFavorisIds = async () => {
    try {
      if (!auth.currentUser) return;
      const favSnapshot = await getDocs(collection(db, "users", auth.currentUser.uid, "favorites"));
      const ids = [];
      favSnapshot.forEach((docSnap) => {
        ids.push(docSnap.id);
      });
      setFavorisIds(ids);
    } catch (error) {
      console.error("Erreur chargement favoris :", error);
    }
  };

  const fetchBiens = async (uniFilter = 'TOUS') => {
    setLoading(true);
    try {
      await fetchFavorisIds();
      
      let q = collection(db, "properties");
      if (uniFilter !== 'TOUS' && uniFilter !== 'FAVORIS') {
        q = query(collection(db, "properties"), where("universiteId", "==", uniFilter));
      }
      
      const querySnapshot = await getDocs(q);
      let list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (uniFilter === 'FAVORIS') {
        list = list.filter((item) => favorisIds.includes(item.id));
      }

      setBiens(list);
    } catch (error) {
      console.error("Erreur lors du chargement des biens :", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBiens(selectedUni);
  }, [selectedUni]);

  const filteredBiens = biens.filter((item) => {
    const matchesSearch = 
      item.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.localisation?.adresse?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.localisation?.ville?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPrice = maxPrice === '' || Number(item.prix) <= Number(maxPrice);

    return matchesSearch && matchesPrice;
  });

  const toggleFavorite = async (property) => {
    try {
      if (!auth.currentUser) return;
      const favRef = doc(db, "users", auth.currentUser.uid, "favorites", property.id);
      
      if (favorisIds.includes(property.id)) {
        await deleteDoc(favRef);
        const updatedFavoris = favorisIds.filter((id) => id !== property.id);
        setFavorisIds(updatedFavoris);
        
        if (selectedUni === 'FAVORIS') {
          setBiens(biens.filter((item) => item.id !== property.id));
        }
        
        Alert.alert("Retiré", "Le logement a été retiré de vos favoris.");
      } else {
        await setDoc(favRef, { ...property, dateAdded: new Date() });
        setFavorisIds([...favorisIds, property.id]);
        Alert.alert("Ajouté ❤️", "Le logement a été ajouté à vos favoris.");
      }
    } catch (error) {
      console.error("Erreur gestion favoris :", error);
      Alert.alert("Erreur", "Impossible de modifier les favoris.");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigation.replace('Login');
  };

  const handleContactPropriétaire = (telephone, titreBien) => {
    if (!telephone) {
      Alert.alert("Information", "Le numéro de téléphone du propriétaire n'est pas disponible pour ce bien.");
      return;
    }

    let cleanPhone = String(telephone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('00221')) {
      cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.startsWith('221')) {
      // Déjà avec l'indicatif 221
    } else if (cleanPhone.length === 9) {
      cleanPhone = `221${cleanPhone}`;
    }

    const message = `Bonjour, je suis intéressé(e) par votre logement "${titreBien || 'étudiant'}" vu sur LogeÉtudiant. Est-il toujours disponible ?`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch((err) => {
      console.error("Erreur lors de l'ouverture de WhatsApp :", err);
      Linking.openURL(`tel:${cleanPhone}`);
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* En-tête de l'application */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>LogeÉtudiant</Text>
          <Text style={styles.headerSubtitle}>Trouvez votre logement idéal</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
            <Text style={styles.profileButtonText}>Profil</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Boutons d'actions rapides (Messages & Colocation) */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={[styles.actionBannerButton, { backgroundColor: '#3182CE' }]}
          onPress={() => navigation.navigate('Conversations')}
        >
          <Text style={styles.actionBannerText}>💬 Mes Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBannerButton, { backgroundColor: '#D69E2E' }]}
          onPress={() => navigation.navigate('ColocatairesScreen')}
        >
          <Text style={styles.actionBannerText}>👥 Trouver un Coloc</Text>
        </TouchableOpacity>
      </View>

      {/* Barre de recherche et filtre de prix */}
      <View style={styles.searchSection}>
        <TextInput 
          style={styles.searchInput}
          placeholder="🔍 Rechercher (ex: Thiès, Studio, Dakar...)"
          placeholderTextColor="#A0AEC0"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TextInput 
          style={styles.priceInput}
          placeholder="Prix Max (FCFA)"
          placeholderTextColor="#A0AEC0"
          value={maxPrice}
          onChangeText={setMaxPrice}
          keyboardType="numeric"
        />
      </View>

      {/* Filtres par Université et Favoris */}
      <Text style={styles.sectionLabel}>Filtrer par zone :</Text>
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

      {/* Liste des biens immobiliers */}
      <Text style={styles.sectionTitle}>
        {selectedUni === 'FAVORIS' ? 'Mes logements favoris' : 'Logements disponibles'} ({filteredBiens.length})
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3182CE" style={{ marginTop: 40 }} />
      ) : filteredBiens.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {selectedUni === 'FAVORIS' ? 'Vous n\'avez aucun favori pour le moment.' : 'Aucun bien ne correspond à vos critères.'}
          </Text>
        </View>
      ) : (
        filteredBiens.map((item) => {
          const isFavorite = favorisIds.includes(item.id);
          const itemPhoto = (item.images && item.images.length > 0 && item.images[0]) || item.image || (item.medias && item.medias.length > 0 && item.medias[0]);

          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.propertyCard}
              onPress={() => navigation.navigate('PropertyDetails', { property: item })}
              activeOpacity={0.9}
            >
              <PropertyImageItem uri={itemPhoto} />

              <View style={styles.propertyBadge}>
                <Text style={styles.propertyBadgeText}>{item.universiteId}</Text>
              </View>

              <TouchableOpacity 
                style={styles.favoriteButton} 
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item);
                }}
              >
                <Text style={{ fontSize: 18 }}>{isFavorite ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>

              <Text style={styles.propertyTitle}>{item.titre}</Text>
              <Text style={styles.propertyType}>{item.type} - Proche campus</Text>
              <Text style={styles.propertyDescription} numberOfLines={2}>{item.description}</Text>
              
              <TouchableOpacity 
                style={styles.mapContainer}
                activeOpacity={0.8}
                onPress={(e) => {
                  e.stopPropagation();
                  const lat = item.localisation?.latitude || 14.69275;
                  const lng = item.localisation?.longitude || -17.44667;
                  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
                }}
              >
                <View style={styles.mapActionRow}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>🗺️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mapActionTitle}>Voir l'emplacement sur la carte</Text>
                    <Text style={styles.addressText} numberOfLines={1}>
                      📍 {item.localisation?.ville ? `${item.localisation.ville} • ` : ''}{item.localisation?.adresse || "Localisation non spécifiée"}
                    </Text>
                  </View>
                  <Text style={styles.mapActionArrow}>→</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.propertyFooter}>
                <Text style={styles.propertyPrice}>
                  {item.prix} FCFA <Text style={styles.period}>/ mois</Text>
                </Text>
                
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleContactPropriétaire(item.telephoneProprietaire || item.telephone, item.titre);
                  }}
                >
                  <Text style={styles.contactButtonText}>📞 WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8F9FA', flexGrow: 1, paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A365D' },
  headerSubtitle: { fontSize: 13, color: '#718096' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  profileButton: { backgroundColor: '#EBF8FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: '#BEE3F8' },
  profileButtonText: { color: '#3182CE', fontWeight: 'bold', fontSize: 13 },
  logoutButton: { padding: 6 },
  logoutText: { color: '#E53E3E', fontWeight: 'bold', fontSize: 13 },
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  actionBannerButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionBannerText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  searchSection: { flexDirection: 'row', marginBottom: 15 },
  searchInput: { flex: 2, backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E0', padding: 10, borderRadius: 8, marginRight: 8, fontSize: 14, color: '#2D3748' },
  priceInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E0', padding: 10, borderRadius: 8, fontSize: 14, color: '#2D3748' },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
  filterContainer: { flexDirection: 'row', marginBottom: 20, maxHeight: 45 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 20, marginRight: 10, height: 38 },
  filterChipSelected: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
  filterText: { fontSize: 13, color: '#4A5568', fontWeight: '500' },
  filterTextSelected: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 15 },
  emptyContainer: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#718096', textAlign: 'center', fontSize: 14 },
  propertyCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  propertyImage: { width: '100%', height: 160, borderRadius: 8, marginBottom: 12 },
  propertyBadge: { position: 'absolute', top: 15, right: 55, backgroundColor: '#EBF8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  propertyBadgeText: { color: '#3182CE', fontSize: 12, fontWeight: 'bold' },
  favoriteButton: { position: 'absolute', top: 12, right: 15, backgroundColor: '#FFF', padding: 6, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1 },
  propertyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A365D', marginBottom: 4, paddingRight: 50 },
  propertyType: { fontSize: 13, color: '#718096', marginBottom: 6, fontWeight: '600' },
  propertyDescription: { fontSize: 14, color: '#4A5568', marginBottom: 12 },
  mapContainer: { marginTop: 8, marginBottom: 12, borderRadius: 8, backgroundColor: '#EBF8FF', borderWidth: 1, borderColor: '#BEE3F8', padding: 10 },
  mapActionRow: { flexDirection: 'row', alignItems: 'center' },
  mapActionTitle: { fontSize: 13, fontWeight: 'bold', color: '#2B6CB0', marginBottom: 2 },
  mapActionArrow: { fontSize: 16, color: '#3182CE', fontWeight: 'bold', marginLeft: 6 },
  addressText: { fontSize: 12, color: '#4A5568' },
  propertyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 10 },
  propertyPrice: { fontSize: 16, fontWeight: 'bold', color: '#38A169' },
  period: { fontSize: 12, color: '#718096', fontWeight: 'normal' },
  contactButton: { backgroundColor: '#38A169', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  contactButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});