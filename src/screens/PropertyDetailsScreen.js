import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Linking, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  Dimensions, 
  SafeAreaView, 
  Platform, 
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, getDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useTranslation } from '../i18n';

const { width } = Dimensions.get('window');

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80';

const PropertyDetailImage = ({ uri }) => {
  const [imgSrc, setImgSrc] = useState(() => {
    if (uri && typeof uri === 'string' && (uri.startsWith('http://') || uri.startsWith('https://'))) {
      return uri;
    }
    return DEFAULT_PROPERTY_IMAGE;
  });

  return (
    <Image 
      source={{ uri: imgSrc }} 
      style={styles.propertyImage} 
      onError={() => setImgSrc(DEFAULT_PROPERTY_IMAGE)}
      resizeMode="cover"
    />
  );
};

const MOTIFS_SIGNALEMENT = [
  { id: 'arnaque', label: "Tentative d'arnaque / Avance d'argent exigée (Wave / OM)", icon: 'alert-circle' },
  { id: 'faux_numero', label: "Numéro de téléphone faux ou injoignable", icon: 'call' },
  { id: 'fausses_photos', label: "Photos mensongères ou fausse description", icon: 'images' },
  { id: 'indisponible', label: "Logement déjà loué ou indisponible", icon: 'home' },
  { id: 'prix_faux', label: "Loyer réel différent du prix affiché", icon: 'pricetag' },
  { id: 'comportement', label: "Comportement inapproprié ou harcèlement", icon: 'warning' },
  { id: 'autre', label: "Autre motif suspect", icon: 'help-circle' },
];

