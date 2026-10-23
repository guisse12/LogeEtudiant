import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function AdminReportsScreen() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "reports"));
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setReports(list);
    } catch (error) {
      console.log("Collection reports vide ou non initialisée :", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDeleteReport = (id, title) => {
    Alert.alert(
      "Clôturer le signalement",
      `Confirmez-vous que ce signalement pour "${title || 'ce logement'}" a été vérifié et traité ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Clôturer le signalement", 
          style: "default",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "reports", id));
              Alert.alert("Succès ✨", "Le signalement a été clôturé avec succès.");
              fetchReports();
            } catch (error) {
              console.error("Erreur clôture signalement :", error);
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
        <Text style={styles.loadingText}>Vérification des signalements de fraude...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* BANNIÈRE DE CONTRÔLE */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryIconBox}>
          <Ionicons 
            name={reports.length > 0 ? "alert-circle" : "shield-checkmark"} 
            size={24} 
            color={reports.length > 0 ? "#E53E3E" : "#38A169"} 
          />
        </View>
        <View style={styles.summaryTextCol}>
          <Text style={styles.summaryTitle}>
            {reports.length > 0 ? `${reports.length} Signalement(s) Actif(s)` : "Plateforme 100% Sécurisée"}
          </Text>
          <Text style={styles.summaryDesc}>
            {reports.length > 0 
              ? "Examinez les alertes pour protéger la communauté étudiante des fraudes." 
              : "Aucune fraude ou arnaque suspectée n'est actuellement en attente."}
          </Text>
        </View>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Historique des Signalements ({reports.length})</Text>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={fetchReports}>
          <Ionicons name="refresh" size={16} color="#3182CE" />
        </TouchableOpacity>
      </View>

      {/* LISTE DES SIGNALEMENTS */}
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 25 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badgeDanger}>
                <Ionicons name="warning" size={12} color="#9B2C2C" style={{ marginRight: 4 }} />
                <Text style={styles.badgeDangerText}>Fraude suspectée</Text>
              </View>
              <Text style={styles.dateText}>
                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('fr-FR') : "Récent"}
              </Text>
            </View>

            <Text style={styles.title}>
              🏠 Logement ciblé : <Text style={styles.titleBold}>{item.propertyTitle || "Annonce sans titre"}</Text>
            </Text>

            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Motif de l'étudiant :</Text>
              <Text style={styles.reasonText}>
                "{item.raison || item.description || "Comportement suspect ou fausse annonce"}"
              </Text>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.authorText}>
                Signalé par : <Text style={{ fontWeight: 'bold' }}>{item.userEmail || "Étudiant"}</Text>
              </Text>

              <TouchableOpacity 
                style={styles.resolveBtn} 
                onPress={() => handleDeleteReport(item.id, item.propertyTitle)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                <Text style={styles.resolveBtnText}>Clôturer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="shield-checkmark" size={48} color="#38A169" />
            </View>
            <Text style={styles.emptyTitle}>Tout est calme !</Text>
            <Text style={styles.emptyText}>
              Aucun signalement d'arnaque en cours. Vos étudiants profitent d'un environnement sûr.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#F7FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#718096', fontWeight: '500' },

  // SUMMARY BOX
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    alignItems: 'center',
    elevation: 1,
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTextCol: { flex: 1 },
  summaryTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A365D' },
  summaryDesc: { fontSize: 12, color: '#718096', marginTop: 2, lineHeight: 16 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A365D' },
  refreshIconBtn: {
    padding: 6,
    backgroundColor: '#EBF8FF',
    borderRadius: 6,
  },

  // CARD
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 14, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FED7D7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeDangerText: {
    color: '#9B2C2C',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#A0AEC0',
    fontSize: 12,
  },
  title: { fontSize: 14, color: '#4A5568', marginBottom: 8 },
  titleBold: { fontWeight: 'bold', color: '#1A365D' },
  reasonBox: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 3,
    borderLeftColor: '#E53E3E',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#9B2C2C',
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 13,
    color: '#2D3748',
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
    paddingTop: 10,
  },
  authorText: {
    fontSize: 12,
    color: '#718096',
    flex: 1,
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38A169',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },

  // EMPTY
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FFF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A365D',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 18,
  },
});
