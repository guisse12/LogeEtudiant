import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert, TextInput, Modal, Linking } from 'react-native';
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { db, auth } from '../config/firebase';
import { logoutUser } from '../services/authService';

const UNIVERSITES = [
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

const TYPES_LOGEMENT = ['Studio', 'Chambre', 'Appartement', 'Colocation', 'Villa'];

const SENEGAL_VILLES = [
  { id: 'DAKAR', nom: 'Dakar', lat: 14.69275, lng: -17.44667, uniDefault: 'UCAD' },
  { id: 'THIES', nom: 'Thiès', lat: 14.79100, lng: -16.92560, uniDefault: 'UIDT' },
  { id: 'SAINT_LOUIS', nom: 'Saint-Louis', lat: 16.03260, lng: -16.48960, uniDefault: 'UGB' },
  { id: 'DIAMNIADIO', nom: 'Diamniadio', lat: 14.72140, lng: -17.18120, uniDefault: 'UAM' },
  { id: 'ZIGUINCHOR', nom: 'Ziguinchor', lat: 12.56840, lng: -16.27330, uniDefault: 'UASZ' },
  { id: 'KAOLACK', nom: 'Kaolack', lat: 14.13780, lng: -16.07470, uniDefault: 'USSEIN' },
  { id: 'TAMBA', nom: 'Tambacounda', lat: 13.77120, lng: -13.66730, uniDefault: 'USO' },
  { id: 'MBOUR', nom: 'Mbour / Saly', lat: 14.42200, lng: -16.96340, uniDefault: 'UIDT' },
];

export default function BailleurHomeScreen({ navigation }) {
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBien, setEditingBien] = useState(null);
  const [selectedFilterZone, setSelectedFilterZone] = useState('TOUS');
  
  // État pour la validation du compte bailleur
  const [statutValidation, setStatutValidation] = useState('en_attente');

  // Formulaire state
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [type, setType] = useState('Studio');
  const [universiteId, setUniversiteId] = useState('UCAD');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [mediasUris, setMediasUris] = useState([]); // Tableau pour stocker jusqu'à 30 photos/vidéos
  const [selectedVille, setSelectedVille] = useState('DAKAR');
  
  // Coordonnées géographiques (Dakar par défaut)
  const [latitude, setLatitude] = useState(14.69275);
  const [longitude, setLongitude] = useState(-17.44667);
  const [gpsCapturing, setGpsCapturing] = useState(false);

  const fetchMesBiens = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) return;
      
      // 1. Vérifier le statut de validation du bailleur dans Firestore
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setStatutValidation(userData.statutValidation || 'en_attente');
      }

      // 2. Charger ses biens
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

  // Fonction pour centrer sur la position actuelle du bailleur
  const handleUseCurrentLocation = async () => {
    setGpsCapturing(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "Veuillez autoriser l'accès à la position dans vos réglages pour capturer l'emplacement.");
        setGpsCapturing(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude: lat, longitude: lng } = location.coords;
      
      setLatitude(lat);
      setLongitude(lng);
      Alert.alert("Position enregistrée 📍", `Coordonnées capturées avec succès :\nLat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
    } catch (error) {
      console.error("Erreur géolocalisation :", error);
      Alert.alert("Erreur", "Impossible de récupérer votre position actuelle.");
    } finally {
      setGpsCapturing(false);
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
        Alert.alert("Permission requise", "L'accès à vos photos est nécessaire pour ajouter les visuels du logement.");
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
      Alert.alert("Erreur", "Impossible d'importer les fichiers.");
    }
  };

  // Supprimer un média spécifique de la liste en cours
  const handleRemoveMedia = (indexToRemove) => {
    setMediasUris(prevMedias => prevMedias.filter((_, index) => index !== indexToRemove));
  };

  const handleSelectVille = (ville) => {
    setSelectedVille(ville.id);
    setLatitude(ville.lat);
    setLongitude(ville.lng);
    if (ville.uniDefault) {
      setUniversiteId(ville.uniDefault);
    }
  };

  const handleOpenModal = (bien = null) => {
    if (statutValidation !== 'valide' && !bien) {
      Alert.alert(
        "Compte en attente",
        "Votre compte bailleur n'a pas encore été validé par l'administrateur. Vous ne pouvez pas publier de nouveau logement pour le moment."
      );
      return;
    }

    if (bien) {
      setEditingBien(bien);
      setTitre(bien.titre || '');
      setDescription(bien.description || '');
      setPrix(String(bien.prix || ''));
      setType(bien.type || 'Studio');
      setUniversiteId(bien.universiteId || 'UCAD');
      setTelephone(bien.telephoneProprietaire || bien.telephone || '');
      setAdresse(bien.localisation?.adresse || '');
      setMediasUris(bien.images || bien.medias || []);
      setLatitude(bien.localisation?.latitude || 14.69275);
      setLongitude(bien.localisation?.longitude || -17.44667);
      setSelectedVille(bien.localisation?.villeId || 'DAKAR');
    } else {
      setEditingBien(null);
      setTitre('');
      setDescription('');
      setPrix('');
      setType('Studio');
      setUniversiteId('UCAD');
      setTelephone('');
      setAdresse('');
      setMediasUris([]);
      setSelectedVille('DAKAR');
      setLatitude(14.69275);
      setLongitude(-17.44667);
    }
    setModalVisible(true);
  };

  const handleSaveProperty = async () => {
    if (!titre.trim() || !prix || !type.trim() || !adresse.trim()) {
      Alert.alert("Champs obligatoires", "Veuillez renseigner au minimum le titre, le type, le loyer et l'adresse.");
      return;
    }

    if (mediasUris.length > 30) {
      Alert.alert("Limite atteinte", "Vous ne pouvez pas dépasser 30 photos ou vidéos par bien.");
      return;
    }

    try {
      // 1. Vérification des doublons si c'est une NOUVELLE publication
      if (!editingBien) {
        const propertiesRef = collection(db, "properties");
        const qCheck = query(
          propertiesRef, 
          where("proprietaireId", "==", auth.currentUser.uid),
          where("titre", "==", titre.trim())
        );
        const querySnapshot = await getDocs(qCheck);

        if (!querySnapshot.empty) {
          Alert.alert(
            "Annonce déjà existante", 
            "Vous avez déjà publié une annonce portant exactement ce même titre."
          );
          return;
        }
      }

      const activeVille = SENEGAL_VILLES.find(v => v.id === selectedVille);
      const propertyData = {
        titre: titre.trim(),
        description: description.trim(),
        prix: Number(prix),
        type: type.trim(),
        universiteId,
        telephoneProprietaire: telephone.trim(),
        proprietaireId: auth.currentUser.uid,
        localisation: {
          adresse: adresse.trim(),
          villeId: selectedVille,
          ville: activeVille?.nom || 'Dakar',
          latitude,
          longitude,
        },
        images: mediasUris.length > 0 ? mediasUris : ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80'],
        updatedAt: new Date(),
      };

      if (editingBien) {
        const docRef = doc(db, "properties", editingBien.id);
        await updateDoc(docRef, propertyData);
        Alert.alert("Succès ✨", "Votre annonce a été mise à jour.");
      } else {
        propertyData.createdAt = new Date();
        await addDoc(collection(db, "properties"), propertyData);
        Alert.alert("Félicitations 🎉", "Votre bien a été publié avec succès sur LogeÉtudiant.");
      }

      setModalVisible(false);
      fetchMesBiens();
    } catch (error) {
      console.error("Erreur enregistrement bien :", error);
      Alert.alert("Erreur", "Impossible d'enregistrer le logement pour le moment.");
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
              Alert.alert("Supprimé", "L'annonce a été retirée.");
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
      <Image 
        source={{ 
          uri: (item.images && item.images.length > 0 && item.images[0]) || 
               item.image || 
               'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80' 
        }} 
        style={styles.propertyImage} 
      />
      <View style={styles.propertyBadge}>
        <Text style={styles.propertyBadgeText}>{item.universiteId}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.propertyTitle}>{item.titre}</Text>
        <Text style={styles.propertyType}>Type : {item.type}</Text>
        <Text style={styles.propertyAddress} numberOfLines={1}>
          📍 {item.localisation?.ville ? `${item.localisation.ville} • ` : ''}{item.localisation?.adresse || 'Adresse non spécifiée'}
        </Text>
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

        {/* Bannière d'avertissement si le compte est en attente de validation */}
        {statutValidation !== 'valide' && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningTitle}>⚠️ Compte en attente de validation</Text>
            <Text style={styles.warningText}>
              Votre compte bailleur n'a pas encore été validé par l'administrateur. La publication de nouveaux logements est temporairement restreinte.
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.addButton, statutValidation !== 'valide' && { backgroundColor: '#CBD5E0' }]} 
          onPress={() => handleOpenModal()}
        >
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

      {/* MODAL PROFESSIONNEL PUBLIER / MODIFIER UN LOGEMENT */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* En-tête de la modale */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{editingBien ? 'Modifier le logement' : 'Publier un logement'}</Text>
                <Text style={styles.modalSubtitle}>Complétez les informations pour attirer les étudiants</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              
              {/* SECTION 1 : INFORMATIONS CLÉS */}
              <View style={styles.formSection}>
                <Text style={styles.sectionHeading}>🏷️ Informations de base</Text>

                <Text style={styles.fieldLabel}>Titre de l'annonce *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ex: Studio moderne et lumineux proche UCAD" 
                  placeholderTextColor="#A0AEC0"
                  value={titre} 
                  onChangeText={setTitre} 
                />

                <Text style={styles.fieldLabel}>Type de bien *</Text>
                <View style={styles.typeChipsContainer}>
                  {TYPES_LOGEMENT.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, type === t && styles.typeChipSelected]}
                      onPress={() => setType(t)}
                    >
                      <Text style={[styles.typeChipText, type === t && styles.typeChipTextSelected]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Loyer mensuel (FCFA) *</Text>
                <View style={styles.priceInputWrapper}>
                  <TextInput 
                    style={styles.priceInputField} 
                    placeholder="Ex: 75000" 
                    placeholderTextColor="#A0AEC0"
                    value={prix} 
                    onChangeText={setPrix} 
                    keyboardType="numeric" 
                  />
                  <View style={styles.currencyBadge}>
                    <Text style={styles.currencyBadgeText}>FCFA / mois</Text>
                  </View>
                </View>
              </View>

              {/* SECTION 2 : LOCALISATION & CAMPUS */}
              <View style={styles.formSection}>
                <Text style={styles.sectionHeading}>📍 Emplacement & Ville du logement</Text>

                <Text style={styles.fieldLabel}>Ville / Région du logement *</Text>
                <Text style={styles.fieldHelpText}>
                  💡 Vous pouvez être basé à Dakar (Mermoz, Plateau...) et publier un logement situé à Thiès, Saint-Louis ou autre ville.
                </Text>
                <View style={styles.villeChipsWrapper}>
                  {SENEGAL_VILLES.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.villeChip, selectedVille === v.id && styles.villeChipSelected]}
                      onPress={() => handleSelectVille(v)}
                    >
                      <Text style={[styles.villeChipText, selectedVille === v.id && styles.villeChipTextSelected]}>
                        {selectedVille === v.id ? '✓ ' : ''}{v.nom}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Campus / Université partenaire *</Text>
                <View style={styles.zoneChipsWrapper}>
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

                <Text style={styles.fieldLabel}>Adresse précise du logement *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ex: Cité Lamy (Thiès), Sanar (St-Louis), ou Mermoz (Dakar)" 
                  placeholderTextColor="#A0AEC0"
                  value={adresse} 
                  onChangeText={setAdresse} 
                />

                {/* CARTE GPS PRO */}
                <Text style={styles.fieldLabel}>Localisation GPS</Text>
                <View style={styles.gpsCardPro}>
                  <View style={styles.gpsHeader}>
                    <View style={styles.gpsCoordsBox}>
                      <Text style={styles.gpsCoordsTitle}>
                        Position GPS ({SENEGAL_VILLES.find(v => v.id === selectedVille)?.nom || 'Sénégal'})
                      </Text>
                      <Text style={styles.gpsCoordsValue}>
                        Lat : <Text style={styles.gpsBold}>{typeof latitude === 'number' ? latitude.toFixed(5) : latitude}</Text>  |  Lng : <Text style={styles.gpsBold}>{typeof longitude === 'number' ? longitude.toFixed(5) : longitude}</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.gpsActionsRow}>
                    <TouchableOpacity 
                      style={styles.gpsCaptureBtn} 
                      onPress={handleUseCurrentLocation}
                      disabled={gpsCapturing}
                    >
                      <Text style={styles.gpsCaptureBtnText}>
                        {gpsCapturing ? '⏳ Détection...' : '📡 Utiliser mon GPS actuel'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.gpsVerifyBtn}
                      onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)}
                    >
                      <Text style={styles.gpsVerifyBtnText}>🗺️ Vérifier sur Maps</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* SECTION 3 : CONTACT */}
              <View style={styles.formSection}>
                <Text style={styles.sectionHeading}>📞 Contact direct</Text>

                <Text style={styles.fieldLabel}>Numéro WhatsApp / Téléphone *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ex: +221 77 000 00 00" 
                  placeholderTextColor="#A0AEC0"
                  value={telephone} 
                  onChangeText={setTelephone} 
                  keyboardType="phone-pad" 
                />
              </View>

              {/* SECTION 4 : PHOTOS & VIDÉOS */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeaderBetween}>
                  <Text style={styles.sectionHeading}>📸 Photos & Vidéos</Text>
                  <View style={styles.counterPill}>
                    <Text style={styles.counterPillText}>{mediasUris.length} / 30 fichiers</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.uploadDashedZone} onPress={handlePickMedias}>
                  <Text style={styles.uploadIcon}>🖼️</Text>
                  <Text style={styles.uploadTitle}>Ajouter des photos du logement</Text>
                  <Text style={styles.uploadSubtitle}>Sélectionnez jusqu'à 30 photos pour valoriser votre annonce</Text>
                </TouchableOpacity>

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
              </View>

              {/* SECTION 5 : DESCRIPTION */}
              <View style={styles.formSection}>
                <Text style={styles.sectionHeading}>📝 Description détaillée</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  placeholder="Précisez les commodités (eau courante, wifi, compteur individuel, balcon, gardiennage, etc.)" 
                  placeholderTextColor="#A0AEC0"
                  value={description} 
                  onChangeText={setDescription} 
                  multiline 
                  numberOfLines={4}
                />
              </View>

              {/* BOUTONS D'ACTION */}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProperty}>
                  <Text style={styles.saveButtonText}>
                    {editingBien ? '💾 Enregistrer les modifications' : '🚀 Publier l\'annonce'}
                  </Text>
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
  warningBanner: { backgroundColor: '#FEFCBF', borderWidth: 1, borderColor: '#ECC94B', padding: 12, borderRadius: 8, marginBottom: 15 },
  warningTitle: { fontSize: 13, fontWeight: 'bold', color: '#744210', marginBottom: 2 },
  warningText: { fontSize: 12, color: '#975A16', lineHeight: 16 },
  addButton: { backgroundColor: '#38A169', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 15, elevation: 2 },
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
  propertyCard: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', position: 'relative', elevation: 1 },
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
  
  // MODALE PROFESSIONNELLE
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#F8F9FA', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    maxHeight: '92%', 
    paddingBottom: 20 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A365D' },
  modalSubtitle: { fontSize: 12, color: '#718096', marginTop: 2 },
  closeBtn: { backgroundColor: '#EDF2F7', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 14, color: '#4A5568', fontWeight: 'bold' },
  modalScroll: { padding: 16 },

  // SECTIONS DU FORMULAIRE
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: { fontSize: 14, fontWeight: 'bold', color: '#2D3748', marginBottom: 12 },
  sectionHeaderBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#4A5568', marginBottom: 6, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  // INPUTS
  input: { 
    backgroundColor: '#F7FAFC', 
    borderWidth: 1, 
    borderColor: '#CBD5E0', 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderRadius: 8, 
    marginBottom: 10, 
    fontSize: 14, 
    color: '#2D3748' 
  },
  textArea: { height: 90, textAlignVertical: 'top' },

  // CHIPS POUR TYPE DE LOGEMENT
  typeChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  typeChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    backgroundColor: '#EDF2F7', 
    borderRadius: 8, 
    marginRight: 8, 
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  typeChipSelected: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
  typeChipText: { fontSize: 13, color: '#4A5568', fontWeight: '600' },
  typeChipTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },

  // CHAMP PRIX
  priceInputWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  priceInputField: { 
    flex: 1, 
    backgroundColor: '#F7FAFC', 
    borderWidth: 1, 
    borderColor: '#CBD5E0', 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderTopLeftRadius: 8, 
    borderBottomLeftRadius: 8, 
    fontSize: 15, 
    fontWeight: 'bold',
    color: '#2D3748' 
  },
  currencyBadge: { 
    backgroundColor: '#E2E8F0', 
    paddingHorizontal: 12, 
    paddingVertical: 11, 
    borderTopRightRadius: 8, 
    borderBottomRightRadius: 8, 
    borderWidth: 1, 
    borderColor: '#CBD5E0', 
    borderLeftWidth: 0 
  },
  currencyBadgeText: { fontSize: 12, fontWeight: '700', color: '#4A5568' },

  // VILLES & REGIONS SENEGAL
  fieldHelpText: { fontSize: 11, color: '#718096', marginBottom: 8, fontStyle: 'italic', lineHeight: 16 },
  villeChipsWrapper: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  villeChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    backgroundColor: '#EDF2F7', 
    borderRadius: 8, 
    marginRight: 6, 
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#CBD5E0',
  },
  villeChipSelected: { backgroundColor: '#2B6CB0', borderColor: '#2B6CB0' },
  villeChipText: { fontSize: 12, color: '#4A5568', fontWeight: '600' },
  villeChipTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },

  // ZONE UNIVERSITAIRE
  zoneChipsWrapper: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  zoneChip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EDF2F7', borderRadius: 16, marginRight: 6, marginBottom: 6 },
  zoneChipSelected: { backgroundColor: '#3182CE' },
  zoneText: { fontSize: 11, color: '#4A5568' },
  zoneTextSelected: { color: '#fff', fontWeight: 'bold' },

  // CARTE GPS PRO
  gpsCardPro: { backgroundColor: '#F7FAFC', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#CBD5E0', marginBottom: 6 },
  gpsHeader: { marginBottom: 10 },
  gpsCoordsBox: { backgroundColor: '#EDF2F7', padding: 8, borderRadius: 6 },
  gpsCoordsTitle: { fontSize: 10, fontWeight: 'bold', color: '#718096', textTransform: 'uppercase', marginBottom: 2 },
  gpsCoordsValue: { fontSize: 12, color: '#4A5568' },
  gpsBold: { fontWeight: 'bold', color: '#2B6CB0' },
  gpsActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gpsCaptureBtn: { flex: 1.5, backgroundColor: '#3182CE', paddingVertical: 9, borderRadius: 6, alignItems: 'center', marginRight: 6 },
  gpsCaptureBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  gpsVerifyBtn: { flex: 1, backgroundColor: '#EBF8FF', paddingVertical: 9, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#BEE3F8' },
  gpsVerifyBtnText: { color: '#3182CE', fontSize: 12, fontWeight: 'bold' },

  // UPLOAD PHOTOS EN ZONE TIRETEE
  uploadDashedZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#3182CE',
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadIcon: { fontSize: 28, marginBottom: 4 },
  uploadTitle: { fontSize: 14, fontWeight: 'bold', color: '#2B6CB0' },
  uploadSubtitle: { fontSize: 11, color: '#718096', marginTop: 2, textAlign: 'center' },
  counterPill: { backgroundColor: '#EBF8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  counterPillText: { fontSize: 11, fontWeight: 'bold', color: '#3182CE' },
  previewScroll: { marginTop: 6, marginBottom: 4, maxHeight: 80 },
  previewThumbContainer: { position: 'relative', marginRight: 8 },
  previewThumb: { width: 70, height: 70, borderRadius: 8 },
  removeThumbBtn: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  removeThumbText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  // BOUTONS FOOTER
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 25 },
  cancelButton: { flex: 1, backgroundColor: '#EDF2F7', padding: 14, borderRadius: 10, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#CBD5E0' },
  cancelButtonText: { color: '#4A5568', fontWeight: 'bold', fontSize: 14 },
  saveButton: { flex: 2, backgroundColor: '#38A169', padding: 14, borderRadius: 10, alignItems: 'center', elevation: 2 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
