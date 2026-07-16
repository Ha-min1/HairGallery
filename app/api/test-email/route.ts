import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmationEmail, sendAdminBookingAlertEmail } from '@/lib/email';

export const runtime = 'edge';

// GET: Temporary debug endpoint to test EmailJS notifications
// Usage: Open http://localhost:3000/api/test-email in your browser
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const toEmail = searchParams.get('to') || 'johamin3624@gmail.com';
    const testType = searchParams.get('type') || 'admin'; // 'admin' or 'client'

    console.log(`[Debug API] Testing email send. To: ${toEmail}, Type: ${testType}`);

    // Inspect environment variables on runtime
    const envInspect = {
      EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID ? 'Configured (starts with ' + process.env.EMAILJS_SERVICE_ID.substring(0, 8) + '...)' : 'MISSING',
      EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID ? 'Configured (starts with ' + process.env.EMAILJS_TEMPLATE_ID.substring(0, 8) + '...)' : 'MISSING',
      EMAILJS_ADMIN_TEMPLATE_ID: process.env.EMAILJS_ADMIN_TEMPLATE_ID ? 'Configured (starts with ' + process.env.EMAILJS_ADMIN_TEMPLATE_ID.substring(0, 8) + '...)' : 'MISSING (Will fallback to client template)',
      EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY ? 'Configured (starts with ' + process.env.EMAILJS_PUBLIC_KEY.substring(0, 8) + '...)' : 'MISSING',
      EMAILJS_PRIVATE_KEY: process.env.EMAILJS_PRIVATE_KEY ? 'Configured (length: ' + process.env.EMAILJS_PRIVATE_KEY.length + ')' : 'MISSING',
    };

    let result;

    if (testType === 'admin') {
      result = await sendAdminBookingAlertEmail({
        toEmail,
        customerName: '홍길동(테스트)',
        customerPhone: '010-9999-8888',
        date: '2026-07-16',
        time: '14:00',
        serviceName: 'Signature Cut & Blowout',
        price: 15000
      });
    } else {
      result = await sendBookingConfirmationEmail({
        toEmail,
        customerName: '홍길동(테스트)',
        date: '2026-07-16',
        time: '14:00',
        serviceName: 'Signature Cut & Blowout',
        price: 15000
      });
    }

    return NextResponse.json({
      message: 'Email debug test executed',
      type: testType,
      targetEmail: toEmail,
      envInspect,
      sendResult: result
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
