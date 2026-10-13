import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert, TextInput, Modal } from 'react-native';
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { db, auth } from '../config/firebase';
import { logoutUser } from '../services/authService';

const UNIVERSITES = [
  { id: 'UCAD', nom: 'UCAD (Dakar)' },
  { id: 'UGB', nom: 'UGB (Saint-Louis)' },
  { id: 'USSEIN', nom: 'USSEIN (Sine Saloum)' },
  { id: 'UASZ', nom: 'UASZ (Ziguinchor)' },
  { id: 'UIDT', nom: 'UIDT (Thiès)' },
  { id: 'UAM', nom: 'UAM (Diamniadio)'},
];

export default function BailleurHomeScreen({ navigation }) {
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBien, setEditingBien] = useState(null);
  const [selectedFilterZone, setSelectedFilterZone] = useState('TOUS');

  // Formulaire state
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [type, setType] = useState('');
  const [universiteId, setUniversiteId] = useState('UCAD');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [mediasUris, setMediasUris] = useState([]); // Tableau pour stocker jusqu'à 30 photos/vidéos
  
  // Coordonnées géographiques pour la carte interactive (Dakar par défaut)
  const [latitude, setLatitude] = useState(14.69275);
  const [longitude, setLongitude] = useState(-17.44667);

  const fetchMesBiens = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) return;
      const q = query(collection(db, "properties"), where("proprietaireId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      let list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setBiens(list);
    } catch (error) {
      console.error("Erreur chargement biens bailleur :", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMesBiens();
  }, []);

  // Fonction optionnelle pour centrer la carte sur la position actuelle si le bailleur le souhaite
  const handleUseCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "Impossible d'accéder à la géolocalisation.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude: lat, longitude: lng } = location.coords;
      
      setLatitude(lat);
      setLongitude(lng);
    } catch (error) {
      console.error("Erreur géolocalisation :", error);
    }
  };

  // Fonction pour sélectionner plusieurs photos ou vidéos (maximum 30 au total)
  const handlePickMedias = async () => {
    const remainingSlots = 30 - mediasUris.length;
    if (remainingSlots <= 0) {
      Alert.alert("Limite atteinte", "Vous avez déjà atteint le maximum de 30 photos ou vidéos.");
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission refusée", "L'accès à la galerie est requis pour ajouter des photos ou vidéos.");
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
        setMediasUris(prevMedias => [...prevMedias, ...newUris]);
      }
    } catch (error) {
      console.error("Erreur sélection médias :", error);
      Alert.alert("Erreur", "Impossible de sélectionner les fichiers.");
    }
  };

  // Supprimer un média spécifique de la liste en cours
  const handleRemoveMedia = (indexToRemove) => {
    setMediasUris(prevMedias => prevMedias.filter((_, index) => index !== indexToRemove));
  };

  const handleOpenModal = (bien = null) => {
    if (bien) {
      setEditingBien(bien);
      setTitre(bien.titre || '');
      setDescription(bien.description || '');
      setPrix(String(bien.prix || ''));
      setType(bien.type || '');
      setUniversiteId(bien.universiteId || 'UCAD');
      setTelephone(bien.telephoneProprietaire || bien.telephone || '');
      setAdresse(bien.localisation?.adresse || '');
      setMediasUris(bien.images || bien.medias || []);
      setLatitude(bien.localisation?.latitude || 14.69275);
      setLongitude(bien.localisation?.longitude || -17.44667);
    } else {
      setEditingBien(null);
      setTitre('');
      setDescription('');
      setPrix('');
      setType('');
      setUniversiteId('UCAD');
      setTelephone('');
      setAdresse('');
      setMediasUris([]);
      setLatitude(14.69275);
      setLongitude(-17.44667);
    }
    setModalVisible(true);
  };

  const handleSaveProperty = async () => {
    if (!titre || !prix || !type || !adresse) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (mediasUris.length > 30) {
      Alert.alert("Erreur", "Vous ne pouvez pas dépasser 30 photos ou vidéos par bien.");
      return;
    }

    try {
      // 1. Vérification des doublons si c'est une NOUVELLE publication
      if (!editingBien) {
        const propertiesRef = collection(db, "properties");
        const qCheck = query(propertiesRef, where("localisation.adresse", "==", adresse.trim()));
        const querySnapshot = await getDocs(qCheck);

        if (!querySnapshot.empty) {
          Alert.alert(
            "Doublon détecté", 
            "Un bien immobilier avec cette même adresse est déjà enregistré sur la plateforme."
          );
          return;
        }
      }

      const propertyData = {
        titre: titre.trim(),
        description: description.trim(),
        prix: Number(prix),
        type,
        universiteId,
        telephoneProprietaire: telephone,
        proprietaireId: auth.currentUser.uid,
        localisation: {
          adresse: adresse.trim(),
          latitude,
          longitude,
        },
        images: mediasUris.length > 0 ? mediasUris : ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80'],
        updatedAt: new Date(),
      };

      if (editingBien) {
        const docRef = doc(db, "properties", editingBien.id);
        await updateDoc(docRef, propertyData);
        Alert.alert("Succès", "Votre annonce a été mise à jour.");
      } else {
        propertyData.createdAt = new Date();
        await addDoc(collection(db, "properties"), propertyData);
        Alert.alert("Succès", "Votre bien a été publié avec succès.");
      }

      setModalVisible(false);
      fetchMesBiens();
    } catch (error) {
      console.error("Erreur enregistrement bien :", error);
      Alert.alert("Erreur", "Impossible d'enregistrer le bien.");
    }
  };

  const handleDeleteProperty = (id) => {
    Alert.alert(
      "Confirmation",
      "Voulez-vous vraiment supprimer cette annonce ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "properties", id));
              Alert.alert("Supprimé", "L'annonce a été supprimée.");
              fetchMesBiens();
            } catch (error) {
              console.error("Erreur suppression :", error);
              Alert.alert("Erreur", "Impossible de supprimer l'annonce.");
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await logoutUser();
    navigation.replace('Login');
  };

  const filteredBiens = selectedFilterZone === 'TOUS' 
    ? biens 
    : biens.filter(item => item.universiteId === selectedFilterZone);

  const renderPropertyCard = (item) => (
    <View key={item.id} style={styles.propertyCard}>
      {item.images && item.images.length > 0 && (
        <Image source={{ uri: item.images[0] }} style={styles.propertyImage} />
      )}
      <View style={styles.propertyBadge}>
        <Text style={styles.propertyBadgeText}>{item.universiteId}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.propertyTitle}>{item.titre}</Text>
        <Text style={styles.propertyType}>Type : {item.type}</Text>
        <Text style={styles.propertyAddress} numberOfLines={1}>📍 {item.localisation?.adresse || 'Adresse non spécifiée'}</Text>
        <Text style={styles.propertyDescription} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.propertyPrice}>{item.prix} FCFA <Text style={styles.period}>/ mois</Text></Text>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => handleOpenModal(item)}>
            <Text style={styles.editButtonText}>✏️ Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProperty(item.id)}>
            <Text style={styles.deleteButtonText}>🗑️ Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Espace Bailleur</Text>
            <Text style={styles.headerSubtitle}>Gérez vos biens immobiliers</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
              <Text style={styles.profileButtonText}>👤 Profil</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Conversations')} style={styles.msgButton}>
              <Text style={styles.msgButtonText}>💬 Messages</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Sortie</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <Text style={styles.addButtonText}>➕ Publier un nouveau logement</Text>
        </TouchableOpacity>

        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, selectedFilterZone === 'TOUS' && styles.filterChipActive]}
              onPress={() => setSelectedFilterZone('TOUS')}
            >
              <Text style={[styles.filterText, selectedFilterZone === 'TOUS' && styles.filterTextActive]}>Tous ({biens.length})</Text>
            </TouchableOpacity>
            {UNIVERSITES.map((uni) => {
              const count = biens.filter(b => b.universiteId === uni.id).length;
              return (
                <TouchableOpacity 
                  key={uni.id} 
                  style={[styles.filterChip, selectedFilterZone === uni.id && styles.filterChipActive]}
                  onPress={() => setSelectedFilterZone(uni.id)}
                >
                  <Text style={[styles.filterText, selectedFilterZone === uni.id && styles.filterTextActive]}>
                    {uni.id} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>Mes biens publiés ({filteredBiens.length})</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3182CE" style={{ marginTop: 40 }} />
        ) : filteredBiens.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun logement trouvé pour cette sélection.</Text>
          </View>
        ) : (
          filteredBiens.map(renderPropertyCard)
        )}
      </ScrollView>

      {/* Modal Ajout / Modification */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingBien ? 'Modifier le logement' : 'Publier un logement'}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput style={styles.input} placeholder="Titre (ex: Studio moderne UCAD)" value={titre} onChangeText={setTitre} />
              <TextInput style={styles.input} placeholder="Type (ex: Studio, Chambre, Appartement)" value={type} onChangeText={setType} />
              <TextInput style={styles.input} placeholder="Prix par mois (FCFA)" value={prix} onChangeText={setPrix} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Adresse précise" value={adresse} onChangeText={setAdresse} />
              <TextInput style={styles.input} placeholder="Téléphone de contact (WhatsApp)" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
              
              <View style={styles.mapHeaderRow}>
                <Text style={styles.labelZone}>Localisation exacte :</Text>
                <TouchableOpacity onPress={handleUseCurrentLocation} style={styles.gpsButton}>
                  <Text style={styles.gpsButtonText}>📍 Centrer sur moi</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.mapContainer}>
                <MapView
                  style={styles.miniMap}
                  region={{
                    latitude: latitude,
                    longitude: longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  onPress={(e) => {
                    const coord = e.nativeEvent.coordinate;
                    setLatitude(coord.latitude);
                    setLongitude(coord.longitude);
                  }}
                >
                  <Marker
                    coordinate={{ latitude, longitude }}
                    title="Emplacement du logement"
                    description="Position sélectionnée"
                  />
                </MapView>
              </View>
              <Text style={styles.coordsText}>Touchez la carte à l'endroit exact du logement pour placer le repère</Text>

              <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickMedias}>
                <Text style={styles.imagePickerButtonText}>📁 Choisir photos ou vidéos (Max 30)</Text>
              </TouchableOpacity>

              <Text style={styles.counterText}>Médias sélectionnés : {mediasUris.length} / 30</Text>

              {mediasUris.length > 0 && (
                <ScrollView horizontal showsHorizontalIndicator={false} style={styles.previewScroll}>
                  {mediasUris.map((uri, index) => (
                    <View key={index} style={styles.previewThumbContainer}>
                      <Image source={{ uri }} style={styles.previewThumb} />
                      <TouchableOpacity style={styles.removeThumbBtn} onPress={() => handleRemoveMedia(index)}>
                        <Text style={styles.removeThumbText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.labelZone}>Zone universitaire :</Text>
              <View style={styles.zoneContainer}>
                {UNIVERSITES.map((uni) => (
                  <TouchableOpacity 
                    key={uni.id} 
                    style={[styles.zoneChip, universiteId === uni.id && styles.zoneChipSelected]}
                    onPress={() => setUniversiteId(uni.id)}
                  >
                    <Text style={[styles.zoneText, universiteId === uni.id && styles.zoneTextSelected]}>{uni.nom}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput 
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                placeholder="Description détaillée" 
                value={description} 
                onChangeText={setDescription} 
                multiline 
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProperty}>
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { padding: 16, paddingTop: 40, flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A365D' },
  headerSubtitle: { fontSize: 12, color: '#718096' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  profileButton: { backgroundColor: '#EBF8FF', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: '#BEE3F8' },
  profileButtonText: { color: '#3182CE', fontWeight: 'bold', fontSize: 12 },
  msgButton: { backgroundColor: '#EDF2F7', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: '#CBD5E0' },
  msgButtonText: { color: '#2D3748', fontWeight: 'bold', fontSize: 12 },
  logoutButton: { padding: 6 },
  logoutText: { color: '#E53E3E', fontWeight: 'bold', fontSize: 12 },
  addButton: { backgroundColor: '#38A169', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  filterSection: { marginBottom: 15 },
  filterScroll: { paddingVertical: 5 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#EDF2F7', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
  filterText: { fontSize: 12, color: '#4A5568', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 12 },
  emptyContainer: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#718096', textAlign: 'center', fontSize: 14 },
  propertyCard: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', position: 'relative' },
  propertyImage: { width: '100%', height: 140 },
  propertyBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#EBF8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  propertyBadgeText: { color: '#3182CE', fontSize: 11, fontWeight: 'bold' },
  cardContent: { padding: 12 },
  propertyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A365D', marginBottom: 4 },
  propertyType: { fontSize: 12, color: '#4A5568', marginBottom: 2, fontWeight: '600' },
  propertyAddress: { fontSize: 12, color: '#718096', marginBottom: 6 },
  propertyDescription: { fontSize: 13, color: '#718096', marginBottom: 8 },
  propertyPrice: { fontSize: 15, fontWeight: 'bold', color: '#38A169', marginBottom: 10 },
  period: { fontSize: 11, color: '#718096', fontWeight: 'normal' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 10 },
  editButton: { backgroundColor: '#EDF2F7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginRight: 8 },
  editButtonText: { color: '#2D3748', fontWeight: 'bold', fontSize: 12 },
  deleteButton: { backgroundColor: '#FED7D7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  deleteButtonText: { color: '#C53030', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A365D', marginBottom: 15, textAlign: 'center' },
  input: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#CBD5E0', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 14 },
  mapHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  gpsButton: { backgroundColor: '#EBF8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#BEE3F8' },
  gpsButtonText: { color: '#3182CE', fontSize: 11, fontWeight: 'bold' },
  mapContainer: { height: 210, borderRadius: 8, overflow: 'hidden', marginBottom: 6, borderWidth: 1, borderColor: '#CBD5E0' },
  miniMap: { width: '100%', height: '100%' },
  coordsText: { fontSize: 11, color: '#718096', marginBottom: 12, textAlign: 'right', fontStyle: 'italic' },
  imagePickerButton: { backgroundColor: '#EDF2F7', borderWidth: 1, borderColor: '#CBD5E0', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 6 },
  imagePickerButtonText: { color: '#2D3748', fontWeight: 'bold', fontSize: 13 },
  counterText: { fontSize: 12, color: '#4A5568', marginBottom: 8, fontWeight: '600', textAlign: 'right' },
  previewScroll: { marginBottom: 12, maxHeight: 80 },
  previewThumbContainer: { position: 'relative', marginRight: 8 },
  previewThumb: { width: 70, height: 70, borderRadius: 6 },
  removeThumbBtn: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  removeThumbText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  labelZone: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 6 },
  zoneContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  zoneChip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EDF2F7', borderRadius: 16, marginRight: 6, marginBottom: 6 },
  zoneChipSelected: { backgroundColor: '#3182CE' },
  zoneText: { fontSize: 12, color: '#4A5568' },
  zoneTextSelected: { color: '#fff', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  cancelButton: { flex: 1, backgroundColor: '#CBD5E0', padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  cancelButtonText: { color: '#2D3748', fontWeight: 'bold' },
  saveButton: { flex: 1, backgroundColor: '#3182CE', padding: 12, borderRadius: 8, alignItems: 'center', marginLeft: 8 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
});