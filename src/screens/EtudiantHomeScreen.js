import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Image, 
  Linking, 
  Alert, 
  TextInput, 
  SafeAreaView, 
  Platform, 
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { logoutUser } from '../services/authService';
import { formatCleanFullName } from '../utils/nameFormatter';

const UNIVERSITES = [
  { id: 'TOUS', nom: 'Toutes les zones' },
  { id: 'FAVORIS', nom: 'Mes favoris' },
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

const TYPE_SUGGESTIONS = ['Tous', 'Appartement', 'Studio', 'Chambre', 'Villa', 'Colocation'];

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
  const [biens, setBiens] = useState([]); // SEULEMENT LES LOGEMENTS DES BAILLEURS
  const [colocAnnonces, setColocAnnonces] = useState([]); // SEULEMENT LES RECHERCHES DES ÉTUDIANTS
  const [loading, setLoading] = useState(true);
  const [selectedUni, setSelectedUni] = useState('TOUS');
  const [selectedType, setSelectedType] = useState('Tous');
  const [feedMode, setFeedMode] = useState('bailleurs'); // 'bailleurs' | 'colocataires'
  const [favorisIds, setFavorisIds] = useState([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);
  const [activeBottomTab, setActiveBottomTab] = useState('accueil'); // 'accueil', 'nouveautes', 'recents', 'favoris'
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
      
      // 1. Logements des BAILLEURS UNIQUEMENT
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

      setBiens(list); // SÉPARÉ : uniquement les annonces des bailleurs

      // 2. Annonces de COLOCATION des ÉTUDIANTS UNIQUEMENT (SÉPARATION TOTALE)
      try {
        let colocQ = collection(db, "coloc_annonces");
        if (uniFilter !== 'TOUS' && uniFilter !== 'FAVORIS') {
          colocQ = query(collection(db, "coloc_annonces"), where("universiteId", "==", uniFilter));
        }
        const colocSnapshot = await getDocs(colocQ);
        let colocList = [];
        colocSnapshot.forEach((docSnap) => {
          colocList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setColocAnnonces(colocList); // SÉPARÉ : uniquement les recherches des étudiants
      } catch (colocErr) {
        console.error("Erreur chargement annonces colocation :", colocErr);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des biens :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiens(selectedUni);
  }, [selectedUni]);

  // Filtrage selon la recherche, le prix max et le menu du bas
  const getDisplayedBiens = () => {
    let baseList = [...biens];

    // Onglet Nouveautés : trié par date de publication la plus récente
    if (activeBottomTab === 'nouveautes') {
      baseList.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    }

    // Onglet Consultations récentes
    if (activeBottomTab === 'recents') {
      baseList = baseList.filter((item) => recentlyViewedIds.includes(item.id));
    }

    // Onglet Favoris
    if (activeBottomTab === 'favoris' || selectedUni === 'FAVORIS') {
      baseList = baseList.filter((item) => favorisIds.includes(item.id));
    }

    // Filtrage suggestions de type (ex: Appartement, Studio...)
    if (selectedType !== 'Tous') {
      baseList = baseList.filter((item) => 
        (item.type || '').toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Filtrage recherche texte (limité à 15 caractères) et budget (limité à 7 chiffres)
    return baseList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        item.titre?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.localisation?.adresse?.toLowerCase().includes(q) ||
        item.localisation?.ville?.toLowerCase().includes(q) ||
        item.type?.toLowerCase().includes(q);

      const matchesPrice = maxPrice === '' || Number(item.prix) <= Number(maxPrice);

      return matchesSearch && matchesPrice;
    });
  };

  // Filtrage des annonces de colocation (ÉTUDIANTS)
  const getDisplayedColocs = () => {
    return colocAnnonces.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        item.description?.toLowerCase().includes(q) ||
        item.universiteId?.toLowerCase().includes(q) ||
        (item.nomEtudiant && item.nomEtudiant.toLowerCase().includes(q));

      const matchesBudget = maxPrice === '' || Number(item.budgetMax || 0) <= Number(maxPrice);

      return matchesSearch && matchesBudget;
    });
  };

  const displayedBiens = getDisplayedBiens();
  const displayedColocs = getDisplayedColocs();

  const handleOpenPropertyDetails = (property) => {
    // Ajouter aux consultations récentes
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== property.id);
      return [property.id, ...filtered].slice(0, 15); // Garde les 15 derniers
    });
    navigation.navigate('PropertyDetails', { property });
  };

  const handleContactColoc = (telephone, nomEtudiant, universiteId) => {
    if (!telephone) {
      Alert.alert("Information", "Le numéro de téléphone de cet étudiant n'est pas disponible.");
      return;
    }

    let cleanPhone = String(telephone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('00221')) {
      cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.length === 9) {
      cleanPhone = `221${cleanPhone}`;
    }

    const prenom = nomEtudiant ? nomEtudiant.split(' ')[0] : 'camarade';
    const message = `Bonjour ${prenom}, j'ai vu votre recherche de colocation (${universiteId || 'Campus'}) sur LogeÉtudiant. Êtes-vous toujours à la recherche d'un colocataire ?`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Linking.openURL(`tel:${cleanPhone}`);
    });
  };

  const toggleFavorite = async (property) => {
    try {
      if (!auth.currentUser) return;
      const favRef = doc(db, "users", auth.currentUser.uid, "favorites", property.id);
      
      if (favorisIds.includes(property.id)) {
        await deleteDoc(favRef);
        const updatedFavoris = favorisIds.filter((id) => id !== property.id);
        setFavorisIds(updatedFavoris);
        Alert.alert("Favoris", "Logement retiré de vos favoris.");
      } else {
        await setDoc(favRef, { ...property, dateAdded: new Date() });
        setFavorisIds([...favorisIds, property.id]);
        Alert.alert("Favoris ❤️", "Logement ajouté à vos favoris.");
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

  const handleContactProprietaire = (telephone, titreBien) => {
    if (!telephone) {
      Alert.alert("Information", "Le numéro de téléphone du propriétaire n'est pas disponible pour ce bien.");
      return;
    }

    let cleanPhone = String(telephone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('00221')) {
      cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.length === 9) {
      cleanPhone = `221${cleanPhone}`;
    }

    const message = `Bonjour, je suis intéressé(e) par votre logement "${titreBien || 'étudiant'}" vu sur LogeÉtudiant. Est-il toujours disponible ?`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Linking.openURL(`tel:${cleanPhone}`);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* 1. NAVBAR FIXE TOUT EN HAUT (NE DISPARAÎT JAMAIS AU SCROLL) */}
      <View style={styles.fixedNavbar}>
        <View style={styles.navLeft}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.navLogo} 
            resizeMode="contain" 
          />
          <View>
            <Text style={styles.navBrand}>LogeÉtudiant</Text>
            <Text style={styles.navTagline}>Logements universitaires au Sénégal</Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <TouchableOpacity 
            style={styles.navIconBtn} 
            onPress={() => navigation.navigate('Conversations')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#1E40AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navIconBtn} 
            onPress={() => navigation.navigate('ColocatairesScreen')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="people-outline" size={20} color="#1E40AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navIconBtn, styles.navLogoutBtn]} 
            onPress={handleLogout}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. CONTENU DÉFILANT */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BANNIÈRE D'ACCÈS RAPIDE (MESSAGES & COLOC) */}
        <View style={styles.quickAccessRow}>
          <TouchableOpacity 
            style={[styles.quickCard, { backgroundColor: '#1E40AF' }]}
            onPress={() => navigation.navigate('Conversations')}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubbles" size={20} color="#fff" />
            <Text style={styles.quickCardText}>Mes Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickCard, { backgroundColor: '#1E40AF' }]}
            onPress={() => navigation.navigate('ColocatairesScreen')}
            activeOpacity={0.85}
          >
            <Ionicons name="people" size={20} color="#fff" />
            <Text style={styles.quickCardText}>Trouver un Coloc</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION RECHERCHE & FILTRE DE PRIX (LIMITATION DE CARACTÈRES) */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={18} color="#1E40AF" style={{ marginRight: 6 }} />
            <TextInput 
              style={styles.searchInput}
              placeholder="(ex: Appartement)"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              maxLength={15} // Limite de 15 caractères demandée
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.priceInputWrapper}>
            <TextInput 
              style={styles.priceInput}
              placeholder="Budget"
              placeholderTextColor="#94A3B8"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
              maxLength={7} // Limite à 7 chiffres (ex: 9 999 999)
            />
            <Text style={styles.priceSuffix}>FCFA</Text>
          </View>
        </View>

        {/* SUGGESTIONS DE TYPES DE LOGEMENT (EX: APPARTEMENT, STUDIO...) */}
        <View style={styles.suggestionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
            {TYPE_SUGGESTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.suggestionChip, 
                  selectedType === t && styles.suggestionChipSelected
                ]}
                onPress={() => setSelectedType(t)}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.suggestionChipText, 
                  selectedType === t && styles.suggestionChipTextSelected
                ]}>
                  {t === 'Tous' ? '✨ Tous les types' : t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FILTRES PAR ZONES UNIVERSITAIRES */}
        <View style={styles.zonesSection}>
          <Text style={styles.sectionHeading}>
            <Ionicons name="school-outline" size={15} color="#1E40AF" /> Campus & Villes :
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {UNIVERSITES.map((uni) => (
              <TouchableOpacity
                key={uni.id}
                style={[
                  styles.filterChip, 
                  selectedUni === uni.id && styles.filterChipSelected
                ]}
                onPress={() => setSelectedUni(uni.id)}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.filterChipText, 
                  selectedUni === uni.id && styles.filterChipTextSelected
                ]}>
                  {uni.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* SÉPARATION STRICTE : LOGEMENTS BAILLEURS VS RECHERCHES COLOCATAIRES */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[styles.segmentedTab, feedMode === 'bailleurs' && styles.segmentedTabActive]}
            onPress={() => setFeedMode('bailleurs')}
            activeOpacity={0.85}
          >
            <Ionicons 
              name="home" 
              size={15} 
              color={feedMode === 'bailleurs' ? '#FFFFFF' : '#1E40AF'} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.segmentedTabText, feedMode === 'bailleurs' && styles.segmentedTabTextActive]}>
              Logements Bailleurs ({displayedBiens.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentedTab, feedMode === 'colocataires' && styles.segmentedTabActive]}
            onPress={() => setFeedMode('colocataires')}
            activeOpacity={0.85}
          >
            <Ionicons 
              name="people" 
              size={15} 
              color={feedMode === 'colocataires' ? '#FFFFFF' : '#1E40AF'} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.segmentedTabText, feedMode === 'colocataires' && styles.segmentedTabTextActive]}>
              Recherches Colocs ({displayedColocs.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* SI MODE BAILLEUR : SECTION SÉPARÉE DES RECHERCHES DE COLOCATION RÉCENTES */}
        {feedMode === 'bailleurs' && colocAnnonces.length > 0 && (
          <View style={styles.colocHighlightSection}>
            <View style={styles.colocHighlightHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="people" size={15} color="#1E40AF" style={{ marginRight: 6 }} />
                <Text style={styles.colocHighlightTitle}>Recherches de Colocataires récentes</Text>
              </View>
              <TouchableOpacity onPress={() => setFeedMode('colocataires')}>
                <Text style={styles.colocHighlightLink}>Voir tout ({colocAnnonces.length}) →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colocHighlightScroll}>
              {colocAnnonces.slice(0, 8).map((colocItem) => (
                <TouchableOpacity
                  key={colocItem.id}
                  style={styles.colocMiniCard}
                  onPress={() => setFeedMode('colocataires')}
                  activeOpacity={0.85}
                >
                  <View style={styles.colocMiniTop}>
                    <Ionicons name="person-circle" size={16} color="#1E40AF" style={{ marginRight: 4 }} />
                    <Text style={styles.colocMiniName} numberOfLines={1}>{formatCleanFullName(colocItem.nomEtudiant)}</Text>
                    <View style={styles.colocMiniBadge}>
                      <Text style={styles.colocMiniBadgeText}>{colocItem.universiteId}</Text>
                    </View>
                  </View>
                  <Text style={styles.colocMiniDesc} numberOfLines={2}>{colocItem.description}</Text>
                  <View style={styles.colocMiniBottom}>
                    <Text style={styles.colocMiniBudget}>{Number(colocItem.budgetMax || 0).toLocaleString()} F</Text>
                    <TouchableOpacity 
                      style={styles.colocMiniWhatsapp}
                      onPress={() => handleContactColoc(colocItem.telephone, colocItem.nomEtudiant, colocItem.universiteId)}
                    >
                      <Ionicons name="logo-whatsapp" size={11} color="#FFF" style={{ marginRight: 3 }} />
                      <Text style={styles.colocMiniWhatsappText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* VUE 1 : LOGEMENTS DES BAILLEURS */}
        {feedMode === 'bailleurs' ? (
          <>
            {/* TITRE DE LA SECTION DYNAMIQUE SELON L'ONGLET DU BAS */}
            <View style={styles.feedHeader}>
              <Text style={styles.feedTitle}>
                {activeBottomTab === 'nouveautes' 
                  ? '⚡ Nouvelles annonces récentes' 
                  : activeBottomTab === 'recents'
                  ? '🕒 Récemment consultés'
                  : activeBottomTab === 'favoris' || selectedUni === 'FAVORIS'
                  ? '❤️ Mes logements favoris'
                  : '🏠 Logements disponibles des bailleurs'} 
                <Text style={styles.feedCount}> ({displayedBiens.length})</Text>
              </Text>
            </View>

            {/* LISTE DES LOGEMENTS */}
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#1E40AF" />
                <Text style={styles.loadingText}>Chargement des logements...</Text>
              </View>
            ) : displayedBiens.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="search-outline" size={44} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Aucun logement trouvé</Text>
                <Text style={styles.emptySubtitle}>
                  {activeBottomTab === 'recents' 
                    ? "Vous n'avez pas encore consulté de logement dans cette session."
                    : activeBottomTab === 'favoris'
                    ? "Vous n'avez pas encore de logement enregistré en favori."
                    : "Aucun bien ne correspond exactement à vos critères de recherche."}
                </Text>
              </View>
            ) : (
              displayedBiens.map((item) => {
                const isFav = favorisIds.includes(item.id);
                const itemPhoto = (item.images && item.images.length > 0 && item.images[0]) || item.image || (item.medias && item.medias.length > 0 && item.medias[0]);

                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.card}
                    onPress={() => handleOpenPropertyDetails(item)}
                    activeOpacity={0.9}
                  >
                    {/* IMAGE DU LOGEMENT */}
                    <View style={styles.cardImageContainer}>
                      <PropertyImageItem uri={itemPhoto} />

                      {/* BADGE CAMPUS / VILLE */}
                      <View style={styles.campusBadge}>
                        <Text style={styles.campusBadgeText}>
                          {item.localisation?.ville ? `${item.localisation.ville} • ` : ''}{item.universiteId || 'Campus'}
                        </Text>
                      </View>

                      {/* BOUTON FAVORIS COEUR */}
                      <TouchableOpacity 
                        style={styles.cardFavBtn} 
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons 
                          name={isFav ? "heart" : "heart-outline"} 
                          size={20} 
                          color={isFav ? "#EF4444" : "#475569"} 
                        />
                      </TouchableOpacity>
                    </View>

                    {/* CONTENU DE LA CARTE */}
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.titre}</Text>
                      <Text style={styles.cardType}>
                        <Ionicons name="bed-outline" size={13} color="#64748B" /> {item.type || 'Studio'} • Proche université
                      </Text>
                      
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.description || 'Logement tout confort disponible immédiatement.'}
                      </Text>

                      {/* LOCALISATION CLIQUEUR MAPS */}
                      <TouchableOpacity 
                        style={styles.locationStrip}
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          const lat = item.localisation?.latitude || 14.69275;
                          const lng = item.localisation?.longitude || -17.44667;
                          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
                        }}
                      >
                        <Ionicons name="location" size={16} color="#1E40AF" style={{ marginRight: 6 }} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {item.localisation?.ville ? `${item.localisation.ville} - ` : ''}
                          {item.localisation?.adresse || 'Localisation disponible'}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color="#1E40AF" style={{ marginLeft: 'auto' }} />
                      </TouchableOpacity>

                      {/* FOOTER : PRIX ET BOUTON WHATSAPP */}
                      <View style={styles.cardFooter}>
                        <View>
                          <Text style={styles.priceAmount}>
                            {Number(item.prix || 0).toLocaleString()} FCFA
                          </Text>
                          <Text style={styles.pricePeriod}>/ mois</Text>
                        </View>

                        <TouchableOpacity 
                          style={styles.whatsappBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleContactProprietaire(item.telephoneProprietaire || item.telephone, item.titre);
                          }}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" style={{ marginRight: 5 }} />
                          <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        ) : (
          /* VUE 2 : ANNONCES DE RECHERCHE DE COLOCATION DES ÉTUDIANTS (100% SÉPARÉES) */
          <View style={styles.colocFullSection}>
            <View style={styles.colocFullHeaderRow}>
              <Text style={styles.colocFullTitle}>👥 Annonces Colocataires ({displayedColocs.length})</Text>
              <TouchableOpacity 
                style={styles.postColocBtn} 
                onPress={() => navigation.navigate('AjouterColocAnnonce')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle" size={16} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.postColocBtnText}>+ Publier</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#1E40AF" />
                <Text style={styles.loadingText}>Chargement des annonces...</Text>
              </View>
            ) : displayedColocs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={44} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Aucune recherche de colocataire</Text>
                <Text style={styles.emptySubtitle}>Soyez le premier à publier une recherche pour cette zone.</Text>
              </View>
            ) : (
              displayedColocs.map((coloc) => (
                <View key={coloc.id} style={styles.card}>
                  <View style={styles.cardBody}>
                    <View style={styles.colocCardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                        <Ionicons name="person-circle" size={26} color="#1E40AF" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle} numberOfLines={1}>{formatCleanFullName(coloc.nomEtudiant)}</Text>
                          <Text style={styles.cardType}>
                            <Ionicons name="school-outline" size={12} color="#64748B" /> Recherche colocation • {coloc.universiteId}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.campusBadge, { backgroundColor: '#1E40AF', position: 'relative', top: 0, left: 0 }]}>
                        <Text style={[styles.campusBadgeText, { color: '#FFFFFF' }]}>{coloc.universiteId}</Text>
                      </View>
                    </View>

                    <Text style={styles.cardDescription} numberOfLines={3}>{coloc.description}</Text>

                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.priceAmount}>{Number(coloc.budgetMax || 0).toLocaleString()} FCFA</Text>
                        <Text style={styles.pricePeriod}>budget max</Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity 
                          style={[styles.whatsappBtn, { backgroundColor: '#128C7E' }]}
                          onPress={() => handleContactColoc(coloc.telephone, coloc.nomEtudiant, coloc.universiteId)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="logo-whatsapp" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.whatsappBtn, { backgroundColor: '#1E40AF' }]}
                          onPress={() => navigation.navigate('Chat', { 
                            recipientId: coloc.etudiantId, 
                            recipientName: formatCleanFullName(coloc.nomEtudiant) || "Étudiant",
                            propertyTitle: `Coloc - ${coloc.universiteId}`
                          })}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="chatbubbles" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.whatsappBtnText}>Discuter</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* 3. MENU NAVIGATION TOUT EN BAS (ACCUEIL, NOUVEAUTÉS, CONSULTATIONS RÉCENTES, FAVORIS, PROFIL) */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => {
            setActiveBottomTab('accueil');
            setSelectedUni('TOUS');
          }}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={activeBottomTab === 'accueil' ? "home" : "home-outline"} 
            size={22} 
            color={activeBottomTab === 'accueil' ? "#1E40AF" : "#64748B"} 
          />
          <Text style={[styles.tabLabel, activeBottomTab === 'accueil' && styles.tabLabelActive]}>
            Accueil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveBottomTab('nouveautes')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={activeBottomTab === 'nouveautes' ? "flash" : "flash-outline"} 
            size={22} 
            color={activeBottomTab === 'nouveautes' ? "#1E40AF" : "#64748B"} 
          />
          <Text style={[styles.tabLabel, activeBottomTab === 'nouveautes' && styles.tabLabelActive]}>
            Nouveautés
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveBottomTab('recents')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={activeBottomTab === 'recents' ? "time" : "time-outline"} 
            size={22} 
            color={activeBottomTab === 'recents' ? "#1E40AF" : "#64748B"} 
          />
          <Text style={[styles.tabLabel, activeBottomTab === 'recents' && styles.tabLabelActive]}>
            Consultés
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveBottomTab('favoris')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={activeBottomTab === 'favoris' ? "heart" : "heart-outline"} 
            size={22} 
            color={activeBottomTab === 'favoris' ? "#EF4444" : "#64748B"} 
          />
          <Text style={[styles.tabLabel, activeBottomTab === 'favoris' && styles.tabLabelActive]}>
            Favoris
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="person-circle-outline" 
            size={23} 
            color="#64748B" 
          />
          <Text style={styles.tabLabel}>Profil</Text>
        </TouchableOpacity>
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

  // 1. NAVBAR FIXE TOUT EN HAUT
  fixedNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 100,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navLogo: {
    width: 38,
    height: 38,
    marginRight: 10,
  },
  navBrand: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  navTagline: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  navLogoutBtn: {
    backgroundColor: '#FEF2F2',
  },

  // 2. CONTENU DÉFILANT
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  quickCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  quickCardText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  searchInputWrapper: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  priceInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  priceInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  priceSuffix: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  zonesSection: {
    marginBottom: 14,
  },
  
  // SUGGESTIONS RAPIDES DE RECHERCHE
  suggestionsContainer: {
    marginBottom: 12,
  },
  suggestionsScroll: {
    flexDirection: 'row',
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    marginRight: 6,
  },
  suggestionChipSelected: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  suggestionChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  suggestionChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // SÉPARATEUR SEGMENTÉ : LOGEMENTS BAILLEURS VS COLOCATIONS ÉTUDIANTES
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 4,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentedTabActive: {
    backgroundColor: '#1E40AF',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  segmentedTabTextActive: {
    color: '#FFFFFF',
  },

  // APERÇU HORIZONTAL SÉPARÉ DES RECHERCHES DE COLOCATION
  colocHighlightSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  colocHighlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  colocHighlightTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  colocHighlightLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  colocHighlightScroll: {
    flexDirection: 'row',
  },
  colocMiniCard: {
    width: 200,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  colocMiniTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  colocMiniName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  colocMiniBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  colocMiniBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  colocMiniDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
    marginBottom: 8,
  },
  colocMiniBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
  },
  colocMiniBudget: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16A34A',
  },
  colocMiniWhatsapp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#128C7E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  colocMiniWhatsappText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // VUE PLEINE DES COLOCATIONS (SÉPARATION TOTALE)
  colocFullSection: {
    marginBottom: 10,
  },
  colocFullHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  colocFullTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  postColocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  postColocBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  colocCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  feedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },

  // CARTE DE LOGEMENT MODERNE
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  campusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  campusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardFavBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  locationStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  priceAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E40AF',
  },
  pricePeriod: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#128C7E', // Vert WhatsApp authentique plus foncé
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#128C7E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },

  // 3. BARRE DE NAVIGATION EN BAS
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#1E40AF',
    fontWeight: '800',
  },
});
