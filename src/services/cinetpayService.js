/**
 * Service d'intégration CinetPay pour Logetudiant
 * Supporte : Wave, Orange Money, MTN MoMo, Moov Money, Free Money, Visa & Mastercard
 * Documentation officielle : https://docs.cinetpay.com
 */

// ============================================================================
// CONFIGURATION DU COMPTE MARCHAND CINETPAY
// Dès réception de vos identifiants CinetPay, collez-les directement ci-dessous :
// ============================================================================
export const CINETPAY_CONFIG = {
  // Clé API secrète (fournie sur votre tableau de bord CinetPay)
  apiKey: 'YOUR_CINETPAY_APIKEY',

  // Identifiant numérique de votre site / service
  siteId: 'YOUR_CINETPAY_SITE_ID',

  // Devise principale pour la zone FCFA (XOF pour Afrique de l'Ouest, XAF pour Afrique Centrale)
  currency: 'XOF',

  // URLs de retour et notification
  notifyUrl: 'https://logeetudiant.com/api/cinetpay/notify',
  returnUrl: 'https://logeetudiant.com/api/cinetpay/return',

  // Endpoint officiel API v2
  apiBaseUrl: 'https://api-checkout.cinetpay.com/v2',
};

/**
 * Vérifie si les identifiants CinetPay réels ont été renseignés
 */
export const isCinetPayConfigured = () => {
  return (
    CINETPAY_CONFIG.apiKey &&
    CINETPAY_CONFIG.apiKey !== 'YOUR_CINETPAY_APIKEY' &&
    CINETPAY_CONFIG.siteId &&
    CINETPAY_CONFIG.siteId !== 'YOUR_CINETPAY_SITE_ID'
  );
};

/**
 * Initialise une session de paiement CinetPay et génère l'URL du guichet de paiement
 * @param {Object} params
 * @param {number} params.amount - Montant en FCFA (ex: 1500, 3500, 6000, 10000)
 * @param {string} params.description - Libellé du paiement (ex: "Pack 3 Mois Bailleur Pro")
 * @param {Object} params.user - Objet utilisateur connecté
 * @param {string} params.planId - Identifiant du plan d'abonnement
 * @returns {Promise<{success: boolean, paymentUrl?: string, transactionId?: string, error?: string}>}
 */
export const initializeCinetPayPayment = async ({ amount, description, user, planId }) => {
  // Si le compte n'est pas encore configuré avec les clés réelles
  if (!isCinetPayConfigured()) {
    return {
      success: false,
      isNotConfigured: true,
      error: "Identifiants CinetPay non configurés. Veuillez renseigner l'APIKEY et le SITE ID.",
    };
  }

  // Identifiant unique de transaction
  const transactionId = `LOGE_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  // Découpage propre du nom et prénom de l'utilisateur
  const rawName = user?.nom || user?.displayName || 'Bailleur Logetudiant';
  const nameParts = rawName.trim().split(' ');
  const firstName = nameParts[0] || 'Bailleur';
  const lastName = nameParts.slice(1).join(' ') || 'Logetudiant';

  // Formatage du numéro de téléphone
  let phone = (user?.telephone || user?.phoneNumber || '770719357').replace(/[^0-9+]/g, '');
  if (!phone.startsWith('+')) {
    phone = `+221${phone.replace(/^221/, '')}`;
  }

  const payload = {
    apikey: CINETPAY_CONFIG.apiKey,
    site_id: CINETPAY_CONFIG.siteId,
    transaction_id: transactionId,
    amount: Math.round(amount),
    currency: CINETPAY_CONFIG.currency,
    description: description || 'Abonnement Bailleur Pro Logetudiant',
    notify_url: CINETPAY_CONFIG.notifyUrl,
    return_url: CINETPAY_CONFIG.returnUrl,
    channels: 'ALL', // Wave, Orange Money, MTN, Moov, Carte bancaire
    metadata: JSON.stringify({
      userId: user?.uid || '',
      planId: planId || '',
      appName: 'Logetudiant',
    }),
    customer_id: user?.uid || 'user_anonymous',
    customer_name: firstName,
    customer_surname: lastName,
    customer_email: user?.email && !user?.email.endsWith('@logeetudiant.sn') ? user.email : 'contact@logeetudiant.com',
    customer_phone_number: phone,
    customer_address: 'Dakar',
    customer_city: 'Dakar',
    customer_country: 'SN',
    customer_state: 'SN',
    customer_zip_code: '00221',
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    const response = await fetch(`${CINETPAY_CONFIG.apiBaseUrl}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.code === '201' && data.data?.payment_url) {
      return {
        success: true,
        paymentUrl: data.data.payment_url,
        paymentToken: data.data.payment_token,
        transactionId,
      };
    } else {
      return {
        success: false,
        error: data.message || data.description || "Échec de l'initialisation du paiement CinetPay.",
      };
    }
  } catch (err) {
    console.error('[CinetPay] Erreur réseau initialization :', err);
    return {
      success: false,
      error: "Connexion impossible aux serveurs CinetPay. Veuillez vérifier votre connexion Internet.",
    };
  }
};

/**
 * Vérifie le statut réel d'une transaction auprès de CinetPay
 * @param {string} transactionId - Identifiant unique de la transaction
 * @returns {Promise<{success: boolean, status: string, data?: Object}>}
 */
export const checkCinetPayTransaction = async (transactionId) => {
  if (!isCinetPayConfigured()) {
    return { success: false, status: 'NOT_CONFIGURED' };
  }

  try {
    const response = await fetch(`${CINETPAY_CONFIG.apiBaseUrl}/payment/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: CINETPAY_CONFIG.apiKey,
        site_id: CINETPAY_CONFIG.siteId,
        transaction_id: transactionId,
      }),
    });

    const result = await response.json();

    // Code "00" chez CinetPay = Transaction acceptée et payée avec succès
    if (result.code === '00' && result.data?.status === 'ACCEPTED') {
      return {
        success: true,
        status: 'ACCEPTED',
        data: result.data,
      };
    } else {
      return {
        success: false,
        status: result.data?.status || result.message || 'REFUSED',
        data: result.data,
      };
    }
  } catch (err) {
    console.error('[CinetPay] Erreur vérification transaction :', err);
    return {
      success: false,
      status: 'NETWORK_ERROR',
    };
  }
};
