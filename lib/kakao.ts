// Solapi API credentials and configuration should be stored in your .env.local file.
// If any parameter is missing, we will mock the SMS/KakaoTalk send to avoid server runtime crashes.
const getSolapiConfig = () => {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const fromPhone = process.env.SOLAPI_FROM_PHONE; // Solapi verified sender phone number
  const pfId = process.env.SOLAPI_PF_ID;           // KakaoTalk Plus Friend Channel ID
  const templateId = process.env.SOLAPI_TEMPLATE_ID; // Approved KakaoTalk template ID

  if (!apiKey || !apiSecret || !fromPhone || !pfId || !templateId) {
    console.warn('⚠️ WARNING: Solapi credentials or configurations are not fully defined in environment variables. KakaoTalk notification will be mocked.');
    return null;
  }

  return { apiKey, apiSecret, fromPhone, pfId, templateId };
};

/**
 * Generates HMAC-SHA256 Authorization Header using Edge-compatible Web Crypto API.
 * This replaces Node.js 'crypto' module to allow deployment on Cloudflare Pages (Edge runtime).
 */
async function getSolapiAuthHeader(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString();
  // Generate random salt
  const salt = Math.random().toString(36).substring(2, 18);
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiSecret);
  const messageData = encoder.encode(date + salt);
  
  // Import secret key for HMAC SHA-256
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the message
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  );
  
  // Convert signature buffer to hex string
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return {
    'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    'Content-Type': 'application/json'
  };
}

interface SendKakaoNotificationParams {
  toPhone: string; // Recipient phone number, e.g. "010-1234-5678" or "01012345678"
  customerName: string;
  date: string;
  time: string;
  serviceName: string;
  price: number;
}

/**
 * Sends a booking confirmation KakaoTalk AlimTalk message using Solapi.
 */
export async function sendKakaoBookingNotification({
  toPhone,
  customerName,
  date,
  time,
  serviceName,
  price,
}: SendKakaoNotificationParams) {
  const config = getSolapiConfig();
  
  // Clean phone number: remove hyphens, Solapi expects only numbers (e.g. "01012345678")
  const cleanedPhone = toPhone.replace(/\D/g, '');
  const formattedPrice = new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);

  if (!config) {
    console.log(`[MOCK KAKAOTALK SENT] To: ${cleanedPhone} | Customer: ${customerName} | Details: ${date} ${time}, ${serviceName}, ${formattedPrice}`);
    return { success: true, mock: true };
  }

  const { apiKey, apiSecret, fromPhone, pfId, templateId } = config;

  try {
    const headers = await getSolapiAuthHeader(apiKey, apiSecret);
    const body = {
      message: {
        to: cleanedPhone,
        from: fromPhone,
        type: 'ATA', // ATA represents KakaoTalk AlimTalk
        kakaoOptions: {
          pfId: pfId,
          templateId: templateId,
          // Replace #{...} variables in your registered Solapi template
          variables: {
            '#{고객명}': customerName,
            '#{예약일시}': `${date} ${time}`,
            '#{시술명}': serviceName,
            '#{결제금액}': formattedPrice
          }
        }
      }
    };

    const res = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: headers as any,
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Solapi Error Response:', data);
      return { success: false, error: data.errorMessage || 'Failed to send KakaoTalk via Solapi' };
    }

    console.log('Solapi KakaoTalk Sent Successfully:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to send KakaoTalk via Solapi:', error);
    return { success: false, error: error.message };
  }
}
