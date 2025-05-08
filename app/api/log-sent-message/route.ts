import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { event_id, guest_id, to_phone, from_user_id, message_body, channel, twilio_sid, status } =
    await req.json();

  if (!event_id || !guest_id || !to_phone || !from_user_id || !message_body || !channel) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error } = await supabase.from('sent_messages').insert([
    {
      event_id,
      guest_id,
      to_phone,
      from_user_id,
      message_body,
      channel,
      twilio_sid,
      status: status || 'sent',
    },
  ]);

  if (error) {
    return NextResponse.json({ error: 'Failed to log sent message' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
