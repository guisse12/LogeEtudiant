import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  SUBSCRIPTION_PLANS, 
  getSubscriptionStatus, 
  activateSubscription 
} from '../services/subscriptionService';

export default function SubscriptionScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState('plan_3_months'); // Par défaut : 3 mois (Populaire)
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const status = getSubscriptionStatus(snap.data());
        setSubscription(status);
      }
    } catch (e) {
      console.warn("Erreur chargement abonnement :", e);
    } finally {
      setLoading(false);
    }
  };

  const currentPlanObj = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan) || SUBSCRIPTION_PLANS[0];

  const handlePay = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Connexion requise", "Veuillez vous connecter pour vous abonner.");
      return;
    }

    Alert.alert(
      `Confirmer l'abonnement`,
      `Formule : ${currentPlanObj.name}\nMontant : ${currentPlanObj.priceFormatted}\n\nSouhaitez-vous procéder au paiement sécurisé via Wave / Orange Money ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Payer avec Wave / OM",
          onPress: async () => {
            setProcessingPayment(true);
            try {
              // Activation automatique du plan sélectionné
              await activateSubscription(user.uid, selectedPlan);
              Alert.alert(
                "🎉 Félicitations !",
                `Votre ${currentPlanObj.name} a été activé avec succès !\nVous pouvez désormais publier vos logements en illimité.`,
                [
                  { text: "Super !", onPress: () => navigation.goBack() }
                ]
              );
              fetchStatus();
            } catch (err) {
              console.error("Erreur souscription :", err);
              Alert.alert("Erreur", "Impossible de valider l'abonnement. Veuillez réessayer.");
            } finally {
              setProcessingPayment(false);
            }
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    Linking.openURL('https://wa.me/221763318157?text=Bonjour,%20je%20souhaite%20activer%20mon%20abonnement%20Bailleur%20Logetudiant.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002855" />

      {/* HEADER AVEC COULEUR ROYALE ET COURONNE */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerSubtitle}>ESPACE PRIVILÈGE</Text>
          <Text style={styles.headerTitle}>Abonnement Bailleur Pro</Text>
        </View>
        <View style={styles.headerCrownIcon}>
          <Ionicons name="sparkles" size={22} color="#FBBF24" />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BANDEAU STATUT ACTUEL */}
        {loading ? (
          <ActivityIndicator color="#003880" style={{ marginVertical: 15 }} />
        ) : subscription ? (
          <View style={[
            styles.statusBanner,
            subscription.status === 'active' && styles.statusBannerActive,
            subscription.status === 'trial' && styles.statusBannerTrial,
            subscription.status === 'expired' && styles.statusBannerExpired,
          ]}>
            <View style={styles.statusIconWrap}>
              <Ionicons 
                name={
                  subscription.status === 'active' ? "checkmark-circle" :
                  subscription.status === 'trial' ? "gift-outline" : "alert-circle"
                } 
                size={24} 
                color={
                  subscription.status === 'active' ? "#059669" :
                  subscription.status === 'trial' ? "#D97706" : "#DC2626"
                } 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>
                {subscription.status === 'active' && "Abonnement Pro Actif"}
                {subscription.status === 'trial' && "🎉 30 Jours d'Essai Gratuit"}
                {subscription.status === 'expired' && "Abonnement Expiré"}
              </Text>
              <Text style={styles.statusDesc}>
                {subscription.status === 'active' && `Publications illimitées actives (${subscription.daysLeft} jours restants).`}
                {subscription.status === 'trial' && `Il vous reste ${subscription.daysLeft} jours offerts pour publier en illimité.`}
                {subscription.status === 'expired' && "Choisissez une formule ci-dessous pour continuer à publier."}
              </Text>
            </View>
          </View>
        ) : null}

        {/* TITRE DE SECTION FORMULES */}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Choisissez votre formule</Text>
          <Text style={styles.sectionSubtitle}>
            1er mois 100% offert, puis renouvelez selon vos besoins
          </Text>
        </View>

        {/* CARTES DES 3 PACKS */}
        <View style={styles.plansContainer}>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                  plan.popular && !isSelected && styles.planCardPopularBorder,
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.88}
              >
                {/* BADGE POPULAIRE OU MEILLEUR PRIX */}
                {plan.badge ? (
                  <View style={[
                    styles.planBadge,
                    plan.bestValue ? styles.planBadgeBestValue : styles.planBadgePopular
                  ]}>
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                ) : null}

                <View style={styles.planCardHeader}>
                  <View style={styles.radioCircle}>
                    {isSelected ? <View style={styles.radioInnerCircle} /> : null}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDesc}>{plan.description}</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.planPrice}>{plan.priceFormatted}</Text>
                    <Text style={styles.planPeriod}>{plan.perMonthText}</Text>
                  </View>
                </View>

                {/* ÉCONOMIE DU PACK */}
                {plan.savings ? (
                  <View style={styles.savingsPill}>
                    <Ionicons name="pricetag" size={12} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={styles.savingsText}>{plan.savings}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AVANTAGES INCLUS */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Ce qui est inclus dans votre abonnement :</Text>
          
          <View style={styles.benefitRow}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.benefitText}>
              <Text style={{ fontWeight: 'bold' }}>Publications illimitées</Text> de studios, chambres et appartements
            </Text>
          </View>

          <View style={styles.benefitRow}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.benefitText}>
              <Text style={{ fontWeight: 'bold' }}>Contacts directs étudiants</Text> par appels téléphoniques & WhatsApp
            </Text>
          </View>

          <View style={styles.benefitRow}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.benefitText}>
              <Text style={{ fontWeight: 'bold' }}>Badge Bailleur Vérifié</Text> pour rassurer les étudiants et parents
            </Text>
          </View>

          <View style={styles.benefitRow}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.benefitText}>
              <Text style={{ fontWeight: 'bold' }}>Visibilité prioritaire</Text> en tête des résultats de recherche
            </Text>
          </View>
        </View>

        {/* MOYENS DE PAIEMENT SÉNÉGAL */}
        <View style={styles.paymentMethodsRow}>
          <Text style={styles.paymentMethodsLabel}>Paiement mobile sécurisé au Sénégal :</Text>
          <View style={styles.operatorBadges}>
            <View style={[styles.opBadge, { backgroundColor: '#1DC7EA' }]}>
              <Text style={[styles.opBadgeText, { color: '#002855' }]}>Wave</Text>
            </View>
            <View style={[styles.opBadge, { backgroundColor: '#FF6600' }]}>
              <Text style={[styles.opBadgeText, { color: '#FFFFFF' }]}>Orange Money</Text>
            </View>
            <View style={[styles.opBadge, { backgroundColor: '#ED1C24' }]}>
              <Text style={[styles.opBadgeText, { color: '#FFFFFF' }]}>Free Money</Text>
            </View>
          </View>
        </View>

        {/* BESOIN D'AIDE */}
        <TouchableOpacity 
          style={styles.helpButton} 
          onPress={handleContactSupport}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" style={{ marginRight: 6 }} />
          <Text style={styles.helpText}>Besoin d'aide ? Contactez notre support WhatsApp</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* BOUTON D'ACTION FLOTTANT EN BAS */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handlePay}
          disabled={processingPayment}
          activeOpacity={0.9}
        >
          {processingPayment ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.ctaContent}>
              <View>
                <Text style={styles.ctaSubtext}>Activer la formule {currentPlanObj.name}</Text>
                <Text style={styles.ctaTitle}>Payer {currentPlanObj.priceFormatted}</Text>
              </View>
              <View style={styles.ctaArrowCircle}>
                <Ionicons name="arrow-forward" size={18} color="#003880" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#002855',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 15,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  headerCrownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  statusBannerActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusBannerTrial: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusBannerExpired: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusIconWrap: {
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  statusDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  sectionHeading: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  plansContainer: {
    marginBottom: 18,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  planCardSelected: {
    borderColor: '#003880',
    backgroundColor: '#F8FAFF',
    borderWidth: 2,
  },
  planCardPopularBorder: {
    borderColor: '#CBD5E1',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  planBadgePopular: {
    backgroundColor: '#F59E0B',
  },
  planBadgeBestValue: {
    backgroundColor: '#059669',
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#003880',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#003880',
  },
  planName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  planDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#003880',
  },
  planPeriod: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  savingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 10,
    marginLeft: 32,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#059669',
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  benefitText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  paymentMethodsRow: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  paymentMethodsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  operatorBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  opBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  opBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  helpText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
  },
  ctaButton: {
    backgroundColor: '#003880',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    elevation: 3,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaSubtext: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '600',
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ctaArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
