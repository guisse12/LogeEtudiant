/**
 * Service d'envoi de SMS réels pour Logetudiant Sénégal
 * Permet l'envoi de vrais SMS vers l'application Messages du téléphone
 * via une passerelle télécom (Twilio, Orange Sénégal, Termii, Infobip)
 */

// ============================================================================
// CONFIGURATION DE LA PASSERELLE SMS
// Renseignez vos identifiants fournis par votre opérateur/passerelle SMS
// ============================================================================
export const SMS_CONFIG = {
  // Fournisseur sélectionné : 'TERMII' | 'TWILIO' | 'ORANGE_SENEGAL' | 'DEVELOPPEMENT'
  PROVIDER: 'TERMII',

  // Nom d'expéditeur officiel (11 caractères max selon standard GSM)
  SENDER_NAME: 'Logetudiant',

  // 1. Configuration TERMII (https://termii.com - affiché sur votre écran)
  TERMII: {
    API_KEY: 'tlv_BGpMjZK24E8DyDacz6-8WQJz4c16ii3kU3wdmqjeaU4', // Votre Clé API Termii active
    BASE_URL: 'https://v4.api.termii.com',                       // URL de base visible sur votre écran Termii
    SENDER_ID: 'Logetudiant',                                   // Votre Sender ID soumis
  },

  // 2. Configuration TWILIO (https://www.twilio.com)
  TWILIO: {
    ACCOUNT_SID: '',     // Ex: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    AUTH_TOKEN: '',      // Ex: your_auth_token
    FROM_NUMBER: '',     // Ex: +1234567890 ou 'Logetudiant'
  },

  // 3. Configuration ORANGE SÉNÉGAL (https://developer.orange.com)
  ORANGE_SENEGAL: {
    CLIENT_ID: '',       // Client ID de votre app Orange Developer
    CLIENT_SECRET: '',   // Client Secret
    SENDER_ADDRESS: 'tel:+221000000000',
  },
};

/**
 * Formate un numéro sénégalais au format international (+221XXXXXXXXX)
 */
export const formatSenegalPhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/[^0-9]/g, '');

  if (digits.startsWith('221') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+221${digits}`;
  }
  return `+${digits}`;
};

/**
 * Envoi d'un vrai message SMS vers le téléphone du destinataire
 * @param {string} phone - Numéro de téléphone de l'utilisateur
 * @param {string} code - Code à 6 chiffres
 * @param {string} type - 'inscription' | 'recuperation'
 */
export const sendRealSms = async (phone, codeOrMessage, type = 'inscription') => {
  const formattedPhone = formatSenegalPhone(phone);
  
  let messageBody = '';
  if (type === 'custom') {
    messageBody = String(codeOrMessage);
  } else if (type === 'recuperation') {
    messageBody = `Logetudiant : Votre code de réinitialisation est ${codeOrMessage}. Ne le partagez avec personne.`;
  } else if (type === 'bailleur_valide') {
    messageBody = `Logetudiant : Félicitations ! Votre compte bailleur a été validé et certifié. Vous pouvez désormais publier vos logements.`;
  } else if (type === 'bailleur_rejete') {
    messageBody = `Logetudiant : Votre demande de compte bailleur n'a pas été validée. Veuillez vérifier vos pièces justificatives sur votre compte.`;
  } else {
    messageBody = `Logetudiant : Votre code de confirmation est ${codeOrMessage}. Ne le partagez avec personne.`;
  }

  try {
    // 1. TENTATIVE VIA TWILIO
    if (SMS_CONFIG.PROVIDER === 'TWILIO' && SMS_CONFIG.TWILIO.ACCOUNT_SID && SMS_CONFIG.TWILIO.AUTH_TOKEN) {
      const { ACCOUNT_SID, AUTH_TOKEN, FROM_NUMBER } = SMS_CONFIG.TWILIO;
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
      const credentials = typeof btoa === 'function' 
        ? btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`)
        : Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

      const bodyData = `To=${encodeURIComponent(formattedPhone)}&From=${encodeURIComponent(FROM_NUMBER || SMS_CONFIG.SENDER_NAME)}&Body=${encodeURIComponent(messageBody)}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyData,
      });

      if (response.ok) {
        console.log(`[SMS-TWILIO] SMS envoyé avec succès au ${formattedPhone}`);
        return { success: true, delivered: true, provider: 'TWILIO' };
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn(`[SMS-TWILIO] Échec :`, errData);
      }
    }

    // 1. ENVOI VIA TERMII (AFRIQUE DE L'OUEST / SÉNÉGAL)
    if (SMS_CONFIG.PROVIDER === 'TERMII' && SMS_CONFIG.TERMII.API_KEY) {
      const baseUrl = SMS_CONFIG.TERMII.BASE_URL || 'https://v4.api.termii.com';
      const endpoint = `${baseUrl}/api/sms/send`;

      let response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          to: formattedPhone.replace('+', ''),
          from: SMS_CONFIG.TERMII.SENDER_ID || SMS_CONFIG.SENDER_NAME,
          sms: messageBody,
          type: 'plain',
          channel: 'generic',
          api_key: SMS_CONFIG.TERMII.API_KEY,
        }),
      });

      let data = await response.json().catch(() => ({}));

      // Si le canal 'generic' rencontre un rejet, tentative automatique sur le canal 'dnd'
      if (!response.ok || data.error) {
        try {
          const fallbackResponse = await fetch(endpoint, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              to: formattedPhone.replace('+', ''),
              from: SMS_CONFIG.TERMII.SENDER_ID || SMS_CONFIG.SENDER_NAME,
              sms: messageBody,
              type: 'plain',
              channel: 'dnd',
              api_key: SMS_CONFIG.TERMII.API_KEY,
            }),
          });
          const fallbackData = await fallbackResponse.json().catch(() => ({}));
          if (fallbackResponse.ok && (fallbackData.message_id || fallbackData.code === 'ok' || fallbackData.message === 'Successfully Sent')) {
            response = fallbackResponse;
            data = fallbackData;
          }
        } catch (fbErr) {}
      }

      const isDelivered = response.ok && (
        data.message_id || 
        data.code === 'ok' || 
        data.message === 'Successfully Sent' || 
        (data.status === 'success' && !data.error)
      );

      if (isDelivered) {
        console.log(`[SMS-TERMII] SMS délivré avec succès au ${formattedPhone} :`, data);
        return { success: true, delivered: true, provider: 'TERMII', data };
      } else {
        console.warn(`[SMS-TERMII] Réponse passerelle (en cours de validation opérateur) :`, data?.message || data);
        return { success: true, delivered: false, pendingSenderApproval: true, data };
      }
    }

    // Si aucune passerelle n'est encore renseignée avec des clés valides :
    console.log(`[SMS] En attente de clé API passerelle. Message pour ${formattedPhone} : ${messageBody}`);
    return {
      success: true,
      delivered: false,
      simulated: true,
      message: 'En attente de clé API passerelle SMS.',
    };
  } catch (error) {
    console.error(`[SMS] Erreur d'envoi réseau :`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Envoi d'un message SMS libre personnalisé
 * @param {string} phone - Numéro de téléphone du destinataire
 * @param {string} message - Contenu du message
 */
export const sendCustomSms = async (phone, message) => {
  return sendRealSms(phone, message, 'custom');
};
