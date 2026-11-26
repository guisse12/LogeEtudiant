import { db, auth } from '../config/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * Service de gestion des abonnements Bailleurs Logetudiant
 * Grille tarifaire officielle :
 * - Essai : 30 jours gratuits dès l'inscription
 * - 1 Mois : 1 500 FCFA
 * - 3 Mois : 3 500 FCFA (~1 166 FCFA/mois, Économie 1 000 FCFA)
 * - 6 Mois : 6 000 FCFA (1 000 FCFA/mois, 2 mois offerts, Économie 3 000 FCFA)
 * - 1 An : 10 000 FCFA (~833 FCFA/mois, 5 mois offerts, Économie 8 000 FCFA)
 */

export const SUBSCRIPTION_PLANS = [
  {
    id: 'plan_1_month',
    name: 'Pack 1 Mois (Découverte)',
    durationDays: 30,
    price: 1500,
    priceFormatted: '1 500 FCFA',
    perMonthText: '1 500 FCFA / mois',
    badge: null,
    savings: null,
    description: 'Idéal pour louer une chambre ou un studio rapidement.',
  },
  {
    id: 'plan_3_months',
    name: 'Pack 3 Mois (Trimestre)',
    durationDays: 90,
    price: 3500,
    priceFormatted: '3 500 FCFA',
    perMonthText: '~1 166 FCFA / mois',
    badge: 'LE PLUS POPULAIRE ⭐',
    savings: 'Économisez 1 000 FCFA',
    description: 'Visibilité garantie pendant tout le semestre universitaire.',
    popular: true,
  },
  {
    id: 'plan_6_months',
    name: 'Pack 6 Mois (Semestre)',
    durationDays: 180,
    price: 6000,
    priceFormatted: '6 000 FCFA',
    perMonthText: '1 000 FCFA / mois',
    badge: 'MEILLEURE OFFRE 🔥',
    savings: '2 mois offerts (Éco. 3 000 FCFA)',
    description: 'Tranquillité totale et priorité maximale sur les recherches.',
    bestValue: true,
  },
  {
    id: 'plan_12_months',
    name: 'Pack 1 An (Annuel Privilège)',
    durationDays: 365,
    price: 10000,
    priceFormatted: '10 000 FCFA',
    perMonthText: '~833 FCFA / mois',
    badge: 'PRIVILÈGE ANNUEL 👑',
    savings: '5 mois offerts (Éco. 8 000 FCFA)',
    description: '1 an de publications illimitées et badge certifié permanent.',
    annual: true,
  },
];

/**
 * Calcule l'état de l'abonnement du bailleur
 * @param {Object} userData Données utilisateur Firestore
 * @returns {Object} { status: 'trial' | 'active' | 'expired', daysLeft: number, expirationDate: Date | null }
 */
export const getSubscriptionStatus = (userData) => {
  if (!userData) {
    return { status: 'trial', daysLeft: 30, expirationDate: null };
  }

  // Super-admin toujours illimité
  if (userData.role === 'admin' || userData.telephone === '763318157') {
    return { status: 'active', daysLeft: 999, expirationDate: null, isAdmin: true };
  }

  const now = Date.now();

  // 1. Si abonnement payant actif
  if (userData.subscriptionExpiresAt) {
    const expiresAtMs = userData.subscriptionExpiresAt?.toDate 
      ? userData.subscriptionExpiresAt.toDate().getTime() 
      : new Date(userData.subscriptionExpiresAt).getTime();

    if (expiresAtMs > now) {
      const daysLeft = Math.ceil((expiresAtMs - now) / (1000 * 60 * 60 * 24));
      return {
        status: 'active',
        daysLeft,
        expirationDate: new Date(expiresAtMs),
        plan: userData.subscriptionPlan || 'custom',
      };
    }
  }

  // 2. Si dans la période des 30 jours d'essai gratuit
  let createdMs = now;
  if (userData.createdAt) {
    createdMs = userData.createdAt?.toDate 
      ? userData.createdAt.toDate().getTime() 
      : new Date(userData.createdAt).getTime();
  }

  const trialDurationMs = 30 * 24 * 60 * 60 * 1000;
  const trialEndMs = createdMs + trialDurationMs;

  if (trialEndMs > now) {
    const daysLeft = Math.max(1, Math.ceil((trialEndMs - now) / (1000 * 60 * 60 * 24)));
    return {
      status: 'trial',
      daysLeft,
      expirationDate: new Date(trialEndMs),
    };
  }

  // 3. Période d'essai terminée et pas d'abonnement actif
  return {
    status: 'expired',
    daysLeft: 0,
    expirationDate: new Date(trialEndMs),
  };
};

/**
 * Valide ou renouvelle un abonnement pour un bailleur
 * @param {string} userId ID Firebase de l'utilisateur
 * @param {string} planId Identifiant du plan ('plan_1_month', 'plan_3_months', 'plan_6_months')
 */
export const activateSubscription = async (userId, planId) => {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);

  const now = Date.now();
  let baseDate = now;

  if (snap.exists()) {
    const data = snap.data();
    if (data.subscriptionExpiresAt) {
      const currentExp = data.subscriptionExpiresAt?.toDate 
        ? data.subscriptionExpiresAt.toDate().getTime() 
        : new Date(data.subscriptionExpiresAt).getTime();
      if (currentExp > now) {
        baseDate = currentExp; // Prolonger à partir de la date d'expiration actuelle
      }
    }
  }

  const newExpiresAt = new Date(baseDate + plan.durationDays * 24 * 60 * 60 * 1000);

  await updateDoc(userRef, {
    subscriptionPlan: plan.id,
    subscriptionPlanName: plan.name,
    subscriptionPrice: plan.price,
    subscriptionStatus: 'active',
    subscriptionExpiresAt: Timestamp.fromDate(newExpiresAt),
    subscriptionUpdatedAt: Timestamp.fromDate(new Date()),
  });

  return {
    success: true,
    plan,
    expiresAt: newExpiresAt,
  };
};
