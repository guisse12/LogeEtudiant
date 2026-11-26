/**
 * Service d'intégration PayTech Sénégal pour Logetudiant
 * Supporte : Wave, Orange Money Sénégal, Free Money, Carte Bancaire (Visa / Mastercard)
 * Documentation officielle : https://paytech.sn
 */

export const PAYTECH_CONFIG = {
  apiKey: 'ab496a216d5d430315f218511a5f740b3329901a01dc7071ad5f86f65e6cc0f8',
  apiSecret: '180f03ef3b318b2827c7d89d4f3473ee7c288aec0e9e63598c43c360f464884d',
  currency: 'XOF',
  requestUrl: 'https://paytech.sn/api/payment/request-payment',
  successUrl: 'https://paytech.sn/payment/success',
  cancelUrl: 'https://paytech.sn/payment/cancel',
  ipnUrl: 'https://paytech.sn/payment/success',
};

/**
 * Vérifie si les identifiants PayTech réels sont configurés
 */
export const isPayTechConfigured = () => {
  return (
    !!PAYTECH_CONFIG.apiKey &&
    PAYTECH_CONFIG.apiKey.length > 20 &&
    !!PAYTECH_CONFIG.apiSecret &&
    PAYTECH_CONFIG.apiSecret.length > 20
  );
};

/**
 * Envoie une requête d'initialisation de paiement à PayTech
 * @param {Object} options
 * @param {string} options.env - 'prod' ou 'test'
 * @param {string} options.itemName - Nom du pack (ex: "Pack 3 Mois (Trimestre)")
 * @param {number} options.amount - Montant en FCFA
 * @param {string} options.refCommand - Identifiant unique
 */
const requestPayTechCheckout = async ({ env, itemName, amount, refCommand }) => {
  const payload = {
    item_name: `Abonnement Logetudiant - ${itemName}`,
    item_price: Math.round(amount),
    currency: PAYTECH_CONFIG.currency,
    ref_command: refCommand,
    command_name: `Abonnement Bailleur Pro ${itemName}`,
    env: env,
    ipn_url: PAYTECH_CONFIG.ipnUrl,
    success_url: PAYTECH_CONFIG.successUrl,
    cancel_url: PAYTECH_CONFIG.cancelUrl,
  };

  const response = await fetch(PAYTECH_CONFIG.requestUrl, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'API_KEY': PAYTECH_CONFIG.apiKey,
      'API_SECRET': PAYTECH_CONFIG.apiSecret,
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

/**
 * Initialise une session de paiement PayTech sécurisée
 * Essaie en priorité le mode 'prod', et bascule intelligemment en mode 'test' si
 * l'activation production PayTech est encore en cours de validation par leur support.
 * 
 * @param {Object} params
 * @param {number} params.amount - Montant en FCFA (ex: 1500, 3500, 6000, 10000)
 * @param {string} params.description - Libellé du paiement (ex: "Pack 3 Mois")
 * @param {Object} params.user - Objet utilisateur connecté
 * @param {string} params.planId - Identifiant du plan d'abonnement
 * @returns {Promise<{success: boolean, paymentUrl?: string, token?: string, isTestMode?: boolean, error?: string}>}
 */
export const initializePayTechPayment = async ({ amount, description, user, planId }) => {
  if (!isPayTechConfigured()) {
    return {
      success: false,
      error: "Clés API PayTech manquantes ou invalides.",
    };
  }

  const refCommand = `LOGE_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const itemName = description || 'Abonnement Bailleur Pro';

  try {
    // 1. Essai en mode Production réelle
    let data = await requestPayTechCheckout({
      env: 'prod',
      itemName,
      amount,
      refCommand,
    });

    if (data && (data.success === 1 || data.success === '1') && (data.redirect_url || data.redirectUrl)) {
      return {
        success: true,
        paymentUrl: data.redirect_url || data.redirectUrl,
        token: data.token,
        isTestMode: false,
        refCommand,
      };
    }

    // 2. Si le compte n'a pas encore validé le passage en production auprès du support PayTech,
    // on utilise le mode 'test' pour garantir que le paiement fonctionne immédiatement
    console.log("PayTech prod réponse :", data?.message || data?.error);
    data = await requestPayTechCheckout({
      env: 'test',
      itemName,
      amount,
      refCommand,
    });

    if (data && (data.success === 1 || data.success === '1') && (data.redirect_url || data.redirectUrl)) {
      return {
        success: true,
        paymentUrl: data.redirect_url || data.redirectUrl,
        token: data.token,
        isTestMode: true,
        refCommand,
      };
    }

    return {
      success: false,
      error: data?.message || "Impossible de générer le guichet de paiement PayTech.",
    };
  } catch (error) {
    console.error("Erreur PayTech :", error);
    return {
      success: false,
      error: error?.message || "Erreur de connexion avec le serveur PayTech.",
    };
  }
};
