import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function ConversationsScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const currentUserId = auth.currentUser.uid;

    // Écouter les conversations en temps réel où l'utilisateur participe
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUserId)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      let list = [];

      for (const docSnap of querySnapshot.docs) {
        const convData = docSnap.data();
        
        // Identifier l'autre participant
        const otherUserId = convData.participants?.find(id => id !== currentUserId);
        let otherUserName = "Utilisateur";

        if (otherUserId) {
          try {
            const userDocRef = doc(db, "users", otherUserId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              otherUserName = userData.displayName || userData.nom || userData.prenom || userData.email || "Utilisateur";
            }
          } catch (e) {
            // Si les règles de sécurité bloquent la lecture, on utilise un nom par défaut au lieu de bloquer l'app
            otherUserName = "Utilisateur";
          }
        }

        list.push({
          id: docSnap.id,
          recipientId: otherUserId,
          otherUserName,
          dernierMessage: convData.dernierMessage || "Commencez la discussion...",
          updatedAt: convData.updatedAt,
          propertyTitle: convData.propertyTitle || "Logement",
        });
      }

      setConversations(list);
      setLoading(false);
    }, (error) => {
      console.error("Erreur lors de l'écoute des conversations :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Discussions</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3182CE" style={{ marginTop: 40 }} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune conversation pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convCard}
              onPress={() => navigation.navigate('Chat', { 
                conversationId: item.id, 
                recipientId: item.recipientId,
                recipientName: item.otherUserName 
              })}
            >
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{item.otherUserName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convHeaderRow}>
                  <Text style={styles.userName}>{item.otherUserName}</Text>
                  <Text style={styles.propertyRef} numberOfLines={1}>{item.propertyTitle}</Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>{item.dernierMessage}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 20, paddingTop: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A365D', marginBottom: 20 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#718096', fontSize: 14, textAlign: 'center' },
  convCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#BEE3F8',
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#3182CE' },
  convInfo: { flex: 1 },
  convHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  propertyRef: { fontSize: 11, color: '#3182CE', backgroundColor: '#EBF8FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, maxWidth: '45%' },
  lastMessage: { fontSize: 14, color: '#718096' },
});