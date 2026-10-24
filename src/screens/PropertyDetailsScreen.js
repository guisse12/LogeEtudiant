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
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, getDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

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

export default function PropertyDetailsScreen({ route, navigation }) {
  const { property } = route.params;

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState('5');
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(true);

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

  const handleReportProperty = () => {
    Alert.alert(
      "Signaler ce logement",
      "Pensez-vous qu'il s'agit d'une annonce frauduleuse ou incorrecte ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Oui, signaler", 
          style: "destructive",
          onPress: async () => {
            try {
              await addDoc(collection(db, "reports"), {
                propertyId: property.id,
                propertyTitle: property.titre,
                reportedBy: auth.currentUser ? auth.currentUser.uid : "anonyme",
                userEmail: auth.currentUser ? auth.currentUser.email : "Inconnu",
                date: new Date(),
                status: "en_attente",
              });
              Alert.alert("Signalement reçu", "Merci pour votre vigilance. Notre équipe va examiner ce logement.");
            } catch (error) {
              console.error("Erreur signalement :", error);
              Alert.alert("Erreur", "Impossible d'envoyer le signalement.");
            }
          }
        }
      ]
    );
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

    const message = `Bonjour, je suis intéressé(e) par votre logement "${titreBien || 'étudiant'}" vu sur LogeÉtudiant. Est-il toujours disponible ?`;
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
          <Ionicons name="arrow-back" size={22} color="#1E40AF" />
          <Text style={styles.navBackText}>Retour</Text>
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
            color={isFavorite ? "#EF4444" : "#1E40AF"} 
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
          {property.localisation?.ville ? (
            <View style={[styles.badgePill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Ionicons name="location-outline" size={13} color="#1E40AF" style={{ marginRight: 3 }} />
              <Text style={[styles.badgeText, { color: '#1E40AF' }]}>{property.localisation.ville}</Text>
            </View>
          ) : null}

          <View style={[styles.badgePill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Ionicons name="school-outline" size={13} color="#1E40AF" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeText, { color: '#1E40AF' }]}>{property.universiteId || "Campus"}</Text>
          </View>

          <View style={[styles.badgePill, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
            <Ionicons name="home-outline" size={13} color="#475569" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeText, { color: '#475569' }]}>{property.type || "Logement"}</Text>
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
            {Number(property.prix || 0).toLocaleString()} FCFA
          </Text>
          <Text style={styles.period}> / mois</Text>
        </View>

        {/* BOUTON MESSAGERIE INTERNE (BLEU ROYAL) */}
        <TouchableOpacity 
          style={styles.internalChatButton} 
          onPress={handleDemarrerConversation}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubbles" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.internalChatButtonText}>Discuter en direct avec le propriétaire</Text>
        </TouchableOpacity>

        {/* CARTE DESCRIPTION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="document-text-outline" size={18} color="#1E40AF" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <Text style={styles.propertyDescription}>{property.description || "Aucune description fournie."}</Text>
        </View>

        {/* CARTE LOCALISATION & GOOGLE MAPS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="map-outline" size={18} color="#1E40AF" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Localisation</Text>
          </View>
          <Text style={styles.addressText}>
            📍 {property.localisation?.ville ? `${property.localisation.ville} • ` : ''}{property.localisation?.adresse || "Adresse non spécifiée"}
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
              <Ionicons name="navigate" size={22} color="#1E40AF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.mapBtnTitle}>Ouvrir l'itinéraire sur Google Maps</Text>
              <Text style={styles.mapBtnSubtitle}>Voir la distance exacte avec votre université</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#1E40AF" />
          </TouchableOpacity>
        </View>

        {/* AVIS DES ÉTUDIANTS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#1E40AF" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Avis des étudiants ({reviews.length})</Text>
          </View>

          <View style={styles.reviewForm}>
            <Text style={styles.subLabel}>Donner votre avis :</Text>
            <View style={styles.reviewInputRow}>
              <TextInput 
                style={styles.ratingInput} 
                placeholder="Note (1-5)" 
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={newRating} 
                onChangeText={setNewRating} 
                maxLength={1}
              />
              <TextInput 
                style={styles.commentInput} 
                placeholder="Logement propre et quartier calme..." 
                placeholderTextColor="#94A3B8"
                value={newComment} 
                onChangeText={setNewComment} 
                maxLength={200}
              />
            </View>
            <TouchableOpacity style={styles.submitReviewBtn} onPress={handleAddReview}>
              <Text style={styles.submitReviewText}>Publier mon avis</Text>
            </TouchableOpacity>
          </View>

          {loadingReviews ? (
            <ActivityIndicator size="small" color="#1E40AF" style={{ marginTop: 15 }} />
          ) : reviews.length === 0 ? (
            <Text style={styles.noReviewsText}>Aucun avis pour l'instant. Soyez le premier étudiant à donner votre avis !</Text>
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
          <Text style={styles.contactButtonText}>Contacter par WhatsApp / Téléphone</Text>
        </TouchableOpacity>

        {/* BOUTON SIGNALEMENT ARNAQUE */}
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={handleReportProperty}
          activeOpacity={0.8}
        >
          <Ionicons name="shield-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
          <Text style={styles.reportButtonText}>Signaler cette annonce (Suspicion d'arnaque)</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    color: '#1E40AF',
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
    color: '#1E40AF',
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
    backgroundColor: '#1E40AF',
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#1E40AF',
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
    color: '#1E40AF',
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
    backgroundColor: '#1E40AF',
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
});
