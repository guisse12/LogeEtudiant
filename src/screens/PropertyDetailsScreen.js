import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, Linking, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Video, ResizeMode } from 'expo-av'; // Import pour la lecture des vidéos
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, getDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const { width } = Dimensions.get('window');

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
        Alert.alert("Succès", "Logement ajouté à vos favoris !");
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
      Alert.alert("Erreur", "Veuillez écrire un commentaire.");
      return;
    }

    const ratingNum = Number(newRating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      Alert.alert("Erreur", "Veuillez entrer une note valide entre 1 et 5.");
      return;
    }

    try {
      await addDoc(collection(db, "properties", property.id, "reviews"), {
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email || "Étudiant",
        rating: ratingNum,
        comment: newComment.trim(),
        createdAt: new Date(),
      });

      Alert.alert("Succès", "Votre avis a été publié !");
      setNewComment('');
      setNewRating('5');
      fetchReviews();
    } catch (error) {
      console.error("Erreur ajout avis :", error);
      Alert.alert("Erreur", "Impossible de publier l'avis.");
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : 'N/A';

  const handleContactPropriétaire = (telephone, titreBien) => {
    if (!telephone) {
      alert("Le numéro de téléphone du propriétaire n'est pas disponible pour ce bien.");
      return;
    }

    const message = `Bonjour, je suis intéressé(e) par votre logement "${titreBien}" vu sur LogeÉtudiant. Est-il toujours disponible ?`;
    const url = `whatsapp://send?phone=${telephone}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          return Linking.openURL(`tel:${telephone}`);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error("Erreur lors de l'ouverture du lien de contact :", err));
  };

  const handleDemarrerConversation = async () => {
    try {
      if (!auth.currentUser) return;
      const currentUserId = auth.currentUser.uid;
      const proprietaireId = property.proprietaireId || property.userId;

      if (!proprietaireId) {
        Alert.alert("Erreur", "Impossible d'identifier le propriétaire de ce bien.");
        return;
      }

      if (currentUserId === proprietaireId) {
        Alert.alert("Information", "Vous ne pouvez pas démarrer une conversation avec vous-même.");
        return;
      }

      let ownerName = "Propriétaire";
      try {
        const ownerDocSnap = await getDoc(doc(db, "users", proprietaireId));
        if (ownerDocSnap.exists()) {
          const ownerData = ownerDocSnap.data();
          ownerName = ownerData.displayName || ownerData.nom || ownerData.prenom || "Propriétaire";
        }
      } catch (err) {
        console.error("Impossible de récupérer le nom du propriétaire :", err);
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
      console.error("Erreur lors de l'initialisation de la conversation :", error);
      Alert.alert("Erreur", "Impossible d'ouvrir la discussion pour le moment.");
    }
  };

  // Fonction utilitaire pour détecter si l'URI correspond à une vidéo
  const isVideo = (uri) => {
    if (!uri) return false;
    const lower = uri.toLowerCase();
    return lower.includes('.mp4') || lower.includes('.mov') || lower.includes('video') || lower.includes('m4v');
  };

  // Récupérer la liste des médias (gère 'images' ou 'medias')
  const mediaList = property.images || property.medias || [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={toggleFavorite}
          disabled={loadingFavorite}
        >
          <Text style={styles.favoriteIconText}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Galerie dynamique gérant jusqu'à 30 photos ou vidéos */}
      {mediaList.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalIndicator={false} style={styles.imageScrollContainer}>
          {mediaList.map((mediaUri, index) => {
            if (isVideo(mediaUri)) {
              return (
                <View key={index} style={styles.mediaContainer}>
                  <Video
                    source={{ uri: mediaUri }}
                    style={styles.propertyMedia}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping={false}
                  />
                </View>
              );
            } else {
              return (
                <View key={index} style={styles.mediaContainer}>
                  <Image source={{ uri: mediaUri }} style={styles.propertyImage} />
                </View>
              );
            }
          })}
        </ScrollView>
      ) : (
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80' }} 
          style={styles.propertyImage} 
        />
      )}

      <View style={styles.badgeContainer}>
        <View style={styles.propertyBadge}>
          <Text style={styles.propertyBadgeText}>{property.universiteId}</Text>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{property.type}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingBadgeText}>⭐ {averageRating} {reviews.length > 0 ? `(${reviews.length})` : ''}</Text>
        </View>
      </View>

      <Text style={styles.propertyTitle}>{property.titre}</Text>
      <Text style={styles.propertyPrice}>{property.prix} FCFA <Text style={styles.period}>/ mois</Text></Text>

      <TouchableOpacity style={styles.internalChatButton} onPress={handleDemarrerConversation}>
        <Text style={styles.internalChatButtonText}>💬 Discuter en interne avec le propriétaire</Text>
      </TouchableOpacity>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.propertyDescription}>{property.description || "Aucune description fournie."}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Localisation</Text>
        <Text style={styles.addressText}>📍 {property.localisation?.adresse || "Adresse non spécifiée"}</Text>
        
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map}
            initialRegion={{
              latitude: property.localisation?.latitude || 14.69275,
              longitude: property.localisation?.longitude || -17.44667,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker 
              coordinate={{
                latitude: property.localisation?.latitude || 14.69275,
                longitude: property.localisation?.longitude || -17.44667,
              }}
              title={property.titre}
              description={property.localisation?.adresse}
            />
          </MapView>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Avis des étudiants ({reviews.length})</Text>

        <View style={styles.reviewForm}>
          <Text style={styles.subLabel}>Laisser un avis :</Text>
          <View style={styles.reviewInputRow}>
            <TextInput 
              style={styles.ratingInput} 
              placeholder="Note (1-5)" 
              keyboardType="numeric"
              value={newRating} 
              onChangeText={setNewRating} 
              maxLength={1}
            />
            <TextInput 
              style={styles.commentInput} 
              placeholder="Qu'avez-vous pensé de ce logement ?" 
              value={newComment} 
              onChangeText={setNewComment} 
            />
          </View>
          <TouchableOpacity style={styles.submitReviewBtn} onPress={handleAddReview}>
            <Text style={styles.submitReviewText}>Envoyer l'avis</Text>
          </TouchableOpacity>
        </View>

        {loadingReviews ? (
          <ActivityIndicator size="small" color="#3182CE" style={{ marginTop: 15 }} />
        ) : reviews.length === 0 ? (
          <Text style={styles.noReviewsText}>Aucun avis pour l'instant. Soyez le premier à en laisser un !</Text>
        ) : (
          reviews.map((rev) => (
            <View key={rev.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewUser}>{rev.userEmail ? rev.userEmail.split('@')[0] : "Étudiant"}</Text>
                <Text style={styles.reviewRating}>⭐ {rev.rating}/5</Text>
              </View>
              <Text style={styles.reviewComment}>{rev.comment}</Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity 
        style={styles.contactButton}
        onPress={() => handleContactPropriétaire(property.telephoneProprietaire || property.telephone, property.titre)}
      >
        <Text style={styles.contactButtonText}>📞 Contacter par WhatsApp / Téléphone</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8F9FA', flexGrow: 1, paddingTop: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backButton: { justifyContent: 'center' },
  backButtonText: { fontSize: 16, color: '#3182CE', fontWeight: 'bold' },
  favoriteButton: { backgroundColor: '#FFF', padding: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  favoriteIconText: { fontSize: 18 },
  imageScrollContainer: { marginBottom: 15, height: 220, borderRadius: 12 },
  mediaContainer: { width: width - 40, height: 220, marginRight: 10, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  propertyImage: { width: '100%', height: '100%', borderRadius: 12, resizeMode: 'cover' },
  propertyMedia: { width: '100%', height: '100%' },
  badgeContainer: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  propertyBadge: { backgroundColor: '#EBF8FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginRight: 8 },
  propertyBadgeText: { color: '#3182CE', fontSize: 13, fontWeight: 'bold' },
  typeBadge: { backgroundColor: '#EDF2F7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginRight: 8 },
  typeBadgeText: { color: '#4A5568', fontSize: 13, fontWeight: 'bold' },
  ratingBadge: { backgroundColor: '#FEFCBF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  ratingBadgeText: { color: '#744210', fontSize: 13, fontWeight: 'bold' },
  propertyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A365D', marginBottom: 8 },
  propertyPrice: { fontSize: 18, fontWeight: 'bold', color: '#38A169', marginBottom: 15 },
  period: { fontSize: 13, color: '#718096', fontWeight: 'normal' },
  internalChatButton: { backgroundColor: '#3182CE', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  internalChatButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  sectionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 10 },
  propertyDescription: { fontSize: 14, color: '#4A5568', lineHeight: 20 },
  addressText: { fontSize: 14, color: '#4A5568', marginBottom: 10 },
  mapContainer: { height: 180, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  map: { flex: 1 },
  reviewForm: { marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  subLabel: { fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 6 },
  reviewInputRow: { flexDirection: 'row', marginBottom: 8 },
  ratingInput: { width: 70, backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#CBD5E0', padding: 8, borderRadius: 6, marginRight: 8, textAlign: 'center', fontSize: 14 },
  commentInput: { flex: 1, backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#CBD5E0', padding: 8, borderRadius: 6, fontSize: 14 },
  submitReviewBtn: { backgroundColor: '#3182CE', padding: 8, borderRadius: 6, alignItems: 'center' },
  submitReviewText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  noReviewsText: { color: '#718096', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },
  reviewItem: { backgroundColor: '#F7FAFC', padding: 10, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewUser: { fontWeight: 'bold', fontSize: 13, color: '#2D3748' },
  reviewRating: { fontSize: 12, fontWeight: 'bold', color: '#D69E2E' },
  reviewComment: { fontSize: 13, color: '#4A5568' },
  contactButton: { backgroundColor: '#38A169', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 5, marginBottom: 30 },
  contactButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});