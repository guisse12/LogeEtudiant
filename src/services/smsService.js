/**
 * Service d'envoi de SMS réels pour Logetudiant Sénégal
 * Permet l'envoi de vrais SMS vers l'application Messages du téléphone
 * via la passerelle télécom Termii (avec support Twilio, Firebase et Orange en secours)
 */

// ============================================================================
// CONFIGURATION DE LA PASSERELLE SMS
// ============================================================================
export const SMS_CONFIG = {
  // Fournisseur sélectionné : 'TERMII' (Sender ID officiel Logetudiant)
  PROVIDER: 'TERMII',

  // Nom d'expéditeur officiel (11 caractères max selon standard GSM international)
  SENDER_NAME: 'Logetudiant',

  // 1. Configuration TERMII (https://termii.com - Solde actif : 4.501 USD)
  TERMII: {
    API_KEY: 'tlv_BGpMjZK24E8DyDacz6-8WQJz4c16ii3kU3wdmqjeaU4', // Votre Clé API active
    BASE_URL: 'https://v4.api.termii.com',                       // Endpoint officiel Termii
    SENDER_ID: 'Logetudiant',                                   // Nom officiel à valider avec NINEA
  },

  // 2. Configuration FIREBASE AUTH (Option de secours)
  FIREBASE: {
    API_KEY: 'AIzaSyCwqZASk4uvCZCZidBLL3sobSEQkBxjLBo',
    AUTH_DOMAIN: 'logeetudiant-3867e.firebaseapp.com',
    PROJECT_ID: 'logeetudiant-3867e',
  },

  // 3. Configuration TWILIO
  TWILIO: {
    ACCOUNT_SID: '',
    AUTH_TOKEN: '',
    FROM_NUMBER: '',
  },

  // 4. Configuration ORANGE SÉNÉGAL (https://developer.orange.com)
  ORANGE_SENEGAL: {
    CLIENT_ID: '',
    CLIENT_SECRET: '',
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
 * @param {string} codeOrMessage - Code à 6 chiffres ou texte personnalisé
 * @param {string} type - 'inscription' | 'recuperation' | 'bailleur_valide' | 'bailleur_rejete' | 'custom'
 */
export const sendRealSms = async (phone, codeOrMessage, type = 'inscription') => {
  const formattedPhone = formatSenegalPhone(phone);
  const plainPhoneWithoutPlus = formattedPhone.replace('+', '');
  
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
    // ========================================================================
    // 1. ENVOI PRIORITAIRE VIA TERMII (AFRIQUE DE L'OUEST / SÉNÉGAL)
    // ========================================================================
    if (SMS_CONFIG.PROVIDER === 'TERMII' && SMS_CONFIG.TERMII.API_KEY) {
      const baseUrl = SMS_CONFIG.TERMII.BASE_URL || 'https://v4.api.termii.com';
      const endpoint = `${baseUrl}/api/sms/send`;
      const senderId = SMS_CONFIG.TERMII.SENDER_ID || SMS_CONFIG.SENDER_NAME;

      console.log(`[SMS-TERMII] Tentative d'envoi vers ${formattedPhone} via Sender ID "${senderId}"...`);

      // Étape A : Tentative sur le canal transactionnel 'dnd' (recommandé pour les codes OTP au Sénégal)
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          to: plainPhoneWithoutPlus,
          from: senderId,
          sms: messageBody,
          type: 'plain',
          channel: 'dnd',
          api_key: SMS_CONFIG.TERMII.API_KEY,
        }),
      });

      let data = await response.json().catch(() => ({}));

      // Étape B : Si le canal 'dnd' échoue ou est refusé, tentative de secours sur le canal 'generic'
      if (!response.ok || data.error || (data.code && data.code !== 'ok')) {
        try {
          const fallbackResponse = await fetch(endpoint, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              to: plainPhoneWithoutPlus,
              from: senderId,
              sms: messageBody,
              type: 'plain',
              channel: 'generic',
              api_key: SMS_CONFIG.TERMII.API_KEY,
            }),
          });
          const fallbackData = await fallbackResponse.json().catch(() => ({}));
          if (fallbackResponse.ok && (fallbackData.message_id || fallbackData.code === 'ok' || fallbackData.message === 'Successfully Sent')) {
            response = fallbackResponse;
            data = fallbackData;
          }
        } catch (fbErr) {
          console.warn('[SMS-TERMII] Fallback generic non joignable :', fbErr);
        }
      }

      // Vérification du succès de délivrance
      const isDelivered = response.ok && (
        Boolean(data.message_id) || 
        data.code === 'ok' || 
        data.message === 'Successfully Sent' || 
        (data.status === 'success' && !data.error)
      );

      if (isDelivered) {
        console.log(`[SMS-TERMII] ✅ SMS délivré avec succès au ${formattedPhone} avec l'expéditeur ${senderId} :`, data);
        return { 
          success: true, 
          delivered: true, 
          provider: 'TERMII', 
          senderId: senderId,
          data 
        };
      } else {
        const errorDetail = data?.message || data?.error || JSON.stringify(data);
        console.warn(`[SMS-TERMII] ⏳ Sender ID "${senderId}" en attente de validation opérateur/NINEA :`, errorDetail);
        return { 
          success: true, 
          delivered: false, 
          pendingSenderApproval: true, 
          provider: 'TERMII', 
          errorDetail,
          data 
        };
      }
    }

    // ========================================================================
    // 2. TENTATIVE VIA TWILIO
    // ========================================================================
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

    // ========================================================================
    // 3. SECONDAIRE : FIREBASE AUTH SMS
    // ========================================================================
    if (SMS_CONFIG.PROVIDER === 'FIREBASE_AUTH' && SMS_CONFIG.FIREBASE?.API_KEY) {
      const apiKey = SMS_CONFIG.FIREBASE.API_KEY;
      const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${apiKey}`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: formattedPhone }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.sessionInfo) {
          return {
            success: true,
            delivered: true,
            provider: 'FIREBASE_AUTH',
            sessionInfo: data.sessionInfo,
          };
        }
      } catch (fbErr) {}
    }

    // Si aucune passerelle n'est disponible
    console.log(`[SMS] En attente de validation passerelle SMS pour ${formattedPhone}`);
    return {
      success: true,
      delivered: false,
      simulated: true,
      message: 'En attente de validation passerelle SMS.',
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
