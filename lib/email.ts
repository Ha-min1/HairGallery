import nodemailer from 'nodemailer';

// Create Nodemailer Transporter using Gmail SMTP.
// GMAIL_USER and GMAIL_APP_PASSWORD should be stored in your .env.local file.
// If not provided, we will mock the email send to prevent server runtime crashes.
const getTransporter = () => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    console.warn('⚠️ WARNING: GMAIL_USER or GMAIL_APP_PASSWORD is not defined in environment variables. Email sending will be mocked.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
};

interface SendConfirmationEmailParams {
  toEmail: string;
  customerName: string;
  date: string;
  time: string;
  serviceName: string;
  price: number;
}

/**
 * Sends a booking confirmation email to the client using Nodemailer with Gmail SMTP.
 */
export async function sendBookingConfirmationEmail({
  toEmail,
  customerName,
  date,
  time,
  serviceName,
  price,
}: SendConfirmationEmailParams) {
  const transporter = getTransporter();

  const formattedPrice = new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);

  const emailSubject = `[더 헤어 갤러리] 예약이 확정되었습니다. (${customerName}님)`;
  
  // HTML Template for the confirmation email
  const emailHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #1c1917;">
        <h1 style="color: #1c1917; font-size: 24px; margin: 0; letter-spacing: 2px;">THE HAIR GALLERY</h1>
        <p style="color: #78716c; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; font-weight: bold;">Reservation Confirmed</p>
      </div>
      
      <div style="padding: 30px 10px;">
        <p style="font-size: 16px; color: #44403c; line-height: 1.6;">
          안녕하세요, <strong>${customerName}</strong>님.<br />
          더 헤어 갤러리를 선택해 주셔서 대단히 감사합니다.<br />
          요청하신 예약이 정상적으로 <strong>확정</strong>되었습니다. 아래 예약 내용을 확인해 주세요.
        </p>
        
        <div style="margin-top: 25px; background-color: #fafaf9; border: 1px solid #f5f5f4; border-radius: 8px; padding: 20px;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse; color: #44403c;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 30%; color: #78716c;">예약 일시</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1c1917;">${date} ${time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #78716c;">선택 시술</td>
              <td style="padding: 8px 0; color: #1c1917;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #78716c;">결제 금액</td>
              <td style="padding: 8px 0; color: #b45309; font-weight: bold;">${formattedPrice}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 30px; padding: 15px; border-left: 4px solid #d97706; background-color: #fffbeb; border-radius: 0 8px 8px 0;">
          <p style="font-size: 12px; color: #b45309; margin: 0; line-height: 1.6;">
            <strong>※ 안내 사항</strong><br />
            • 예약 시간 10분 전까지 매장에 방문해 주시기 바랍니다.<br />
            • 예약을 변경하거나 취소하시려면 마이페이지 혹은 매장으로 직접 연락 부탁드립니다.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e7e5e4; font-size: 11px; color: #a8a29e;">
        <p style="margin: 0;">경기도 김포시 번동 806번지 상가동 103호 풍년마을삼성3단지아파트</p>
        <p style="margin: 5px 0 0 0;">© THE HAIR GALLERY. All rights reserved.</p>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log(`[MOCK EMAIL SENT] To: ${toEmail} | Subject: ${emailSubject}`);
    return { success: true, mock: true };
  }

  try {
    const gmailUser = process.env.GMAIL_USER;
    const mailOptions = {
      from: `"더 헤어 갤러리" <${gmailUser}>`,
      to: toEmail,
      subject: emailSubject,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Gmail Sent Successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Failed to send email via Gmail SMTP:', error);
    return { success: false, error: error.message };
  }
}
