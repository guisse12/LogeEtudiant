import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, ActivityIndicator, Linking, Alert } from 'react-native';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function FavorisScreen({ navigation }) {
  const [favoris, setFavoris] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavoris = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) return;
      const favSnapshot = await getDocs(collection(db, "users", auth.currentUser.uid, "favorites"));
      let list = [];
      favSnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setFavoris(list);
    } catch (error) {
      console.error("Erreur chargement favoris :", error);
      Alert.alert("Erreur", "Impossible de charger vos favoris.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFavoris();
    });
    return unsubscribe;
  }, [navigation]);

  const removeFavorite = async (propertyId) => {
    try {
      if (!auth.currentUser) return;
      const favRef = doc(db, "users", auth.currentUser.uid, "favorites", propertyId);
      await deleteDoc(favRef);
      setFavoris(favoris.filter((item) => item.id !== propertyId));
      Alert.alert("Retiré", "Le logement a été retiré de vos favoris.");
    } catch (error) {
      console.error("Erreur suppression favori :", error);
    }
  };

  const handleContact = (telephone, titre) => {
    if (!telephone) {
      Alert.alert("Information", "Numéro de téléphone non disponible.");
      return;
    }
    const message = `Bonjour, je suis intéressé(e) par votre logement "${titre}" vu dans mes favoris sur LogeÉtudiant.`;
    const url = `whatsapp://send?phone=${telephone}&text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url).then((supported) => {
      if (!supported) {
        Linking.openURL(`tel:${telephone}`);
      } else {
        Linking.openURL(url);
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3182CE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Logements Favoris ({favoris.length})</Text>
      {favoris.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Vous n'avez enregistré aucun favori pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={favoris}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('PropertyDetails', { property: item })}
            >
              {item.images && item.images.length > 0 && (
                <Image source={{ uri: item.images[0] }} style={styles.image} />
              )}
              <TouchableOpacity 
                style={styles.removeBtn} 
                onPress={() => removeFavorite(item.id)}
              >
                <Text style={{ fontSize: 16 }}>❌</Text>
              </TouchableOpacity>
              <View style={styles.infoContainer}>
                <Text style={styles.cardTitle}>{item.titre}</Text>
                <Text style={styles.cardPrice}>{item.prix} FCFA / mois</Text>
                <Text style={styles.cardAddress} numberOfLines={1}>📍 {item.localisation?.adresse || "Adresse non spécifiée"}</Text>
                
                <TouchableOpacity 
                  style={styles.contactBtn}
                  onPress={() => handleContact(item.telephoneProprietaire || item.telephone, item.titre)}
                >
                  <Text style={styles.contactBtnText}>Contacter le propriétaire</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 16 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1A365D', marginBottom: 16, marginTop: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#718096', textAlign: 'center', fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  image: { width: '100%', height: 140 },
  removeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', padding: 6, borderRadius: 20, elevation: 2 },
  infoContainer: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
  cardPrice: { fontSize: 15, fontWeight: 'bold', color: '#38A169', marginBottom: 4 },
  cardAddress: { fontSize: 13, color: '#718096', marginBottom: 10 },
  contactBtn: { backgroundColor: '#3182CE', padding: 8, borderRadius: 6, alignItems: 'center' },
  contactBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});