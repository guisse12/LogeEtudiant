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
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  SUBSCRIPTION_PLANS, 
  getSubscriptionStatus, 
  activateSubscription 
} from '../services/subscriptionService';
import { 
  initializePayTechPayment, 
  isPayTechConfigured 
} from '../services/paytechService';
import { useTranslation } from '../i18n';

export default function SubscriptionScreen({ navigation }) {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState('plan_3_months'); // Par défaut : 3 mois (Populaire)
  const [subscription, setSubscription] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  // États pour le guichet de paiement sécurisé CinetPay WebView
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [activeTransactionId, setActiveTransactionId] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const uData = snap.data();
        setUserData(uData);
        const status = getSubscriptionStatus(uData);
        setSubscription(status);
      }
    } catch (e) {
      console.warn("Erreur chargement abonnement :", e);
    } finally {
      setLoading(false);
    }
  };

  const currentPlanObj = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan) || SUBSCRIPTION_PLANS[0];

  // Gestion du paiement sécurisé PayTech
  const handlePay = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert(t('subscription.connRequired'), t('subscription.connRequiredMsg'));
      return;
    }

    try {
      setProcessingPayment(true);
      const res = await initializePayTechPayment({
        amount: currentPlanObj.price,
        description: currentPlanObj.name,
        user: userData || { uid: user.uid, email: user.email, telephone: user.phoneNumber },
        planId: currentPlanObj.id,
      });

      if (res.success && res.paymentUrl) {
        setActiveTransactionId(res.token || res.refCommand);
        setPaymentUrl(res.paymentUrl);
        setPaymentModalVisible(true);
      } else {
        // En cas de souci temporaire, proposer l'alternative directe par WhatsApp
        Alert.alert(
          "Paiement Logetudiant",
          res.error || "Impossible d'ouvrir le guichet PayTech actuellement.",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Payer par WhatsApp (Wave/OM)",
              onPress: () => {
                Linking.openURL(
                  `https://wa.me/221770719357?text=Bonjour,%20je%20souhaite%20activer%20mon%20${encodeURIComponent(currentPlanObj.name)}%20(${encodeURIComponent(currentPlanObj.priceFormatted)})%20par%20Wave/OM.`
                );
              },
            }
          ]
        );
      }
    } catch (err) {
      console.error("Erreur init PayTech :", err);
      Alert.alert("Erreur", "Une erreur est survenue lors de l'accès au paiement.");
    } finally {
      setProcessingPayment(false);
    }
  };

  // Détection du retour après paiement dans la WebView PayTech
  const handleNavigationStateChange = async (navState) => {
    const { url } = navState;
    if (!url) return;

    // Redirection de succès reconnue (URL de succès PayTech)
    if (
      url.includes('payment/success') || 
      url.includes('paytech.sn/payment/success') ||
      url.includes('paytech.sn/success') ||
      url.includes('success=1') ||
      url.includes('status=ACCEPTED') ||
      url.includes('status=success')
    ) {
      setPaymentModalVisible(false);
      setProcessingPayment(true);
      try {
        const user = auth.currentUser;
        if (user) {
          await activateSubscription(user.uid, selectedPlan);
          const planDisplayName = t(`subscription.plans.${currentPlanObj.id}.name`) || currentPlanObj.name;
          Alert.alert(
            t('subscription.paymentSuccessTitle'),
            t('subscription.paymentSuccessMsg', { plan: planDisplayName }),
            [{ text: t('subscription.greatBtn'), onPress: () => navigation.goBack() }]
          );
          fetchStatus();
        }
      } catch (err) {
        console.error("Erreur validation après paiement :", err);
      } finally {
        setProcessingPayment(false);
        setActiveTransactionId(null);
        setPaymentUrl('');
      }
    } else if (
      url.includes('payment/cancel') ||
      url.includes('paytech.sn/payment/cancel') ||
      url.includes('paytech.sn/cancel')
    ) {
      setPaymentModalVisible(false);
      setPaymentUrl('');
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('https://wa.me/221770719357?text=Bonjour,%20je%20souhaite%20activer%20mon%20abonnement%20Bailleur%20Logetudiant.');
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
          <Text style={styles.headerSubtitle}>{t('subscription.privilegeSpace')}</Text>
          <Text style={styles.headerTitle}>{t('subscription.title')}</Text>
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
                {subscription.status === 'active' && t('subscription.statusActiveTitle')}
                {subscription.status === 'trial' && t('subscription.statusTrialTitle')}
                {subscription.status === 'expired' && t('subscription.statusExpiredTitle')}
              </Text>
              <Text style={styles.statusDesc}>
                {subscription.status === 'active' && t('subscription.statusActiveDesc', { days: subscription.daysLeft })}
                {subscription.status === 'trial' && t('subscription.statusTrialDesc', { days: subscription.daysLeft })}
                {subscription.status === 'expired' && t('subscription.statusExpiredDesc')}
              </Text>
            </View>
          </View>
        ) : null}

        {/* TITRE DE SECTION FORMULES */}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{t('subscription.choosePlan')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('subscription.choosePlanSubtitle')}
          </Text>
        </View>

        {/* CARTES DES 4 PACKS */}
        <View style={styles.plansContainer}>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const planName = t(`subscription.plans.${plan.id}.name`) || plan.name;
            const planDesc = t(`subscription.plans.${plan.id}.desc`) || plan.description;
            const planPerMonth = t(`subscription.plans.${plan.id}.perMonth`) || plan.perMonthText;
            const planBadge = t(`subscription.plans.${plan.id}.badge`) || plan.badge;
            const planSavings = t(`subscription.plans.${plan.id}.savings`) || plan.savings;

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
                {planBadge ? (
                  <View style={[
                    styles.planBadge,
                    plan.bestValue ? styles.planBadgeBestValue : styles.planBadgePopular
                  ]}>
                    <Text style={styles.planBadgeText}>{planBadge}</Text>
                  </View>
                ) : null}

                <View style={styles.planCardHeader}>
                  <View style={styles.radioCircle}>
                    {isSelected ? <View style={styles.radioInnerCircle} /> : null}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.planName}>{planName}</Text>
                    <Text style={styles.planDesc}>{planDesc}</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.planPrice}>{plan.priceFormatted}</Text>
                    <Text style={styles.planPeriod}>{planPerMonth}</Text>
                  </View>
                </View>

                {/* ÉCONOMIE DU PACK */}
                {planSavings ? (
                  <View style={styles.savingsPill}>
                    <Ionicons name="pricetag" size={12} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={styles.savingsText}>{planSavings}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AVANTAGES INCLUS */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>{t('subscription.includedTitle')}</Text>
          
          <View style={styles.benefitRow}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.benefitText}>
              <Text style={{ fontWeight: 'bold' }}>{t('subscription.benefitUnlimited')}</Text>{t('subscription.benefitUnlimitedDesc')}
            </Text>
          </View>

          <View style={styles.benefitRow}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.benefitText}>
              <Text style={{ fontWeight: 'bold' }}>{t('subscription.benefitDirectContact')}</Text>{t('subscription.benefitDirectContactDesc')}
            </Text>
          </View>

          <View style={styles.benefitRow}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.benefitText}>
              <Text style={{ fontWeight: 'bold' }}>{t('subscription.benefitVerifiedBadge')}</Text>{t('subscription.benefitVerifiedBadgeDesc')}
            </Text>
          </View>

          <View style={styles.benefitRow}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.benefitText}>
              <Text style={{ fontWeight: 'bold' }}>{t('subscription.benefitPriority')}</Text>{t('subscription.benefitPriorityDesc')}
            </Text>
          </View>
        </View>

        {/* MOYENS DE PAIEMENT SÉCURISÉS PAYTECH */}
        <View style={styles.paymentMethodsRow}>
          <Text style={styles.paymentMethodsLabel}>{t('subscription.paymentMethodsLabel')}</Text>
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
            <View style={[styles.opBadge, { backgroundColor: '#002855' }]}>
              <Text style={[styles.opBadgeText, { color: '#FFFFFF' }]}>💳 Visa / Mastercard</Text>
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
          <Text style={styles.helpText}>{t('subscription.whatsappHelp')}</Text>
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
                <Text style={styles.ctaSubtext}>
                  {t('subscription.activatePlan', { plan: t(`subscription.plans.${currentPlanObj.id}.name`) || currentPlanObj.name })}
                </Text>
                <Text style={styles.ctaTitle}>
                  {t('subscription.payAmount', { amount: currentPlanObj.priceFormatted })}
                </Text>
              </View>
              <View style={styles.ctaArrowCircle}>
                <Ionicons name="arrow-forward" size={18} color="#003880" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* GUICHET DE PAIEMENT SÉCURISÉ CINETPAY (MODALE WEBVIEW INTÉGRÉE) */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          Alert.alert(
            t('subscription.interruptPaymentTitle'),
            t('subscription.interruptPaymentDesc'),
            [
              { text: t('subscription.continueBtn'), style: "cancel" },
              { text: t('subscription.closeBtn'), style: "destructive", onPress: () => setPaymentModalVisible(false) }
            ]
          );
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#002855' }}>
          <StatusBar barStyle="light-content" backgroundColor="#002855" />

          {/* BARRE DE TITRE DU GUICHET */}
          <View style={styles.webHeader}>
            <TouchableOpacity 
              style={styles.webCloseBtn} 
              onPress={() => {
                Alert.alert(
                  t('subscription.interruptPaymentTitle'),
                  t('subscription.interruptPaymentDesc'),
                  [
                    { text: t('subscription.continueBtn'), style: "cancel" },
                    { text: t('subscription.closeBtn'), style: "destructive", onPress: () => setPaymentModalVisible(false) }
                  ]
                );
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.webTitleBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="shield-checkmark" size={14} color="#FBBF24" style={{ marginRight: 5 }} />
                <Text style={styles.webTitle}>{t('subscription.cinetpayGatewayTitle')}</Text>
              </View>
              <Text style={styles.webSubtitle}>{t('subscription.cinetpayGatewaySubtitle')}</Text>
            </View>

            <View style={{ width: 36 }} />
          </View>

          {/* WEBVIEW OFFICIELLE PAYTECH */}
          {paymentUrl ? (
            <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={handleNavigationStateChange}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webLoader}>
                  <ActivityIndicator size="large" color="#003880" />
                  <Text style={styles.webLoaderText}>{t('subscription.connectingGateway')}</Text>
                  <Text style={styles.webLoaderSubtext}>{t('subscription.pleaseWait')}</Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.webLoader}>
              <ActivityIndicator size="large" color="#003880" />
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  opBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    marginVertical: 2,
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

  // STYLES DU GUICHET DE PAIEMENT SÉCURISÉ CINETPAY (WEBVIEW)
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#002855',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#001A38',
  },
  webCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webTitleBox: {
    alignItems: 'center',
  },
  webTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  webSubtitle: {
    fontSize: 10,
    color: '#93C5FD',
    marginTop: 2,
    fontWeight: '500',
  },
  webLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  webLoaderText: {
    marginTop: 14,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    textAlign: 'center',
  },
  webLoaderSubtext: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
