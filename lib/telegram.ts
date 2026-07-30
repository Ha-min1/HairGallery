/**
 * Telegram Bot Alert Service for The Hair Gallery
 */

import { OUR_SITE_ADDRESS } from './constants';

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

/**
 * Helper to check if a specific Telegram alert toggle is enabled in admin_settings.
 * Defaults to true if setting is not found or DB error occurs.
 */
export async function checkTelegramSetting(key: string): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) return true;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (!data) return true;
    return Boolean(data.value);
  } catch (err) {
    console.error(`[Telegram Setting Check Error] for key ${key}:`, err);
    return true;
  }
}

/**
 * Send General Inquiry Real-time Alert to Telegram Admin
 */
export async function sendTelegramGeneralInquiryAlert({
  userName,
  userContact,
  title,
  content
}: {
  userName: string;
  userContact?: string | null;
  title: string;
  content: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId || token === 'your_telegram_bot_token_here' || chatId === 'your_telegram_chat_id_here') {
    console.log('[Telegram Skip] Telegram bot alert environment parameters are not configured.');
    return false;
  }

  const siteUrl = OUR_SITE_ADDRESS;
  const dashboardLink = `${siteUrl}/admin/dashboard`;
  const contactText = userContact ? userContact : '비회원 (Guest)';

  const message = `📩 [새로운 일반 문의 접수]
--------------------------------
• 작성자: ${userName} (${contactText})
• 문의 제목: ${title}
• 문의 내용:
${content}
--------------------------------
🔗 [대시보드 바로가기 링크]: ${dashboardLink}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    if (response.ok) {
      console.log('[Telegram General Inquiry Alert] Dispatched successfully.');
      return true;
    } else {
      const errText = await response.text();
      console.error('[Telegram General Inquiry Alert Failed]', errText);
      return false;
    }
  } catch (err) {
    console.error('[Telegram General Inquiry Alert Error]', err);
    return false;
  }
}

/**
 * Send Component-specific Inquiry Real-time Alert to Telegram Admin
 */
export async function sendTelegramComponentInquiryAlert({
  targetComponent,
  userName,
  userContact,
  title,
  content
}: {
  targetComponent: string;
  userName: string;
  userContact?: string | null;
  title: string;
  content: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId || token === 'your_telegram_bot_token_here' || chatId === 'your_telegram_chat_id_here') {
    console.log('[Telegram Skip] Telegram bot alert environment parameters are not configured.');
    return false;
  }

  const siteUrl = OUR_SITE_ADDRESS;
  const dashboardLink = `${siteUrl}/admin/dashboard`;
  const contactText = userContact ? userContact : '비회원 (Guest)';

  const message = `🧩 [새로운 컴포넌트 지정 문의 접수]
--------------------------------
• 지정 영역/컴포넌트: ${targetComponent}
• 작성자: ${userName} (${contactText})
• 문의 제목: ${title}
• 문의 내용:
${content}
--------------------------------
🔗 [대시보드 바로가기 링크]: ${dashboardLink}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    if (response.ok) {
      console.log('[Telegram Component Inquiry Alert] Dispatched successfully.');
      return true;
    } else {
      const errText = await response.text();
      console.error('[Telegram Component Inquiry Alert Failed]', errText);
      return false;
    }
  } catch (err) {
    console.error('[Telegram Component Inquiry Alert Error]', err);
    return false;
  }
}

/**
 * Send Cancellation Alert (Reservation or Inquiry) to Telegram Admin
 */
export async function sendTelegramCancellationAlert({
  category,
  targetName,
  targetContact,
  details,
  reason
}: {
  category: '예약 취소' | '문의 취소' | '문의 삭제' | string;
  targetName: string;
  targetContact?: string | null;
  details: string;
  reason?: string | null;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId || token === 'your_telegram_bot_token_here' || chatId === 'your_telegram_chat_id_here') {
    console.log('[Telegram Skip] Telegram bot alert environment parameters are not configured.');
    return false;
  }

  const siteUrl = OUR_SITE_ADDRESS;
  const dashboardLink = `${siteUrl}/admin/dashboard`;
  const contactText = targetContact ? targetContact : '연락처 미기재';
  const cancelReason = reason ? reason : '고객/관리자 요청 취소';

  const message = `🚫 [예약 / 문의 취소 알림]
--------------------------------
• 구분: ${category}
• 대상자: ${targetName} (${contactText})
• 상세 정보: ${details}
• 취소/삭제 사유: ${cancelReason}
--------------------------------
🔗 [대시보드 바로가기 링크]: ${dashboardLink}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    if (response.ok) {
      console.log('[Telegram Cancellation Alert] Dispatched successfully.');
      return true;
    } else {
      const errText = await response.text();
      console.error('[Telegram Cancellation Alert Failed]', errText);
      return false;
    }
  } catch (err) {
    console.error('[Telegram Cancellation Alert Error]', err);
    return false;
  }
}

