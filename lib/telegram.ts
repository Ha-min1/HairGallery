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
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

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

/**
 * Send Booking Confirmation Alert to Telegram Admin
 */
export async function sendTelegramConfirmAlert({
  customerName,
  customerPhone,
  date,
  time,
  serviceName,
  price
}: {
  customerName: string;
  customerPhone: string | null;
  date: string;
  time: string;
  serviceName: string;
  price: number;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId || token === 'your_telegram_bot_token_here' || chatId === 'your_telegram_chat_id_here') {
    console.log('[Telegram Skip] Telegram bot alert environment parameters are not configured.');
    return false;
  }

  const formattedPrice = price > 1000 ? `₩${price.toLocaleString()}` : `$${price}`;
  const phoneDisplay = customerPhone || '미기재';

  const message = `✅ [더 헤어 갤러리 - 예약 확정 알림]
--------------------------------
예약이 확정되었습니다. 확인해 주세요.
• 고객명: ${customerName}
• 연락처: ${phoneDisplay}
• 예약일: ${date} (${time})
• 시술명: ${serviceName}
• 시술가: ${formattedPrice}
--------------------------------`;

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
      console.log('[Telegram Confirmed Alert] Successfully dispatched message.');
      return true;
    } else {
      const errText = await response.text();
      console.error('[Telegram Confirmed Alert Failed]', errText);
      return false;
    }
  } catch (err) {
    console.error('[Telegram Confirmed Alert Error]', err);
    return false;
  }
}

/**
 * Send Daily Confirmed Reservations Briefing to Telegram Admin
 */
export async function sendTelegramDailyBriefing({
  date,
  reservationsList
}: {
  date: string;
  reservationsList: {
    time: string;
    customerName: string;
    customerPhone?: string | null;
    serviceName: string;
    price: number;
  }[];
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId || token === 'your_telegram_bot_token_here' || chatId === 'your_telegram_chat_id_here') {
    console.log('[Telegram Skip] Telegram bot alert environment parameters are not configured.');
    return false;
  }

  let listContent = '';
  if (reservationsList.length === 0) {
    listContent = '\n금일 확정된 예약이 없습니다.\n';
  } else {
    reservationsList.forEach((res, index) => {
      const formattedPrice = res.price > 1000 ? `₩${res.price.toLocaleString()}` : `$${res.price}`;
      const phoneDisplay = res.customerPhone || '연락처 미기재';
      listContent += `\n${index + 1}. ${res.time} - ${res.customerName} (${phoneDisplay})\n   • 시술: ${res.serviceName} (${formattedPrice})\n`;
    });
  }

  const message = `📅 [더 헤어 갤러리 - 당일 예약 확정 브리핑]
--------------------------------
금일(${date}) 확정된 예약은 총 ${reservationsList.length}건입니다.
${listContent}--------------------------------
오늘도 좋은 하루 되세요!`;

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
      console.log('[Telegram Daily Briefing] Successfully dispatched message.');
      return true;
    } else {
      const errText = await response.text();
      console.error('[Telegram Daily Briefing Failed]', errText);
      return false;
    }
  } catch (err) {
    console.error('[Telegram Daily Briefing Error]', err);
    return false;
  }
}

