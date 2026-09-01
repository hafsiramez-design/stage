import { TWILIO_CONFIG } from '../config/twilio';

let currentOTPCode = null;
let currentPhone = null;

// Twilio Config Check
const { ACCOUNT_SID, AUTH_TOKEN, SERVICE_SID } = TWILIO_CONFIG;
const twilioConfigured =
  ACCOUNT_SID.startsWith('AC') &&
  !ACCOUNT_SID.includes('xxx') &&
  SERVICE_SID.startsWith('VA') &&
  !SERVICE_SID.includes('xxx') &&
  AUTH_TOKEN !== 'your_auth_token_here';

const authHeader = 'Basic ' + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);

export function isTwilioConfigured() {
  return twilioConfigured;
}

export function setSMSListener(callback) {
  // Optionnel : garder le listener pour une notification in-app en bonus
}

/**
 * Send REAL SMS to the entered phone number
 */
export async function sendOTP(fullPhone) {
  try {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    currentOTPCode = code;
    currentPhone = fullPhone;

    // 1. Essayer Twilio si configuré (Le meilleur pour la production)
    if (twilioConfigured) {
      const url = `https://verify.twilio.com/v2/Services/${SERVICE_SID}/Verifications`;
      const body = new URLSearchParams();
      body.append('To', fullPhone);
      body.append('Channel', 'sms');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();
      if (response.ok && (data.status === 'pending' || data.status === 'approved')) {
        return { success: true, code };
      }
      console.error('Twilio Error:', data);
      return { success: false, error: 'Erreur Twilio: ' + (data.message || 'Échec') };
    }

    // 2. Si Twilio n'est pas configuré, utiliser Textbelt (1 SMS gratuit par jour par IP)
    const textbeltRes = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: fullPhone,
        message: `WorldEvents: Votre code de vérification est ${code}`,
        key: 'textbelt',
      }),
    });

    const textbeltData = await textbeltRes.json();
    if (textbeltData.success) {
      return { success: true, code };
    } else {
      console.error('Textbelt error:', textbeltData);
      // Si le quota gratuit (1 par jour) est dépassé, on retourne une erreur claire.
      if (textbeltData.error && textbeltData.error.includes('quota')) {
        return { success: false, error: 'Quota SMS gratuit dépassé pour aujourd\'hui. Configurez Twilio pour un usage illimité.' };
      }
      return { success: false, error: textbeltData.error || "Impossible d'envoyer le SMS." };
    }

  } catch (err) {
    console.error('Error sending OTP:', err);
    return { success: false, error: 'Erreur réseau lors de l\'envoi du SMS.' };
  }
}

/**
 * Verify the OTP code entered by the user
 */
export async function verifyOTP(fullPhone, enteredCode) {
  // Si Twilio est configuré, on utilise l'API de vérification Twilio
  if (twilioConfigured) {
    try {
      const url = `https://verify.twilio.com/v2/Services/${SERVICE_SID}/VerificationCheck`;
      const body = new URLSearchParams();
      body.append('To', fullPhone);
      body.append('Code', enteredCode);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      const data = await response.json();
      if (response.ok && data.status === 'approved') return { success: true };
      return { success: false, error: 'Code incorrect.' };
    } catch (e) {
      return { success: false, error: 'Erreur de vérification réseau.' };
    }
  }

  // Sinon, vérification locale en mémoire (utilisé avec Textbelt)
  if (currentOTPCode && enteredCode.trim() === currentOTPCode) {
    return { success: true };
  }
  return { success: false, error: 'Code incorrect. Vérifiez le SMS et réessayez.' };
}

export function getCurrentOTPCode() {
  return currentOTPCode;
}