export default function PropertyDetailsScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { property } = route.params;

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState('5');
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(true);

  // États pour le signalement détaillé
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedMotif, setSelectedMotif] = useState(MOTIFS_SIGNALEMENT[0].label);
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    checkIfFavorite();
    fetchReviews();
  }, []);

  const checkIfFavorite = async () => {
    if (!auth.currentUser) return;
    try {
      const favRef = doc(db, "users", auth.currentUser.uid, "favorites", property.id);
      const docSnap = await getDoc(favRef);
      if (docSnap.exists()) {
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Erreur vérification favori :", error);
    }
    setLoadingFavorite(false);
  };

  const toggleFavorite = async () => {
    if (!auth.currentUser) return;
    const favRef = doc(db, "users", auth.currentUser.uid, "favorites", property.id);

    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        setIsFavorite(false);
        Alert.alert("Retiré", "Logement retiré de vos favoris.");
      } else {
        await setDoc(favRef, {
          ...property,
          savedAt: serverTimestamp()
        });
        setIsFavorite(true);
        Alert.alert("Favoris ❤️", "Logement ajouté à vos favoris !");
      }
    } catch (error) {
      console.error("Erreur modification favori :", error);
      Alert.alert("Erreur", "Impossible de modifier les favoris.");
    }
  };

  const fetchReviews = async () => {
    try {
      const q = query(collection(db, "properties", property.id, "reviews"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      let list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setReviews(list);
    } catch (error) {
      console.error("Erreur chargement avis :", error);
    }
    setLoadingReviews(false);
  };

  const handleAddReview = async () => {
    if (!newComment.trim()) {
      Alert.alert("Avis vide", "Veuillez écrire un court commentaire.");
      return;
    }

    const ratingNum = parseInt(newRating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      Alert.alert("Note invalide", "Veuillez entrer une note entre 1 et 5.");
      return;
    }

    try {
      await addDoc(collection(db, "properties", property.id, "reviews"), {
        userId: auth.currentUser ? auth.currentUser.uid : "anonyme",
        userEmail: auth.currentUser ? auth.currentUser.email : "Étudiant",
        rating: ratingNum,
        comment: newComment.trim(),
        createdAt: new Date(),
      });

      setNewComment('');
      setNewRating('5');
      Alert.alert("Merci ✨", "Votre avis a été publié avec succès.");
      fetchReviews();
    } catch (error) {
      console.error("Erreur ajout avis :", error);
      Alert.alert("Erreur", "Impossible d'ajouter votre avis pour le moment.");
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + (curr.rating || 5), 0) / reviews.length).toFixed(1)
    : "5.0";

  const handleOpenReportModal = () => {
    if (!auth.currentUser) {
      Alert.alert(
        "Connexion requise",
        "Vous devez être connecté avec votre compte étudiant pour signaler un logement.",
        [
          { text: "Se connecter", onPress: () => navigation.navigate('Login') },
          { text: "Annuler", style: "cancel" }
        ]
      );
      return;
    }
    setReportModalVisible(true);
  };

  const handleSubmitReport = async () => {
    if (!auth.currentUser) return;

    setSubmittingReport(true);
    try {
      const currentUserId = auth.currentUser.uid;
      const proprietaireId = property.proprietaireId || property.userId || property.bailleurId || null;

      // 1. Récupérer les informations complètes du bailleur
      let bailleurInfo = {
        id: proprietaireId || 'Inconnu',
        nom: 'Propriétaire',
        telephone: property.telephone || 'Non renseigné',
        email: 'Non renseigné',
        statutValidation: 'non_verifie',
      };

      if (proprietaireId) {
        try {
          const bSnap = await getDoc(doc(db, "users", proprietaireId));
          if (bSnap.exists()) {
            const bData = bSnap.data();
            bailleurInfo = {
              id: proprietaireId,
              nom: bData.nomComplet || (bData.prenom ? `${bData.prenom} ${bData.nom || ''}`.trim() : bData.displayName) || 'Propriétaire',
              telephone: bData.telephone || property.telephone || 'Non renseigné',
              email: bData.email || 'Non renseigné',
              statutValidation: bData.statutValidation || 'non_verifie',
            };
          }
        } catch (e) {
          console.log("Erreur récupération bailleur :", e);
        }
      }

      // 2. Récupérer les informations de l'étudiant qui signale
      let reporterInfo = {
        uid: currentUserId,
        nom: 'Étudiant',
        telephone: 'Non renseigné',
        email: auth.currentUser.email || 'Non renseigné',
      };

      try {
        const uSnap = await getDoc(doc(db, "users", currentUserId));
        if (uSnap.exists()) {
          const uData = uSnap.data();
          reporterInfo = {
            uid: currentUserId,
            nom: uData.nomComplet || (uData.prenom ? `${uData.prenom} ${uData.nom || ''}`.trim() : uData.displayName) || 'Étudiant',
            telephone: uData.telephone || 'Non renseigné',
            email: uData.email || auth.currentUser.email || 'Non renseigné',
          };
        }
      } catch (e) {
        console.log("Erreur récupération étudiant :", e);
      }

      // 3. Enregistrer le signalement complet dans Firestore
      await addDoc(collection(db, "reports"), {
        // Motif et détails
        motif: selectedMotif,
        description: reportDetails.trim() || 'Aucune précision écrite fournie.',
        
        // Logement concerné
        propertyId: property.id,
        propertyTitle: property.titre || 'Logement',
        propertyPrice: property.prix ? String(property.prix) : 'Non précisé',
        propertyUniversite: property.universiteId || 'Non précisée',
        propertyAdresse: property.adresse || 'Non précisée',
        propertyImage: (property.images && property.images[0]) || property.image || null,

        // Informations profil Bailleur
        bailleurId: bailleurInfo.id,
        bailleurNom: bailleurInfo.nom,
        bailleurTelephone: bailleurInfo.telephone,
        bailleurEmail: bailleurInfo.email,
        bailleurStatut: bailleurInfo.statutValidation,

        // Informations Étudiant signalant
        reportedBy: currentUserId,
        reporterNom: reporterInfo.nom,
        reporterTelephone: reporterInfo.telephone,
        reporterEmail: reporterInfo.email,

        // Statut & dates
        status: "en_attente",
        date: new Date(),
        createdAt: serverTimestamp(),
      });

      setReportModalVisible(false);
      setReportDetails('');
      Alert.alert(
        "Signalement transmis avec succès 🛡️",
        "Merci pour votre vigilance citoyenne. L'équipe d'administration de Logetudiant a reçu les informations complètes sur ce profil bailleur et va intervenir sans délai."
      );
    } catch (error) {
      console.error("Erreur enregistrement signalement :", error);
      Alert.alert("Erreur", "Une erreur technique est survenue lors de l'envoi du signalement.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleContactProprietaire = (telephone, titreBien) => {
    if (!telephone) {
      Alert.alert("Information", "Le numéro de téléphone du bailleur n'est pas disponible.");
      return;
    }

    let cleanPhone = String(telephone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('00221')) {
      cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.length === 9) {
      cleanPhone = `221${cleanPhone}`;
    }

    const message = `Bonjour, je suis intéressé(e) par votre logement "${titreBien || 'étudiant'}" vu sur Logetudiant. Est-il toujours disponible ?`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Linking.openURL(`tel:${cleanPhone}`);
    });
  };

  const handleDemarrerConversation = async () => {
    try {
      if (!auth.currentUser) return;
      const currentUserId = auth.currentUser.uid;
      const proprietaireId = property.proprietaireId || property.userId;

      if (!proprietaireId) {
        Alert.alert("Information", "Impossible d'identifier le propriétaire de ce bien.");
        return;
      }

      if (currentUserId === proprietaireId) {
        Alert.alert("Information", "Vous êtes le propriétaire de cette annonce.");
        return;
      }

      let ownerName = "Propriétaire";
      try {
        const ownerDocSnap = await getDoc(doc(db, "users", proprietaireId));
        if (ownerDocSnap.exists()) {
          const ownerData = ownerDocSnap.data();
          ownerName = ownerData.nomComplet || ownerData.nom || ownerData.prenom || "Propriétaire";
        }
      } catch (err) {
        console.error("Erreur nom proprio :", err);
      }

      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", currentUserId)
      );

      const querySnapshot = await getDocs(q);
      let conversationId = null;

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          data.propertyId === property.id &&
          data.participants &&
          data.participants.includes(proprietaireId)
        ) {
          conversationId = docSnap.id;
        }
      });

      if (!conversationId) {
        const newConvRef = await addDoc(collection(db, "conversations"), {
          participants: [currentUserId, proprietaireId],
          propertyId: property.id,
          propertyTitle: property.titre || "Logement",
          dernierMessage: "Début de la conversation...",
          updatedAt: serverTimestamp(),
        });
        conversationId = newConvRef.id;
      }

      navigation.navigate('Chat', { 
        conversationId: conversationId, 
        recipientId: proprietaireId,
        recipientName: ownerName 
      });

    } catch (error) {
      console.error("Erreur conversation :", error);
      Alert.alert("Erreur", "Impossible d'ouvrir la messagerie.");
    }
  };

  const isVideo = (uri) => {
    if (!uri) return false;
    const lower = uri.toLowerCase();
    return lower.includes('.mp4') || lower.includes('.mov') || lower.includes('video') || lower.includes('m4v') || lower.includes('youtube') || lower.includes('embed');
  };

  const mediaList = property.images || property.medias || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* NAVBAR FIXE TOUT EN HAUT AVEC SAFE AREA (NE CHEVAUCHE PAS LA BARRE DE STATUT) */}
      <View style={styles.fixedTopBar}>
        <TouchableOpacity 
          style={styles.navBackBtn} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color="#003880" />
          <Text style={styles.navBackText}>{t('common.back')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navFavBtn} 
          onPress={toggleFavorite}
          disabled={loadingFavorite}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={22} 
            color={isFavorite ? "#EF4444" : "#003880"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* CARROUSEL IMAGES / VIDÉOS */}
        {mediaList.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageScrollContainer}>
            {mediaList.map((mediaUri, index) => {
              if (isVideo(mediaUri)) {
                return (
                  <View key={index} style={styles.mediaContainer}>
                    <WebView 
                      source={{ uri: mediaUri }} 
                      style={styles.propertyImage} 
                      allowsFullscreenVideo={true}
                      javaScriptEnabled={true}
                    />
                  </View>
                );
              } else {
                return (
                  <View key={index} style={styles.mediaContainer}>
                    <PropertyDetailImage uri={mediaUri} />
                  </View>
                );
              }
            })}
          </ScrollView>
        ) : (
          <View style={styles.singleImageContainer}>
            <PropertyDetailImage uri={property.image} />
          </View>
        )}

        {/* BADGES PRO */}
        <View style={styles.badgeContainer}>
          {property.localisation?.region ? (
            <View style={[styles.badgePill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Ionicons name="map-outline" size={13} color="#003880" style={{ marginRight: 3 }} />
              <Text style={[styles.badgeText, { color: '#003880' }]}>{property.localisation.region}</Text>
            </View>
          ) : null}

          {property.localisation?.ville ? (
            <View style={[styles.badgePill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Ionicons name="location-outline" size={13} color="#003880" style={{ marginRight: 3 }} />
              <Text style={[styles.badgeText, { color: '#003880' }]}>{property.localisation.ville}</Text>
            </View>
          ) : null}

          <View style={[styles.badgePill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Ionicons name="school-outline" size={13} color="#003880" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeText, { color: '#003880' }]}>{property.universiteId || "Campus"}</Text>
          </View>

          <View style={[styles.badgePill, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
            <Ionicons name="home-outline" size={13} color="#475569" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeText, { color: '#475569' }]}>
              {t(`landlordHome.types.${property.type}`) || property.type || "Logement"}
            </Text>
          </View>

          <View style={[styles.badgePill, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <Ionicons name="star" size={13} color="#D97706" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeText, { color: '#B45309' }]}>
              {averageRating} {reviews.length > 0 ? `(${reviews.length})` : ''}
            </Text>
          </View>
        </View>

        {/* TITRE ET PRIX HARMONISÉS */}
        <Text style={styles.propertyTitle}>{property.titre}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.propertyPrice}>
            {Number(property.prix || 0).toLocaleString()} {property.currency || 'FCFA'}
          </Text>
          <Text style={styles.period}> {t('landlordHome.perMonth')}</Text>
        </View>

        {/* BOUTON MESSAGERIE INTERNE (BLEU ROYAL) */}
        <TouchableOpacity 
          style={styles.internalChatButton} 
          onPress={handleDemarrerConversation}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubbles" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.internalChatButtonText}>{t('propertyDetails.internalChat')}</Text>
        </TouchableOpacity>

        {/* CARTE DESCRIPTION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="document-text-outline" size={18} color="#003880" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>{t('propertyDetails.description')}</Text>
          </View>
          <Text style={styles.propertyDescription}>{property.description || "Aucune description fournie."}</Text>
        </View>

        {/* CARTE LOCALISATION & GOOGLE MAPS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="map-outline" size={18} color="#003880" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>{t('propertyDetails.location')}</Text>
          </View>
          <Text style={styles.addressText}>
            📍 {property.localisation?.region ? `${property.localisation.region} • ` : ''}{property.localisation?.ville ? `${property.localisation.ville} • ` : ''}{property.localisation?.adresse || t('landlordHome.addressNotSpecified')}
          </Text>
          
          <TouchableOpacity 
            style={styles.mapContainer}
            onPress={() => {
              const lat = property.localisation?.latitude || 14.69275;
              const lng = property.localisation?.longitude || -17.44667;
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
            }}
            activeOpacity={0.85}
          >
            <View style={styles.mapIconCircle}>
              <Ionicons name="navigate" size={22} color="#003880" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.mapBtnTitle}>{t('propertyDetails.openMaps')}</Text>
              <Text style={styles.mapBtnSubtitle}>{t('propertyDetails.mapsSubtitle')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#003880" />
          </TouchableOpacity>
        </View>

        {/* AVIS DES ÉTUDIANTS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#003880" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>{t('propertyDetails.reviewsTitle', { count: reviews.length })}</Text>
          </View>

          <View style={styles.reviewForm}>
            <Text style={styles.subLabel}>{t('propertyDetails.giveReview')}</Text>
            <View style={styles.reviewInputRow}>
              <TextInput 
                style={styles.ratingInput} 
                placeholder={t('propertyDetails.ratingPlaceholder')} 
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={newRating} 
                onChangeText={setNewRating} 
                maxLength={1}
              />
              <TextInput 
                style={styles.commentInput} 
                placeholder={t('propertyDetails.commentPlaceholder')} 
                placeholderTextColor="#94A3B8"
                value={newComment} 
                onChangeText={setNewComment} 
                maxLength={200}
              />
            </View>
            <TouchableOpacity style={styles.submitReviewBtn} onPress={handleAddReview}>
              <Text style={styles.submitReviewText}>{t('propertyDetails.submitReview')}</Text>
            </TouchableOpacity>
          </View>

          {loadingReviews ? (
            <ActivityIndicator size="small" color="#003880" style={{ marginTop: 15 }} />
          ) : reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>{t('propertyDetails.noReviews')}</Text>
          ) : (
            reviews.map((rev) => (
              <View key={rev.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>
                    <Ionicons name="person-circle-outline" size={14} color="#64748B" /> {rev.userEmail ? rev.userEmail.split('@')[0] : "Étudiant"}
                  </Text>
                  <Text style={styles.reviewRating}>⭐ {rev.rating}/5</Text>
                </View>
                <Text style={styles.reviewComment}>{rev.comment}</Text>
              </View>
            ))
          )}
        </View>

        {/* BOUTON CONTACT WHATSAPP / TÉLÉPHONE */}
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={() => handleContactProprietaire(property.telephoneProprietaire || property.telephone, property.titre)}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.contactButtonText}>{t('propertyDetails.contactOwner')}</Text>
        </TouchableOpacity>

        {/* BOUTON SIGNALEMENT ARNAQUE */}
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={handleOpenReportModal}
          activeOpacity={0.8}
        >
          <Ionicons name="shield-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
          <Text style={styles.reportButtonText}>{t('propertyDetails.reportListing')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODALE DE SIGNALEMENT AVEC MOTIF ET DÉTAILS COMPLETS */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={Keyboard.dismiss}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalBar} />

            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconBox}>
                <Ionicons name="shield-alert" size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.modalTitle}>{t('propertyDetails.reportModalTitle')}</Text>
                <Text style={styles.modalSubtitle}>{t('propertyDetails.reportModalSubtitle')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setReportModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.sectionLabel}>{t('propertyDetails.reportMotifPrompt')}</Text>
              
              {MOTIFS_SIGNALEMENT.map((m) => {
                const isSelected = selectedMotif === m.label;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.motifOption, isSelected && styles.motifOptionSelected]}
                    onPress={() => setSelectedMotif(m.label)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={18}
                      color={isSelected ? "#DC2626" : "#94A3B8"}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.motifText, isSelected && styles.motifTextSelected]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                {t('propertyDetails.reportExtraDetails')}
              </Text>
              <TextInput
                style={styles.reportTextInput}
                placeholder={t('propertyDetails.reportPlaceholder')}
                placeholderTextColor="#94A3B8"
                value={reportDetails}
                onChangeText={setReportDetails}
                multiline
                numberOfLines={3}
                maxLength={400}
              />

              <View style={styles.adminNoticeBox}>
                <Ionicons name="information-circle-outline" size={16} color="#003880" style={{ marginRight: 6 }} />
                <Text style={styles.adminNoticeText}>
                  {t('propertyDetails.adminNotice')}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitReportBtn}
                onPress={handleSubmitReport}
                disabled={submittingReport}
                activeOpacity={0.85}
              >
                {submittingReport ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitReportBtnText}>{t('propertyDetails.submitReport')}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelReportBtn}
                onPress={() => setReportModalVisible(false)}
              >
                <Text style={styles.cancelReportBtnText}>{t('propertyDetails.cancel')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  fixedTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  navBackText: {
    fontSize: 15,
    color: '#003880',
    fontWeight: '700',
    marginLeft: 4,
  },
  navFavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 16,
  },
  imageScrollContainer: {
    marginBottom: 16,
    height: 230,
    borderRadius: 16,
  },
  singleImageContainer: {
    marginBottom: 16,
    height: 230,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mediaContainer: {
    width: width - 32,
    height: 230,
    marginRight: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  propertyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  propertyPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E8A008', // Ocre doré officiel du logo
  },
  period: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  internalChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003880',
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#003880',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  internalChatButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  propertyDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  addressText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
  },
  mapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
  },
  mapIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#003880',
  },
  mapBtnSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  reviewForm: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  reviewInputRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ratingInput: {
    width: 75,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 9,
    borderRadius: 8,
    marginRight: 8,
    textAlign: 'center',
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 9,
    borderRadius: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  submitReviewBtn: {
    backgroundColor: '#003880',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitReviewText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  noReviewsText: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  reviewItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewUser: {
    fontWeight: '700',
    fontSize: 13,
    color: '#1E293B',
  },
  reviewRating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  reviewComment: {
    fontSize: 13,
    color: '#475569',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#128C7E', // Vert WhatsApp authentique plus foncé
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 10,
    shadowColor: '#128C7E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  reportButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },

  // STYLES MODALE DE SIGNALEMENT
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBackdropDismiss: {
    flex: 1,
    width: '100%',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  motifOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 7,
  },
  motifOptionSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  motifText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
    fontWeight: '500',
  },
  motifTextSelected: {
    color: '#991B1B',
    fontWeight: '700',
  },
  reportTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#1E293B',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  adminNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    marginBottom: 14,
  },
  adminNoticeText: {
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 16,
  },
  submitReportBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitReportBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelReportBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelReportBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
