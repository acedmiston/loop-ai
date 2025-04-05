import { NextResponse } from 'next/server';
import client from '@/lib/twilio';

export async function POST(req: Request) {
  const { to, body } = await req.json();

  if (!to || !body) {
    return NextResponse.json({ error: 'Missing phone number or message body' }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body,
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error('[send-sms]', error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}
