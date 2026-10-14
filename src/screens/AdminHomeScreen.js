import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { logoutUser } from '../services/authService';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminHomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    usersCount: 0,
    propertiesCount: 0,
    reportsCount: 0
  });

  // Utilisation de useFocusEffect pour recharger les compteurs dès qu'on revient sur l'écran Admin
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const fetchAdminStats = async () => {
        try {
          const usersSnapshot = await getDocs(collection(db, "users"));
          const propertiesSnapshot = await getDocs(collection(db, "properties")); 
          const reportsSnapshot = await getDocs(collection(db, "reports")).catch(() => ({ size: 0 }));

          if (isMounted) {
            setStats({
              usersCount: usersSnapshot.size,
              propertiesCount: propertiesSnapshot.size,
              reportsCount: reportsSnapshot.size || 0
            });
          }
        } catch (error) {
          console.error("Erreur chargement stats admin :", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      fetchAdminStats();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter de l'espace administration ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Se déconnecter", 
          style: "destructive",
          onPress: async () => {
            const res = await logoutUser();
            if (res.success) {
              navigation.replace('Login');
            } else {
              Alert.alert("Erreur", res.error);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#E53E3E" />
        <Text style={styles.loaderText}>Chargement du panneau administrateur...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* En-tête Admin */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Espace Administrateur</Text>
          <Text style={styles.subtitle}>Sécurité & Modération - LogeÉtudiant</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#E53E3E" />
        </TouchableOpacity>
      </View>

      {/* Cartes de Statistiques dynamiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={28} color="#3182CE" />
          <Text style={styles.statNumber}>{stats.usersCount}</Text>
          <Text style={styles.statLabel}>Utilisateurs</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="home" size={28} color="#38A169" />
          <Text style={styles.statNumber}>{stats.propertiesCount}</Text>
          <Text style={styles.statLabel}>Logements</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="warning" size={28} color="#E53E3E" />
          <Text style={styles.statNumber}>{stats.reportsCount}</Text>
          <Text style={styles.statLabel}>Signalements</Text>
        </View>
      </View>

      {/* Actions de Modération & Contrôle anti-arnaque */}
      <Text style={styles.sectionTitle}>Actions de Contrôle</Text>

      <TouchableOpacity 
        style={styles.actionCard} 
        onPress={() => navigation.navigate("AdminProperties")}
      >
        <Ionicons name="shield-checkmark" size={24} color="#3182CE" style={styles.actionIcon} />
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>Modérer les annonces</Text>
          <Text style={styles.actionDescription}>Vérifier les logements publiés pour éviter les fausses annonces.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionCard} 
        onPress={() => navigation.navigate("AdminUsers")}
      >
        <Ionicons name="id-card" size={24} color="#38A169" style={styles.actionIcon} />
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>Gérer les utilisateurs</Text>
          <Text style={styles.actionDescription}>Bloquer un compte suspect ou valider un profil.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
      </TouchableOpacity>

      {/* Bouton d'accès à la vérification des bailleurs */}
      <TouchableOpacity 
        style={styles.actionCard} 
        onPress={() => navigation.navigate("AdminVerifyBailleurs")}
      >
        <Ionicons name="checkmark-done-circle" size={24} color="#D69E2E" style={styles.actionIcon} />
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>Vérifier les bailleurs</Text>
          <Text style={styles.actionDescription}>Valider ou rejeter les profils et pièces justificatives des propriétaires.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.actionCard} 
        onPress={() => navigation.navigate("AdminReports")}
      >
        <Ionicons name="alert-circle" size={24} color="#E53E3E" style={styles.actionIcon} />
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>Suivi des arnaques signalées</Text>
          <Text style={styles.actionDescription}>Traiter les signalements d'annonces frauduleuses.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#A0AEC0" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loaderText: {
    marginTop: 10,
    color: '#718096',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A365D',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 15,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIcon: {
    marginRight: 15,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  actionDescription: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
});