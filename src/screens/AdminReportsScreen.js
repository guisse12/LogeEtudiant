import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Linking,
  TextInput,
  Image,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';

export default function AdminReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReports = async () => {
    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (errOrder) {
        // Fallback sans tri si l'index Firestore n'est pas encore créé
        querySnapshot = await getDocs(collection(db, "reports"));
      }

      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setReports(list);
    } catch (error) {
      console.log("Erreur chargement signalements :", error);
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  // 1. APPEL DIRECT AU BAILLEUR
  const handleCall = (telephone, nom) => {
    if (!telephone || telephone === 'Non renseigné') {
      Alert.alert("Numéro indisponible", `Aucun numéro de téléphone disponible pour ${nom || 'ce profil'}.`);
      return;
    }
    const cleanNumber = telephone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert("Erreur", "Impossible de composer le numéro.");
    });
  };

  // 2. WHATSAPP DIRECT AU BAILLEUR AVEC MESSAGE ADMINISTRATIF
  const handleWhatsApp = (telephone, nom, propertyTitle) => {
    if (!telephone || telephone === 'Non renseigné') {
      Alert.alert("Numéro indisponible", `Aucun numéro de téléphone disponible pour ${nom || 'ce profil'}.`);
      return;
    }
    let cleanNumber = telephone.replace(/[^0-9]/g, '');
    if (cleanNumber.length === 9) {
      cleanNumber = '221' + cleanNumber;
    }
    const msg = encodeURIComponent(
      `Bonjour ${nom || ''},\nNous vous contactons depuis l'administration de Logetudiant suite à un signalement d'étudiant concernant votre logement "${propertyTitle || 'sur la plateforme'}".\nMerci de nous apporter des clarifications dans les plus brefs délais.`
    );
    Linking.openURL(`https://wa.me/${cleanNumber}?text=${msg}`).catch(() => {
      Alert.alert("Erreur", "Impossible d'ouvrir l'application WhatsApp.");
    });
  };

  // 3. SUPPRESSION DU LOGEMENT SIGNALÉ
  const handleDeleteProperty = (propertyId, propertyTitle) => {
    if (!propertyId) {
      Alert.alert("Action impossible", "Identifiant du logement non trouvé dans ce signalement.");
      return;
    }
    Alert.alert(
      "⚠️ Supprimer ce logement ?",
      `Confirmez-vous la suppression immédiate et définitive de "${propertyTitle || 'ce logement'}" de Logetudiant ? Il ne sera plus visible pour les étudiants.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui, supprimer le logement",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "properties", propertyId));
              Alert.alert("Logement retiré ✨", `Le logement "${propertyTitle || ''}" a été supprimé du catalogue avec succès.`);
            } catch (error) {
              console.error("Erreur suppression logement :", error);
              Alert.alert("Erreur", "Impossible de supprimer ce logement.");
            }
          }
        }
      ]
    );
  };

  // 4. SUSPENSION / BLOCAGE DU COMPTE BAILLEUR
  const handleBlockBailleur = (bailleurId, bailleurNom) => {
    if (!bailleurId || bailleurId === 'Inconnu') {
      Alert.alert("Action impossible", "Identifiant du bailleur non disponible pour ce signalement.");
      return;
    }
    Alert.alert(
      "🚫 Bloquer ce compte bailleur ?",
      `Voulez-vous suspendre définitivement le compte de ${bailleurNom || 'ce bailleur'} ? Ses annonces seront désactivées et il ne pourra plus se connecter.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Bloquer le compte",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "users", bailleurId), {
                statutValidation: 'bloque',
                bloque: true,
                dateBlocage: new Date(),
                motifBlocage: 'Signalement étudiant pour suspicion de fraude/arnaque'
              });
              Alert.alert("Compte suspendu 🚫", `Le compte de ${bailleurNom || 'ce bailleur'} est maintenant bloqué.`);
              fetchReports();
            } catch (error) {
              console.error("Erreur blocage bailleur :", error);
              Alert.alert("Erreur", "Impossible de bloquer ce compte.");
            }
          }
        }
      ]
    );
  };

  // 5. CLÔTURER LE DOSSIER DE SIGNALEMENT
  const handleDeleteReport = (id, title) => {
    Alert.alert(
      "Clôturer le signalement",
      `Confirmez-vous que ce dossier concernant "${title || 'ce logement'}" a été vérifié et traité ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Clôturer le dossier", 
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

  const formatDate = (val) => {
    if (!val) return 'Récent';
    try {
      if (val.toDate && typeof val.toDate === 'function') {
        return val.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      if (val.seconds) {
        return new Date(val.seconds * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (e) {
      // Ignorer
    }
    return 'Récent';
  };

  const renderBailleurStatusBadge = (statut) => {
    if (statut === 'valide') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#DEF7EC' }]}>
          <Ionicons name="checkmark-circle" size={12} color="#03543F" />
          <Text style={[styles.statusBadgeText, { color: '#03543F' }]}>Certifié</Text>
        </View>
      );
    }
    if (statut === 'bloque') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#FDE8E8' }]}>
          <Ionicons name="ban" size={12} color="#9B1C1C" />
          <Text style={[styles.statusBadgeText, { color: '#9B1C1C' }]}>Bloqué</Text>
        </View>
      );
    }
    if (statut === 'en_attente') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#FEF08A' }]}>
          <Ionicons name="time" size={12} color="#713F12" />
          <Text style={[styles.statusBadgeText, { color: '#713F12' }]}>En attente</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: '#F1F5F9' }]}>
        <Ionicons name="alert-circle" size={12} color="#64748B" />
        <Text style={[styles.statusBadgeText, { color: '#64748B' }]}>Non vérifié</Text>
      </View>
    );
  };

  const filteredReports = reports.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const bailleur = (item.bailleurNom || '').toLowerCase();
    const bailleurTel = (item.bailleurTelephone || '').toLowerCase();
    const bailleurEmail = (item.bailleurEmail || '').toLowerCase();
    const motif = (item.motif || item.raison || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();
    const propTitle = (item.propertyTitle || '').toLowerCase();
    const reporter = (item.reporterNom || item.userEmail || '').toLowerCase();
    return (
      bailleur.includes(q) ||
      bailleurTel.includes(q) ||
      bailleurEmail.includes(q) ||
      motif.includes(q) ||
      desc.includes(q) ||
      propTitle.includes(q) ||
      reporter.includes(q)
    );
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E53E3E" />
        <Text style={styles.loadingText}>Vérification des signalements de fraude...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* NAVBAR ADMINISTRATIVE */}
      <View style={styles.fixedNavbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#003880" />
          <Text style={styles.backBtnText}>Admin</Text>
        </TouchableOpacity>
        <Text style={styles.navbarTitle}>Signalements & Fraudes</Text>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={onRefresh} activeOpacity={0.8}>
          <Ionicons name="refresh" size={18} color="#003880" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* BANNIÈRE DE CONTRÔLE */}
        <View style={styles.summaryBox}>
          <View style={[styles.summaryIconBox, { backgroundColor: reports.length > 0 ? '#FFF5F5' : '#F0FFF4' }]}>
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
                ? "Examinez les motifs étudiants, inspectez les profils bailleurs et appliquez les sanctions." 
                : "Aucune fraude ou arnaque suspectée n'est actuellement en attente."}
            </Text>
          </View>
        </View>

        {/* BARRE DE RECHERCHE */}
        {reports.length > 0 && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par bailleur, motif, numéro, étudiant..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>
            Dossiers signalés ({filteredReports.length})
          </Text>
          <TouchableOpacity style={styles.headerRefreshBtn} onPress={onRefresh}>
            <Ionicons name="sync-outline" size={14} color="#3182CE" style={{ marginRight: 4 }} />
            <Text style={styles.headerRefreshText}>Actualiser</Text>
          </TouchableOpacity>
        </View>

        {/* LISTE DES SIGNALEMENTS AVEC PROFIL COMPLET DU BAILLEUR ET DU LOGEMENT */}
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 35 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E53E3E']} />
          }
          renderItem={({ item }) => {
            const dateStr = formatDate(item.createdAt || item.date);
            const motifText = item.motif || item.raison || "Suspicion de fraude";
            const isCritical = motifText.toLowerCase().includes('arnaque') || motifText.toLowerCase().includes('argent');

            return (
              <View style={styles.card}>
                {/* EN-TÊTE DU SIGNALEMENT : MOTIF ET DATE */}
                <View style={styles.cardHeader}>
                  <View style={[styles.badgeMotif, { backgroundColor: isCritical ? '#FEE2E2' : '#FEF3C7' }]}>
                    <Ionicons 
                      name={isCritical ? "warning" : "information-circle"} 
                      size={13} 
                      color={isCritical ? "#DC2626" : "#D97706"} 
                      style={{ marginRight: 4 }} 
                    />
                    <Text style={[styles.badgeMotifText, { color: isCritical ? "#DC2626" : "#D97706" }]}>
                      {motifText}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{dateStr}</Text>
                </View>

                {/* EXPLICATION DÉTAILLÉE DE L'ÉTUDIANT */}
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonLabel}>
                    <Ionicons name="chatbubble-ellipses-outline" size={12} color="#991B1B" /> Motif & Détails de l'étudiant :
                  </Text>
                  <Text style={styles.reasonText}>
                    "{item.description || item.raison || "Aucun commentaire écrit additionnel."}"
                  </Text>
                </View>

                {/* ÉTUDIANT QUI A SIGNALÉ */}
                <View style={styles.reporterBox}>
                  <Ionicons name="person-circle-outline" size={16} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.reporterText}>
                    Signalé par : <Text style={styles.boldText}>{item.reporterNom || item.userEmail || "Étudiant"}</Text>
                  </Text>
                  {item.reporterTelephone && item.reporterTelephone !== 'Non renseigné' && (
                    <TouchableOpacity 
                      style={styles.callMiniBtn} 
                      onPress={() => handleCall(item.reporterTelephone, item.reporterNom)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="call" size={11} color="#003880" />
                      <Text style={styles.callMiniText}>Contacter</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* CARTE PROFIL COMPLET DU BAILLEUR MIS EN CAUSE */}
                <View style={styles.bailleurCard}>
                  <View style={styles.bailleurHeaderRow}>
                    <View style={styles.bailleurIdentity}>
                      <View style={styles.bailleurAvatar}>
                        <Ionicons name="person" size={18} color="#003880" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bailleurSectionTitle}>Profil du Bailleur Signalé</Text>
                        <Text style={styles.bailleurName}>{item.bailleurNom || "Bailleur non identifié"}</Text>
                      </View>
                    </View>
                    {renderBailleurStatusBadge(item.bailleurStatut)}
                  </View>

                  <View style={styles.bailleurDetailsGrid}>
                    <View style={styles.detailItem}>
                      <Ionicons name="call-outline" size={14} color="#64748B" />
                      <Text style={styles.detailText}>{item.bailleurTelephone || "Téléphone non renseigné"}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="mail-outline" size={14} color="#64748B" />
                      <Text style={styles.detailText} numberOfLines={1}>{item.bailleurEmail || "Email non renseigné"}</Text>
                    </View>
                  </View>

                  {/* BOUTONS D'INTERACTION DIRECTE AVEC LE BAILLEUR */}
                  <View style={styles.quickContactRow}>
                    <TouchableOpacity 
                      style={styles.callBailleurBtn}
                      onPress={() => handleCall(item.bailleurTelephone, item.bailleurNom)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={14} color="#003880" style={{ marginRight: 6 }} />
                      <Text style={styles.callBailleurText}>Appeler le bailleur</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.waBailleurBtn}
                      onPress={() => handleWhatsApp(item.bailleurTelephone, item.bailleurNom, item.propertyTitle)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-whatsapp" size={15} color="#15803D" style={{ marginRight: 6 }} />
                      <Text style={styles.waBailleurText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* LOGEMENT ASSOCIÉ */}
                <View style={styles.propertyCard}>
                  {item.propertyImage ? (
                    <Image source={{ uri: item.propertyImage }} style={styles.propertyThumb} />
                  ) : (
                    <View style={styles.propertyThumbPlaceholder}>
                      <Ionicons name="home" size={20} color="#94A3B8" />
                    </View>
                  )}
                  <View style={styles.propertyInfoCol}>
                    <Text style={styles.propertyTitle} numberOfLines={1}>
                      {item.propertyTitle || "Logement sans titre"}
                    </Text>
                    <Text style={styles.propertyPrice}>
                      {item.propertyPrice ? `${item.propertyPrice} FCFA/mois` : "Prix non précisé"}
                    </Text>
                    <Text style={styles.propertyLocation} numberOfLines={1}>
                      <Ionicons name="location-outline" size={12} color="#64748B" /> {item.propertyUniversite || item.propertyAdresse || "Sénégal"}
                    </Text>
                  </View>
                </View>

                {/* BARRE D'ACTIONS ADMINISTRATIVES */}
                <View style={styles.adminActionsSection}>
                  <Text style={styles.actionsSectionTitle}>Actions Administratives :</Text>
                  
                  <View style={styles.actionButtonsRow}>
                    {/* Bouton Supprimer Logement */}
                    <TouchableOpacity 
                      style={styles.deletePropBtn} 
                      onPress={() => handleDeleteProperty(item.propertyId, item.propertyTitle)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={14} color="#DC2626" />
                      <Text style={styles.deletePropBtnText}>Supprimer logement</Text>
                    </TouchableOpacity>

                    {/* Bouton Bloquer Bailleur */}
                    <TouchableOpacity 
                      style={styles.blockUserBtn} 
                      onPress={() => handleBlockBailleur(item.bailleurId, item.bailleurNom)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="ban-outline" size={14} color="#991B1B" />
                      <Text style={styles.blockUserBtnText}>Bloquer compte</Text>
                    </TouchableOpacity>

                    {/* Bouton Clôturer Alerte */}
                    <TouchableOpacity 
                      style={styles.resolveBtn} 
                      onPress={() => handleDeleteReport(item.id, item.propertyTitle)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark-done" size={15} color="#FFFFFF" />
                      <Text style={styles.resolveBtnText}>Clôturer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="shield-checkmark" size={48} color="#38A169" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? "Aucun signalement correspondant" : "Plateforme 100% Sereine !"}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? "Modifiez votre recherche ou réinitialisez les filtres." 
                  : "Aucun signalement d'arnaque en cours. Vos étudiants profitent d'un environnement sûr."}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, padding: 14, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '500' },

  // NAVBAR ADMINISTRATIVE
  fixedNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003880',
    marginLeft: 4,
  },
  navbarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  refreshIconBtn: {
    padding: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },

  // SUMMARY BOX
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTextCol: { flex: 1 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  summaryDesc: { fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 16 },

  // RECHERCHE
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  headerRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  headerRefreshText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  // CARD DE SIGNALEMENT
  card: { 
    backgroundColor: '#FFFFFF', 
    padding: 14, 
    borderRadius: 16, 
    marginBottom: 14, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeMotif: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '75%',
  },
  badgeMotifText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },

  // MOTIF ET DESCRIPTION ÉTUDIANT
  reasonBox: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3.5,
    borderLeftColor: '#DC2626',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // RAPPORTEUR (ÉTUDIANT)
  reporterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  reporterText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  callMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  callMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#003880',
    marginLeft: 3,
  },

  // CARTE PROFIL DU BAILLEUR SIGNALÉ
  bailleurCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  bailleurHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bailleurIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  bailleurAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bailleurSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bailleurName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  bailleurDetailsGrid: {
    gap: 4,
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  quickContactRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callBailleurBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  callBailleurText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003880',
  },
  waBailleurBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  waBailleurText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },

  // CARTE LOGEMENT
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  propertyThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#F1F5F9',
  },
  propertyThumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  propertyInfoCol: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  propertyPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003880',
    marginTop: 2,
  },
  propertyLocation: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // ACTIONS ADMINISTRATIVES
  adminActionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  actionsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deletePropBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 7,
    borderRadius: 8,
  },
  deletePropBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 3,
  },
  blockUserBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    paddingVertical: 7,
    borderRadius: 8,
  },
  blockUserBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    marginLeft: 3,
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  resolveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 3,
  },

  // EMPTY
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 35,
    marginTop: 20,
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
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
