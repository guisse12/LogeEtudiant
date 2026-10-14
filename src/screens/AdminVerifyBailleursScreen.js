import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export default function AdminVerifyBailleursScreen() {
  const [bailleurs, setBailleurs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBailleursEnAttente = async () => {
    setLoading(true);
    try {
      // Récupérer uniquement les utilisateurs ayant le rôle "bailleur"
      const q = query(collection(db, "users"), where("role", "==", "bailleur"));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setBailleurs(list);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les bailleurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBailleursEnAttente();
  }, []);

  const handleUpdateStatus = async (userId, nouveauStatut) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        statutValidation: nouveauStatut // "valide" ou "rejete"
      });
      Alert.alert("Succès", `Le statut du bailleur a été mis à jour : ${nouveauStatut}`);
      fetchBailleursEnAttente();
    } catch (error) {
      Alert.alert("Erreur", "Impossible de modifier le statut.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3182CE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Validation des Comptes Bailleurs ({bailleurs.length})</Text>
      <FlatList
        data={bailleurs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.prenom} {item.nom || 'Bailleur'}</Text>
              <Text style={styles.email}>📧 {item.email}</Text>
              <Text style={styles.phone}>📞 {item.telephone || 'Non renseigné'}</Text>
              <Text style={styles.status}>
                Statut actuel : <Text style={{ fontWeight: 'bold', color: item.statutValidation === 'valide' ? '#38A169' : '#D69E2E' }}>
                  {item.statutValidation || 'en_attente'}
                </Text>
              </Text>
            </View>

            <View style={styles.actions}>
              {item.piecesJustificatives ? (
                <TouchableOpacity 
                  style={styles.docBtn} 
                  onPress={() => Linking.openURL(item.piecesJustificatives)}
                >
                  <Ionicons name="document-text-outline" size={18} color="#fff" />
                  <Text style={styles.btnText}>Justificatif</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.noDoc}>Aucun document</Text>
              )}

              <TouchableOpacity 
                style={styles.validBtn} 
                onPress={() => handleUpdateStatus(item.id, 'valide')}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.btnText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun bailleur inscrit pour le moment.</Text>
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
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  info: { marginBottom: 10 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  email: { color: '#4A5568', fontSize: 13, marginTop: 2 },
  phone: { color: '#4A5568', fontSize: 13, marginTop: 2 },
  status: { color: '#718096', fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EDF2F7', paddingTop: 10 },
  docBtn: { flexDirection: 'row', backgroundColor: '#3182CE', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
  validBtn: { flexDirection: 'row', backgroundColor: '#38A169', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  noDoc: { fontSize: 12, color: '#E53E3E', fontStyle: 'italic' },
  emptyText: { textAlign: 'center', color: '#718096', marginTop: 40 }
});