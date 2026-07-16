/**
 * Telegram Bot Alert Service for The Hair Gallery
 */

export async function sendTelegramAdminAlert({
  customerName,
  customerPhone,
  date,
  time,
  serviceName,
  price
}: {
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  serviceName: string;
  price: number;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  // If environment variables are not configured or are placeholder strings, bypass silently
  if (!token || !chatId || token === 'your_telegram_bot_token_here' || chatId === 'your_telegram_chat_id_here') {
    console.log('[Telegram Skip] Telegram bot alert environment parameters are not configured.');
    return false;
  }

  // Format Korean Currency
  const formattedPrice = price > 1000 ? `₩${price.toLocaleString()}` : `$${price}`;

  const message = `🔔 [더 헤어 갤러리 - 신규 예약 접수]
--------------------------------
• 고객명: ${customerName}
• 연락처: ${customerPhone}
• 예약일: ${date} (${time})
• 시술명: ${serviceName}
• 시술가: ${formattedPrice}
--------------------------------
관리자 콘솔에 접속하여 예약을 확정하거나 조율해 주세요.`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    if (response.ok) {
      console.log('[Telegram Alert] Successfully dispatched message to administrator.');
      return true;
    } else {
      const errText = await response.text();
      console.error('[Telegram Alert Failed]', errText);
      return false;
    }
  } catch (err) {
    console.error('[Telegram Alert Error]', err);
    return false;
  }
}
