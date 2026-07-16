// EmailJS REST API Configuration and Integration
// This allows sending emails via a personal Gmail account through EmailJS,
// bypassing the Node.js nodemailer socket limitation on Cloudflare Pages (Edge runtime)
// and avoiding the need to purchase a custom domain.
const getEmailJSConfig = () => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY; // EmailJS API Private Key for server-side secure requests

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.warn('⚠️ WARNING: EmailJS configurations are not fully defined in environment variables. Email sending will be mocked.');
    return null;
  }

  return { serviceId, templateId, publicKey, privateKey };
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
 * Sends a booking confirmation email to the client using EmailJS REST API.
 */
export async function sendBookingConfirmationEmail({
  toEmail,
  customerName,
  date,
  time,
  serviceName,
  price,
}: SendConfirmationEmailParams) {
  const config = getEmailJSConfig();

  const formattedPrice = new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);

  if (!config) {
    console.log(`[MOCK EMAILJS SENT] To: ${toEmail} | Details: ${customerName}, ${date} ${time}, ${serviceName}, ${formattedPrice}`);
    return { success: true, mock: true };
  }

  const { serviceId, templateId, publicKey, privateKey } = config;

  try {
    const body = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey, // Required for secure server-to-server API calls in EmailJS
      template_params: {
        to_email: toEmail,
        customer_name: customerName,
        booking_date: date,
        booking_time: time,
        service_name: serviceName,
        price: formattedPrice,
      },
    };

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('EmailJS Error Response:', errorText);
      return { success: false, error: errorText || 'Failed to send email via EmailJS' };
    }

    console.log('EmailJS Email Sent Successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send email via EmailJS API:', error);
    return { success: false, error: error.message };
  }
}

interface SendAdminAlertEmailParams {
  toEmail: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  serviceName: string;
  price: number;
}

/**
 * Sends a new booking alert email to the designated administrator.
 */
export async function sendAdminBookingAlertEmail({
  toEmail,
  customerName,
  customerPhone,
  date,
  time,
  serviceName,
  price,
}: SendAdminAlertEmailParams) {
  const config = getEmailJSConfig();
  
  // Use the admin template ID if configured, otherwise fallback to the client template ID.
  const adminTemplateId = process.env.EMAILJS_ADMIN_TEMPLATE_ID || (config ? config.templateId : '');

  const formattedPrice = new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price);

  if (!config || !adminTemplateId) {
    console.log(`[MOCK EMAILJS ADMIN ALERT SENT] To: ${toEmail} | Details: Customer ${customerName} (${customerPhone}), ${date} ${time}, ${serviceName}, ${formattedPrice}`);
    return { success: true, mock: true };
  }

  const { serviceId, publicKey, privateKey } = config;

  try {
    const body = {
      service_id: serviceId,
      template_id: adminTemplateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        to_email: toEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        booking_date: date,
        booking_time: time,
        service_name: serviceName,
        price: formattedPrice,
      },
    };

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('EmailJS Admin Alert Error Response:', errorText);
      return { success: false, error: errorText || 'Failed to send admin alert email via EmailJS' };
    }

    console.log('EmailJS Admin Alert Email Sent Successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send admin alert email via EmailJS API:', error);
    return { success: false, error: error.message };
  }
}
