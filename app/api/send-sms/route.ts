import { NextResponse } from 'next/server';
import client from '@/lib/twilio';

export async function POST(req: Request) {
  const { to, body, channel } = await req.json();

  if (!to || !body) {
    return NextResponse.json({ error: 'Missing phone number or message body' }, { status: 400 });
  }

  try {
    let from;
    let statusCallback;
    if (channel === 'whatsapp' || (typeof to === 'string' && to.startsWith('whatsapp:'))) {
      from = 'whatsapp:+14155238886'; // Twilio WhatsApp sandbox number
      statusCallback = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://loop-ai-five.vercel.app'}/api/twilio-status-callback`;
    } else {
      from = process.env.TWILIO_PHONE_NUMBER!;
      statusCallback = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://loop-ai-five.vercel.app'}/api/twilio-status-callback`;
    }
    const message = await client.messages.create({
      to,
      from,
      body,
      statusCallback,
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error('[send-sms]', error);
    return NextResponse.json({ error: 'Failed to send SMS/WhatsApp' }, { status: 500 });
  }
}
