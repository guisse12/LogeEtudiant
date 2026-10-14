import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function AdminPropertiesScreen() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

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
      `Voulez-vous vraiment supprimer l'annonce "${titre || 'Sans titre'}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "properties", id));
              Alert.alert("Succès", "Annonce supprimée avec succès.");
              fetchProperties(); // Rafraîchir la liste
            } catch (error) {
              Alert.alert("Erreur", "Erreur lors de la suppression.");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E53E3E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Annonces publiées ({properties.length})</Text>
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.title}>{item.titre || item.titreAnnonce || "Logement sans titre"}</Text>
              <Text style={styles.price}>{item.prix ? `${item.prix} FCFA/mois` : "Prix non renseigné"}</Text>
              <Text style={styles.location}>{item.adresse || item.quartier || "Adresse non spécifiée"}</Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={() => handleDeleteProperty(item.id, item.titre || item.titreAnnonce)}
            >
              <Ionicons name="trash-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucune annonce disponible dans la base de données.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1A365D' },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  price: { color: '#38A169', fontWeight: '600', marginTop: 2 },
  location: { color: '#718096', fontSize: 12, marginTop: 2 },
  deleteBtn: { backgroundColor: '#E53E3E', padding: 10, borderRadius: 8 },
  emptyText: { textAlign: 'center', color: '#718096', marginTop: 30 }
});