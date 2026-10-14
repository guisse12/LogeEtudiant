import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(list);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = (id, email) => {
    Alert.alert(
      "Supprimer l'utilisateur",
      `Êtes-vous sûr de vouloir supprimer le compte de ${email} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", id));
              Alert.alert("Succès", "Compte utilisateur supprimé.");
              fetchUsers();
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
        <ActivityIndicator size="large" color="#3182CE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Utilisateurs Inscrits ({users.length})</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.prenom} {item.nom || item.nomComplet || 'Sans nom'}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.roleTag}>Rôle : <Text style={{fontWeight: 'bold'}}>{item.role || 'etudiant'}</Text></Text>
            </View>
            {item.role !== 'admin' && (
              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={() => handleDeleteUser(item.id, item.email)}
              >
                <Ionicons name="person-remove-outline" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
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
  name: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  email: { color: '#4A5568', fontSize: 13, marginTop: 2 },
  roleTag: { color: '#718096', fontSize: 12, marginTop: 4 },
  deleteBtn: { backgroundColor: '#E53E3E', padding: 8, borderRadius: 8 }
});