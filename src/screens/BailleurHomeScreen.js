import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Image, 
  Alert, 
  TextInput, 
  Modal, 
  Linking, 
  SafeAreaView, 
  Platform, 
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { db, auth } from '../config/firebase';
import { logoutUser } from '../services/authService';
import { getSubscriptionStatus } from '../services/subscriptionService';
import { registerForPushNotificationsAsync, subscribeToUserNotifications, broadcastNotification } from '../services/notificationService';
import { 
  UNIVERSITES, 
  SENEGAL_REGIONS, 
  ZONES_SENEGAL,
  getRegionById, 
  getUniversitesByRegion, 
  getUniversitesByVille,
  getUniversitesByZone,
  isPropertyInZone,
  getUniversitiesForCountry,
  getCitiesForCountry,
} from '../services/universityService';
import { AFRICAN_COUNTRIES, DEFAULT_COUNTRY, getCountryById } from '../services/countryService';
import CountryPickerModal from '../components/CountryPickerModal';
import { useTranslation } from '../i18n';

const TYPES_LOGEMENT = ['Studio', 'Chambre', 'Appartement', 'Colocation', 'Villa'];

export default function BailleurHomeScreen({ navigation }) {
  const { t } = useTranslation();
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBien, setEditingBien] = useState(null);
  const [selectedFilterZone, setSelectedFilterZone] = useState('TOUS');
  
  // État pour la validation du compte bailleur
  const [statutValidation, setStatutValidation] = useState('en_attente');
  const [subInfo, setSubInfo] = useState(null);

  // Formulaire state
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [type, setType] = useState('Studio');
  const [selectedRegion, setSelectedRegion] = useState('DAKAR');
  const [selectedVille, setSelectedVille] = useState('DAKAR_VILLE');
  const [universiteId, setUniversiteId] = useState('UCAD');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [mediasUris, setMediasUris] = useState([]); // Tableau pour stocker jusqu'à 8 photos/vidéos
  
  // Coordonnées géographiques (Dakar par défaut)
  const [latitude, setLatitude] = useState(14.69275);
  const [longitude, setLongitude] = useState(-17.44667);
  const [gpsCapturing, setGpsCapturing] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Régions / Villes du pays sélectionné
  const availableRegions = useMemo(() => {
    return getCitiesForCountry(selectedCountry?.id || 'SN');
  }, [selectedCountry]);

  const currentRegion = useMemo(() => {
    return availableRegions.find((r) => r.id === selectedRegion) || availableRegions[0] || SENEGAL_REGIONS[0];
  }, [availableRegions, selectedRegion]);

  const currentRegionUnis = useMemo(() => {
    if (selectedCountry?.id === 'SN' || !selectedCountry) {
      return getUniversitesByZone(selectedRegion);
    }
    if (currentRegion?.universites && currentRegion.universites.length > 0) {
      return currentRegion.universites;
    }
    return getUniversitiesForCountry(selectedCountry?.id);
  }, [selectedCountry, selectedRegion, currentRegion]);

  // Initialisation des notifications Push & Écoute de la cloche en direct
  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      registerForPushNotificationsAsync(currentUid);
      const unsub = subscribeToUserNotifications(currentUid, ({ unreadCount }) => {
        setUnreadNotifsCount(unreadCount);
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, []);

  const fetchMesBiens = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      
      // 1. Charger en parallèle le statut du compte et les biens du bailleur
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const q = query(collection(db, "properties"), where("proprietaireId", "==", auth.currentUser.uid));

      const [userSnap, querySnapshot] = await Promise.all([
        getDoc(userDocRef).catch(() => null),
        getDocs(q).catch(() => ({ empty: true, forEach: () => {} }))
      ]);

      if (userSnap && userSnap.exists()) {
        const userData = userSnap.data();
        setStatutValidation(userData.statutValidation || 'en_attente');
        setSubInfo(getSubscriptionStatus(userData));
      }

      let list = [];
      if (querySnapshot && !querySnapshot.empty) {
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
      }
      setBiens(list);
    } catch (error) {
      console.error("Erreur chargement biens bailleur :", error);
    } finally {
      setLoading(false);
    }
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
        Alert.alert(t('landlordHome.permissionDeniedTitle'), t('landlordHome.permissionGpsMsg'));
        setGpsCapturing(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude: lat, longitude: lng } = location.coords;
      
      setLatitude(lat);
      setLongitude(lng);
      Alert.alert(t('landlordHome.positionSavedTitle'), t('landlordHome.positionSavedMsg', { lat: lat.toFixed(5), lng: lng.toFixed(5) }));
    } catch (error) {
      console.error("Erreur géolocalisation :", error);
      Alert.alert(t('common.error'), t('landlordHome.gpsErrorMsg'));
    } finally {
      setGpsCapturing(false);
    }
  };

  // Fonction pour sélectionner plusieurs photos ou vidéos (maximum 8 au total)
  const handlePickMedias = async () => {
    const remainingSlots = 8 - mediasUris.length;
    if (remainingSlots <= 0) {
      Alert.alert(t('landlordHome.limitReachedTitle'), t('landlordHome.max8PhotosMsg'));
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

  // Sélection d'un pays africain
  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    const regs = getCitiesForCountry(country.id);
    if (regs && regs.length > 0) {
      const firstReg = regs[0];
      setSelectedRegion(firstReg.id);
      if (firstReg.villes && firstReg.villes.length > 0) {
        setSelectedVille(firstReg.villes[0].id);
        setLatitude(firstReg.villes[0].lat || 14.69275);
        setLongitude(firstReg.villes[0].lng || -17.44667);
      }
      if (firstReg.defaultUni) {
        setUniversiteId(firstReg.defaultUni);
      } else if (firstReg.universites && firstReg.universites.length > 0) {
        setUniversiteId(firstReg.universites[0].id);
      }
    }
  };

  // Sélection d'une région administrative
  const handleSelectRegion = (region) => {
    setSelectedRegion(region.id);
    const defaultVilleObj = region.villes && region.villes[0];
    if (defaultVilleObj) {
      setSelectedVille(defaultVilleObj.id);
      setLatitude(defaultVilleObj.lat || 14.69275);
      setLongitude(defaultVilleObj.lng || -17.44667);
    }
    if (selectedCountry?.id === 'SN' || !selectedCountry) {
      const zoneUnis = getUniversitesByZone(region.id);
      if (zoneUnis.length > 0) {
        if (!zoneUnis.some(u => u.id === universiteId)) {
          setUniversiteId(zoneUnis[0].id);
        }
      } else if (region.defaultUni) {
        setUniversiteId(region.defaultUni);
      }
    } else {
      if (region.universites && region.universites.length > 0) {
        setUniversiteId(region.universites[0].id);
      } else if (region.defaultUni) {
        setUniversiteId(region.defaultUni);
      }
    }
  };

  // Sélection d'une ville précise dans la région
  const handleSelectVille = (ville) => {
    setSelectedVille(ville.id);
    if (ville.lat) setLatitude(ville.lat);
    if (ville.lng) setLongitude(ville.lng);
    
    // Si une université est située dans cette ville spécifique, la proposer
    const cityUnis = getUniversitesByVille(ville.id, selectedCountry?.id || 'SN');
    if (cityUnis.length > 0 && !cityUnis.some(u => u.id === universiteId)) {
      setUniversiteId(cityUnis[0].id);
    }
  };

  const handleOpenModal = (bien = null) => {
    if (subInfo?.status === 'expired' && !bien) {
      Alert.alert(
        t('landlordHome.subscriptionRequiredTitle'),
        t('landlordHome.subscriptionRequiredMsg'),
        [
          { text: t('landlordHome.later'), style: "cancel" },
          { text: t('landlordHome.viewPlansFrom1500'), onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }

    if (statutValidation !== 'valide' && !bien) {
      Alert.alert(
        t('landlordHome.pendingAccount'),
        t('landlordHome.pendingAccountDesc')
      );
      return;
    }

    if (bien) {
      setEditingBien(bien);
      const c = getCountryById(bien.countryId || 'SN');
      setSelectedCountry(c);
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

      let initialReg = bien.localisation?.zoneId || bien.localisation?.regionId;
      if (!initialReg) {
        const countryUnis = (c.id === 'SN' ? UNIVERSITES : getUniversitiesForCountry(c.id));
        const matchingUni = countryUnis.find(u => u.id === bien.universiteId);
        initialReg = matchingUni?.regionId || matchingUni?.villeId || 'DAKAR';
      }
      setSelectedRegion(initialReg);
      setSelectedVille(bien.localisation?.villeId || 'DAKAR_VILLE');
    } else {
      setEditingBien(null);
      setSelectedCountry(DEFAULT_COUNTRY);
      setTitre('');
      setDescription('');
      setPrix('');
      setType('Studio');
      setUniversiteId('UCAD');
      setTelephone('');
      setAdresse('');
      setMediasUris([]);
      setSelectedRegion('DAKAR');
      setSelectedVille('DAKAR_VILLE');
      setLatitude(14.69275);
      setLongitude(-17.44667);
    }
    setModalVisible(true);
  };

  const handleSaveProperty = async () => {
    if (!titre.trim() || !prix || !type.trim() || !adresse.trim()) {
      Alert.alert(t('landlordHome.requiredFieldsTitle'), t('landlordHome.requiredFieldsMsg'));
      return;
    }

    if (mediasUris.length > 8) {
      Alert.alert(t('landlordHome.limitReachedTitle'), t('landlordHome.limitReachedMsg'));
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

      const countryCode = selectedCountry?.id || 'SN';
      const allCountryUnis = countryCode === 'SN' ? UNIVERSITES : getUniversitiesForCountry(countryCode);
      const matchingUni = allCountryUnis.find(u => u.id === universiteId);
      const activeVille = currentRegion?.villes?.find(v => v.id === selectedVille) || currentRegion?.villes?.[0];

      const propertyData = {
        titre: titre.trim(),
        description: description.trim(),
        prix: Number(prix),
        type: type.trim(),
        countryId: countryCode,
        countryNom: selectedCountry?.name || 'Sénégal',
        currency: selectedCountry?.currency || 'FCFA',
        universiteId,
        universiteNom: matchingUni?.nom || universiteId,
        telephoneProprietaire: telephone.trim(),
        proprietaireId: auth.currentUser.uid,
        localisation: {
          adresse: adresse.trim(),
          zoneId: selectedRegion,
          regionId: selectedRegion,
          region: currentRegion?.nom || selectedRegion,
          villeId: selectedVille,
          ville: activeVille?.nom || currentRegion?.nom || selectedCountry?.primaryCity || 'Dakar',
          latitude,
          longitude,
        },
        images: mediasUris.length > 0 ? mediasUris : ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80'],
        updatedAt: new Date(),
      };

      if (editingBien) {
        const docRef = doc(db, "properties", editingBien.id);
        await updateDoc(docRef, propertyData);
        Alert.alert(t('common.success'), t('landlordHome.updateSuccess'));
      } else {
        propertyData.createdAt = new Date();
        const newDoc = await addDoc(collection(db, "properties"), propertyData);
        Alert.alert(t('common.success'), t('landlordHome.publishSuccess'));

        // Notification automatique diffusée aux étudiants
        broadcastNotification({
          title: "Nouveau logement étudiant 🏠",
          body: `${propertyData.titre || 'Un logement'} est disponible près de ${propertyData.universiteId || 'votre campus'} - ${propertyData.prix} ${propertyData.currency || 'FCFA'}.`,
          type: 'new_property',
          data: { propertyId: newDoc.id, universiteId: propertyData.universiteId, countryId: propertyData.countryId }
        }).catch(() => {});
      }

      setModalVisible(false);
      fetchMesBiens();
    } catch (error) {
      console.error("Erreur enregistrement bien :", error);
      Alert.alert(t('common.error'), "Impossible d'enregistrer le logement pour le moment.");
    }
  };

  const handleDeleteProperty = (id) => {
    Alert.alert(
      t('common.confirm'),
      t('landlordHome.confirmDelete'),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "properties", id));
              Alert.alert(t('common.success'), t('landlordHome.deleteListing'));
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
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter de votre compte ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Se déconnecter", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await logoutUser();
              if (res && res.success) {
                navigation.replace('Login');
              } else {
                navigation.replace('Login');
              }
            } catch (e) {
              navigation.replace('Login');
            }
          }
        }
      ]
    );
  };

  const filteredBiens = selectedFilterZone === 'TOUS' 
    ? biens 
    : biens.filter(item => isPropertyInZone(item, selectedFilterZone));

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
        <Text style={styles.propertyBadgeText}>
          {getCountryById(item.countryId)?.flag || '🇸🇳'} {item.universiteId}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.propertyTitle}>{item.titre}</Text>
        <Text style={styles.propertyType}>
          {t('landlordHome.typeLabel', { type: t(`landlordHome.types.${item.type}`) || item.type })}
        </Text>
        <Text style={styles.propertyAddress} numberOfLines={1}>
          📍 {item.localisation?.ville ? `${item.localisation.ville} • ` : ''}{item.localisation?.adresse || t('landlordHome.addressNotSpecified')}
        </Text>
        <Text style={styles.propertyDescription} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.propertyPrice}>
          {item.prix?.toLocaleString ? item.prix.toLocaleString('fr-FR') : item.prix} {item.currency || 'FCFA'} <Text style={styles.period}>{t('landlordHome.perMonth')}</Text>
        </Text>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => handleOpenModal(item)}>
            <Ionicons name="create-outline" size={15} color="#003880" style={{ marginRight: 4 }} />
            <Text style={styles.editButtonText}>{t('landlordHome.editListing')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProperty(item.id)}>
            <Ionicons name="trash-outline" size={15} color="#DC2626" style={{ marginRight: 4 }} />
            <Text style={styles.deleteButtonText}>{t('landlordHome.deleteListing')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* NAVBAR FIXE TOUT EN HAUT (NE DISPARAÎT PAS AU SCROLL) */}
      <View style={styles.fixedNavbar}>
        <View style={styles.navLeft}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.navLogo} 
            resizeMode="contain" 
          />
          <View>
            <Text style={styles.navBrand}>{t('landlordHome.title')}</Text>
            <Text style={styles.navTagline}>{t('landlordHome.subtitle')}</Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')} 
            style={styles.navIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={18} color="#003880" />
            {unreadNotifsCount > 0 && (
              <View style={styles.notifBadgeCircle}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')} 
            style={styles.navIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="person-outline" size={18} color="#003880" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Conversations')} 
            style={styles.navIconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chatbubbles-outline" size={18} color="#003880" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLogout} 
            style={[styles.navIconBtn, styles.navLogoutBtn]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Bannière d'avertissement si le compte est en attente de validation */}
        {statutValidation !== 'valide' && (
          <View style={styles.warningBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="alert-circle" size={18} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.warningTitle}>{t('landlordHome.pendingAccount')}</Text>
            </View>
            <Text style={styles.warningText}>
              {t('landlordHome.pendingAccountDesc')}
            </Text>
          </View>
        )}

        {/* BANDEAU ABONNEMENT PRO / 30 JOURS GRATUITS */}
        <TouchableOpacity 
          style={styles.subBannerPro} 
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.88}
        >
          <View style={styles.subBannerIcon}>
            <Ionicons name="sparkles" size={16} color="#D97706" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.subBannerTitle}>
                {subInfo?.status === 'active' ? t('landlordHome.proActiveTitle') :
                 subInfo?.status === 'expired' ? t('landlordHome.expiredTitle') : t('landlordHome.trialTitle')}
              </Text>
              <View style={[
                styles.subBannerBadge,
                subInfo?.status === 'active' && { backgroundColor: '#ECFDF5' },
                subInfo?.status === 'expired' && { backgroundColor: '#FEF2F2' },
              ]}>
                <Text style={[
                  styles.subBannerBadgeText,
                  subInfo?.status === 'active' && { color: '#059669' },
                  subInfo?.status === 'expired' && { color: '#DC2626' },
                ]}>
                  {subInfo?.status === 'active' ? t('landlordHome.daysLeft', { days: subInfo.daysLeft }) :
                   subInfo?.status === 'expired' ? t('landlordHome.renew') : t('landlordHome.daysOffered', { days: subInfo?.daysLeft || 30 })}
                </Text>
              </View>
            </View>
            <Text style={styles.subBannerSubtitle} numberOfLines={1}>
              {subInfo?.status === 'expired' ? t('landlordHome.subBannerExpiredDesc') : t('landlordHome.subBannerDesc')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#003880" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.addButton, statutValidation !== 'valide' && { backgroundColor: '#CBD5E0' }]} 
          onPress={() => handleOpenModal()}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.addButtonText}>{t('landlordHome.publishProperty')}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, selectedFilterZone === 'TOUS' && styles.filterChipActive]}
              onPress={() => setSelectedFilterZone('TOUS')}
            >
              <Text style={[styles.filterText, selectedFilterZone === 'TOUS' && styles.filterTextActive]}>
                {t('landlordHome.allZones')} ({biens.length})
              </Text>
            </TouchableOpacity>
            {ZONES_SENEGAL.map((zone) => {
              const count = biens.filter(b => isPropertyInZone(b, zone.id)).length;
              return (
                <TouchableOpacity 
                  key={zone.id} 
                  style={[styles.filterChip, selectedFilterZone === zone.id && styles.filterChipActive]}
                  onPress={() => setSelectedFilterZone(zone.id)}
                >
                  <Text style={[styles.filterText, selectedFilterZone === zone.id && styles.filterTextActive]}>
                    {zone.nom} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>{t('landlordHome.myPropertiesCount', { count: filteredBiens.length })}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#003880" style={{ marginTop: 40 }} />
        ) : filteredBiens.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('landlordHome.noPropertiesMatched')}</Text>
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
                <Text style={styles.modalTitle}>{editingBien ? t('landlordHome.editModalTitle') : t('landlordHome.publishModalTitle')}</Text>
                <Text style={styles.modalSubtitle}>{t('landlordHome.publishModalSubtitle')}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              
              {/* SECTION 1 : INFORMATIONS CLÉS */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="pricetag" size={16} color="#003880" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionHeading}>{t('landlordHome.basicInfoSection')}</Text>
                </View>

                <Text style={styles.fieldLabel}>{t('landlordHome.listingTitleLabel')}</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder={t('landlordHome.listingTitlePlaceholder')} 
                  placeholderTextColor="#A0AEC0"
                  value={titre} 
                  onChangeText={setTitre} 
                  maxLength={40}
                />

                <Text style={styles.fieldLabel}>{t('landlordHome.propertyTypeLabel')}</Text>
                <View style={styles.typeChipsContainer}>
                  {TYPES_LOGEMENT.map((typeItem) => (
                    <TouchableOpacity
                      key={typeItem}
                      style={[styles.typeChip, type === typeItem && styles.typeChipSelected]}
                      onPress={() => setType(typeItem)}
                    >
                      <Text style={[styles.typeChipText, type === typeItem && styles.typeChipTextSelected]}>
                        {t(`landlordHome.types.${typeItem}`) || typeItem}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>{t('landlordHome.monthlyRentLabel', { currency: selectedCountry.currency || 'FCFA' })}</Text>
                <View style={styles.priceInputWrapper}>
                  <TextInput 
                    style={styles.priceInputField} 
                    placeholder="75000" 
                    placeholderTextColor="#A0AEC0"
                    value={prix} 
                    onChangeText={setPrix} 
                    keyboardType="numeric" 
                    maxLength={10}
                  />
                  <View style={styles.currencyBadge}>
                    <Text style={styles.currencyBadgeText}>{selectedCountry.currency || 'FCFA'} {t('landlordHome.perMonth')}</Text>
                  </View>
                </View>
              </View>

              {/* SECTION 2 : LOCALISATION, RÉGION & CAMPUS */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="location" size={16} color="#003880" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionHeading}>{t('landlordHome.locationSection')}</Text>
                </View>

                {/* 0. SÉLECTION DU PAYS AFRICAIN */}
                <Text style={styles.fieldLabel}>{t('landlordHome.countryStepLabel')}</Text>
                <TouchableOpacity
                  style={styles.countryPickerCard}
                  onPress={() => setCountryModalVisible(true)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.countryFlagLarge}>{selectedCountry.flag}</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.countryCardName}>{selectedCountry.name}</Text>
                    <Text style={styles.countryCardDetails}>
                      {t('landlordHome.currencyBadge', { currency: selectedCountry.currency, dialCode: selectedCountry.dialCode })}
                    </Text>
                  </View>
                  <View style={styles.countryChangePill}>
                    <Text style={styles.countryChangePillText}>{t('landlordHome.changeBtn')}</Text>
                    <Ionicons name="chevron-forward" size={13} color="#003880" />
                  </View>
                </TouchableOpacity>

                {/* 1. SÉLECTION DE LA RÉGION / VILLE */}
                <Text style={styles.fieldLabel}>{t('landlordHome.regionStepLabel', { country: selectedCountry.name })}</Text>
                <Text style={styles.fieldHelpText}>
                  {t('landlordHome.regionSelectHelp')}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionScroll}>
                  {availableRegions.map((reg) => (
                    <TouchableOpacity
                      key={reg.id}
                      style={[styles.regionChip, selectedRegion === reg.id && styles.regionChipSelected]}
                      onPress={() => handleSelectRegion(reg)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.regionChipText, selectedRegion === reg.id && styles.regionChipTextSelected]}>
                        {selectedRegion === reg.id ? '✓ ' : ''}{reg.nom}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* 2. SÉLECTION DE LA VILLE DE CETTE RÉGION */}
                <Text style={styles.fieldLabel}>
                  {t('landlordHome.cityStepLabel', { region: currentRegion.nom })}
                </Text>
                <Text style={styles.fieldHelpText}>
                  {currentRegion.description} :
                </Text>
                <View style={styles.villeChipsWrapper}>
                  {(currentRegion.villes || []).map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.villeChip, selectedVille === v.id && styles.villeChipSelected]}
                      onPress={() => handleSelectVille(v)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.villeChipText, selectedVille === v.id && styles.villeChipTextSelected]}>
                        {selectedVille === v.id ? '✓ ' : ''}{v.nom}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 3. CAMPUS & UNIVERSITÉS DE CETTE RÉGION */}
                <Text style={styles.fieldLabel}>
                  {t('landlordHome.campusStepLabel', { region: currentRegion.nom })}
                </Text>
                <Text style={styles.fieldHelpText}>
                  {t('landlordHome.campusSelectHelp')}
                </Text>
                <View style={styles.zoneChipsWrapper}>
                  {currentRegionUnis.map((uni) => (
                    <TouchableOpacity 
                      key={uni.id} 
                      style={[styles.zoneChip, universiteId === uni.id && styles.zoneChipSelected]}
                      onPress={() => setUniversiteId(uni.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.zoneText, universiteId === uni.id && styles.zoneTextSelected]}>
                        {universiteId === uni.id ? '✓ ' : ''}{uni.nom}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>{t('landlordHome.addressLabel')}</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder={t('landlordHome.addressPlaceholder')} 
                  placeholderTextColor="#A0AEC0"
                  value={adresse} 
                  onChangeText={setAdresse} 
                  maxLength={50}
                />

                {/* CARTE GPS PRO */}
                <Text style={styles.fieldLabel}>{t('landlordHome.gpsLabel')}</Text>
                <View style={styles.gpsCardPro}>
                  <View style={styles.gpsHeader}>
                    <View style={styles.gpsCoordsBox}>
                      <Text style={styles.gpsCoordsTitle}>
                        {t('landlordHome.gpsTitle', { region: currentRegion.nom, city: currentRegion.villes.find(v => v.id === selectedVille)?.nom || 'Sénégal' })}
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
                      <Ionicons name="navigate-outline" size={15} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.gpsCaptureBtnText}>
                        {gpsCapturing ? t('landlordHome.detectingGps') : t('landlordHome.useCurrentGps')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.gpsVerifyBtn}
                      onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)}
                    >
                      <Ionicons name="map-outline" size={15} color="#003880" style={{ marginRight: 6 }} />
                      <Text style={styles.gpsVerifyBtnText}>{t('landlordHome.verifyOnMaps')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* SECTION 3 : CONTACT */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="call" size={16} color="#003880" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionHeading}>{t('landlordHome.directContactSection')}</Text>
                </View>

                <Text style={styles.fieldLabel}>{t('landlordHome.phoneWhatsappLabel')}</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder={t('landlordHome.phoneWhatsappPlaceholder')} 
                  placeholderTextColor="#A0AEC0"
                  value={telephone} 
                  onChangeText={setTelephone} 
                  keyboardType="numeric" 
                  maxLength={9}
                />
              </View>

              {/* SECTION 4 : PHOTOS & VIDÉOS */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeaderBetween}>
                  <View style={styles.sectionHeadingRow}>
                    <Ionicons name="images" size={16} color="#003880" style={{ marginRight: 6 }} />
                    <Text style={styles.sectionHeading}>{t('landlordHome.photosVideosSection')}</Text>
                  </View>
                  <View style={styles.counterPill}>
                    <Text style={styles.counterPillText}>{t('landlordHome.filesCounter', { count: mediasUris.length })}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.uploadDashedZone} onPress={handlePickMedias}>
                  <Ionicons name="cloud-upload-outline" size={38} color="#003880" style={{ marginBottom: 6 }} />
                  <Text style={styles.uploadTitle}>{t('landlordHome.addPhotosTitle')}</Text>
                  <Text style={styles.uploadSubtitle}>{t('landlordHome.addPhotosSubtitle')}</Text>
                </TouchableOpacity>

                {mediasUris.length > 0 && (
                  <ScrollView horizontal showsHorizontalIndicator={false} style={styles.previewScroll}>
                    {mediasUris.map((uri, index) => (
                      <View key={index} style={styles.previewThumbContainer}>
                        <Image source={{ uri }} style={styles.previewThumb} />
                        <TouchableOpacity style={styles.removeThumbBtn} onPress={() => handleRemoveMedia(index)}>
                          <Ionicons name="close" size={14} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* SECTION 5 : DESCRIPTION */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeadingRow}>
                  <Ionicons name="document-text" size={16} color="#003880" style={{ marginRight: 6 }} />
                  <Text style={styles.sectionHeading}>{t('landlordHome.detailedDescSection')}</Text>
                </View>
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  placeholder={t('landlordHome.descPlaceholder')} 
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
                  <Text style={styles.cancelButtonText}>{t('landlordHome.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProperty}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>
                    {editingBien ? t('landlordHome.saveChangesBtn') : t('landlordHome.publishListingBtn')}
                  </Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SÉLECTEUR DE PAYS AFRICAINS */}
      <CountryPickerModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
        onSelectCountry={handleSelectCountry}
        selectedCountry={selectedCountry}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // BANDEAU ABONNEMENT PRO BAILLEUR
  subBannerPro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  subBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subBannerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginRight: 6,
  },
  subBannerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  subBannerBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subBannerBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D97706',
  },

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
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
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
    color: '#E8A008', // Ocre doré officiel du logo
    fontWeight: '700',
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
    position: 'relative',
  },
  notifBadgeCircle: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  navLogoutBtn: {
    backgroundColor: '#FEF2F2',
  },
  container: { padding: 16, flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A365D' },
  headerSubtitle: { fontSize: 12, color: '#718096' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  profileButton: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: '#BFDBFE' },
  profileButtonText: { color: '#003880', fontWeight: 'bold', fontSize: 12 },
  msgButton: { backgroundColor: '#EDF2F7', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: '#CBD5E0' },
  msgButtonText: { color: '#2D3748', fontWeight: 'bold', fontSize: 12 },
  logoutButton: { padding: 6 },
  logoutText: { color: '#E53E3E', fontWeight: 'bold', fontSize: 12 },
  warningBanner: { backgroundColor: '#FEFCBF', borderWidth: 1, borderColor: '#ECC94B', padding: 12, borderRadius: 8, marginBottom: 15 },
  warningTitle: { fontSize: 13, fontWeight: 'bold', color: '#744210', marginBottom: 2 },
  warningText: { fontSize: 12, color: '#975A16', lineHeight: 16 },
  addButton: { 
    backgroundColor: '#E8A008', // Ocre doré officiel du logo
    padding: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 15, 
    elevation: 3,
    shadowColor: '#E8A008',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  filterSection: { marginBottom: 15 },
  filterScroll: { paddingVertical: 5 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#EDF2F7', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#003880', borderColor: '#003880' },
  filterText: { fontSize: 12, color: '#4A5568', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 12 },
  emptyContainer: { padding: 30, alignItems: 'center' },
  emptyText: { color: '#718096', textAlign: 'center', fontSize: 14 },
  propertyCard: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', position: 'relative', elevation: 1 },
  propertyImage: { width: '100%', height: 140 },
  propertyBadge: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    backgroundColor: '#FFFBEB', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  propertyBadgeText: { color: '#E8A008', fontSize: 11, fontWeight: 'bold' },
  cardContent: { padding: 12 },
  propertyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A365D', marginBottom: 4 },
  propertyType: { fontSize: 12, color: '#4A5568', marginBottom: 2, fontWeight: '600' },
  propertyAddress: { fontSize: 12, color: '#718096', marginBottom: 6 },
  propertyDescription: { fontSize: 13, color: '#718096', marginBottom: 8 },
  propertyPrice: { fontSize: 16, fontWeight: '800', color: '#E8A008', marginBottom: 10 },
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
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionHeading: { fontSize: 14, fontWeight: 'bold', color: '#2D3748' },
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
  typeChipSelected: { backgroundColor: '#003880', borderColor: '#003880' },
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
  regionScroll: { marginBottom: 10 },
  regionChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  regionChipSelected: {
    backgroundColor: '#003880',
    borderColor: '#003880',
  },
  regionChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  regionChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
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
  villeChipSelected: { backgroundColor: '#003880', borderColor: '#003880' },
  villeChipText: { fontSize: 12, color: '#4A5568', fontWeight: '600' },
  villeChipTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },

  // ZONE UNIVERSITAIRE
  zoneChipsWrapper: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  zoneChip: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EDF2F7', borderRadius: 16, marginRight: 6, marginBottom: 6 },
  zoneChipSelected: { backgroundColor: '#003880' },
  zoneText: { fontSize: 11, color: '#4A5568' },
  zoneTextSelected: { color: '#fff', fontWeight: 'bold' },

  // CARTE GPS PRO
  gpsCardPro: { backgroundColor: '#F7FAFC', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#CBD5E0', marginBottom: 6 },
  gpsHeader: { marginBottom: 10 },
  gpsCoordsBox: { backgroundColor: '#EDF2F7', padding: 8, borderRadius: 6 },
  gpsCoordsTitle: { fontSize: 10, fontWeight: 'bold', color: '#718096', textTransform: 'uppercase', marginBottom: 2 },
  gpsCoordsValue: { fontSize: 12, color: '#4A5568' },
  gpsBold: { fontWeight: 'bold', color: '#003880' },
  gpsActionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gpsCaptureBtn: { flex: 1.5, backgroundColor: '#003880', paddingVertical: 9, borderRadius: 6, alignItems: 'center', marginRight: 6 },
  gpsCaptureBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  gpsVerifyBtn: { flex: 1, backgroundColor: '#EFF6FF', paddingVertical: 9, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#BFDBFE' },
  gpsVerifyBtnText: { color: '#003880', fontSize: 12, fontWeight: 'bold' },

  // UPLOAD PHOTOS EN ZONE TIRETEE
  uploadDashedZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#003880',
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadIcon: { fontSize: 28, marginBottom: 4 },
  uploadTitle: { fontSize: 14, fontWeight: 'bold', color: '#003880' },
  uploadSubtitle: { fontSize: 11, color: '#718096', marginTop: 2, textAlign: 'center' },
  counterPill: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  counterPillText: { fontSize: 11, fontWeight: 'bold', color: '#003880' },
  previewScroll: { marginTop: 6, marginBottom: 4, maxHeight: 80 },
  previewThumbContainer: { position: 'relative', marginRight: 8 },
  previewThumb: { width: 70, height: 70, borderRadius: 8 },
  removeThumbBtn: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  removeThumbText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  // BOUTONS FOOTER
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 25 },
  cancelButton: { flex: 1, backgroundColor: '#EDF2F7', padding: 14, borderRadius: 10, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#CBD5E0' },
  cancelButtonText: { color: '#4A5568', fontWeight: 'bold', fontSize: 14 },
  saveButton: { flex: 2, backgroundColor: '#003880', padding: 14, borderRadius: 10, alignItems: 'center', elevation: 2 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // SÉLECTEUR DE PAYS AFRICAINS DANS LE FORMULAIRE
  countryPickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  countryFlagLarge: {
    fontSize: 28,
  },
  countryCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#003880',
  },
  countryCardDetails: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  countryChangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countryChangePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003880',
    marginRight: 2,
  },
});
