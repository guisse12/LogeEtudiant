import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function AdminReportsScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Supposons que vous stockiez les signalements dans une collection "reports" ou "signalements"
      const querySnapshot = await getDocs(collection(db, "reports"));
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setReports(list);
    } catch (error) {
      // Si la collection n'existe pas encore, on initialise une liste vide sans bloquer l'app
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDeleteReport = (id) => {
    Alert.alert(
      "Clôturer le signalement",
      "Voulez-vous supprimer ce signalement de la liste des tâches ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Clôturer", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "reports", id));
              Alert.alert("Succès", "Signalement traité et supprimé.");
              fetchReports();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer le signalement.");
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
      <Text style={styles.headerTitle}>Arnaques et signalements ({reports.length})</Text>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.title}>Annonce visée : {item.propertyTitle || "Inconnue"}</Text>
              <Text style={styles.reason}>Motif : {item.raison || item.description || "Fraude suspectée"}</Text>
              <Text style={styles.date}>Signalé par : {item.userEmail || "Étudiant"}</Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={() => handleDeleteReport(item.id)}
            >
              <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun signalement d'arnaque pour le moment. Tout est calme !</Text>
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
  title: { fontSize: 15, fontWeight: 'bold', color: '#2D3748' },
  reason: { color: '#E53E3E', fontSize: 13, marginTop: 3 },
  date: { color: '#718096', fontSize: 12, marginTop: 4 },
  deleteBtn: { backgroundColor: '#38A169', padding: 10, borderRadius: 8 },
  emptyText: { textAlign: 'center', color: '#718096', marginTop: 40, fontSize: 14 }
});