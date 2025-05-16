import { NextResponse } from 'next/server';
import client from '@/lib/twilio';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  // Twilio sends data as application/x-www-form-urlencoded
  const formData = await req.formData();
  const from = formData.get('From'); // The sender (guest)
  const to = formData.get('To');
  const body = formData.get('Body');

  if (!from || !body) {
    return NextResponse.json({ error: 'Missing from or body' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const fromPhone = from.toString().replace(/^whatsapp:/, '');
  const bodyText = body.toString().trim().toLowerCase();

  // Opt-out/Opt-in logic
  if (bodyText === 'stop') {
    // Mark guest as opted out
    await supabase.from('guests').update({ opted_out: true }).eq('phone', fromPhone);
    // Log opt-out event
    await supabase.from('guest_opt_events').insert([{ guest_id: null, event: 'opt_out' }]);
    // Respond to Twilio (auto-reply)
    return new Response(
      '<Response><Message>You have been opted out and will not receive further messages.</Message></Response>',
      {
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  }
  if (bodyText === 'start' || bodyText === 'unstop') {
    await supabase.from('guests').update({ opted_out: false }).eq('phone', fromPhone);
    await supabase.from('guest_opt_events').insert([{ guest_id: null, event: 'opt_in' }]);
    return new Response(
      '<Response><Message>You have been opted back in and will receive messages again.</Message></Response>',
      {
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  }

  // Reply mapping: find the most recent sent message for this phone
  const { data: sentMsg } = await supabase
    .from('sent_messages')
    .select('event_id, from_user_id')
    .eq('to_phone', fromPhone)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (!sentMsg) {
    return NextResponse.json(
      { error: 'Could not find sent message for this reply' },
      { status: 404 }
    );
  }

  // Forward the reply to the sender (event creator)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone')
    .eq('id', sentMsg.from_user_id)
    .single();

  if (!sentMsg || profileError || !profile || !profile.phone) {
    return new Response(`<Response><Message>You said: ${body}</Message></Response>`, {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  try {
    let forwardTo = profile.phone;
    let forwardFrom = to?.toString() || process.env.TWILIO_PHONE_NUMBER!;
    if (from.toString().startsWith('whatsapp:')) {
      forwardTo = `whatsapp:${profile.phone.replace(/[^\d+]/g, '')}`;
      forwardFrom = 'whatsapp:+14155238886';
    }
    await client.messages.create({
      to: forwardTo,
      from: forwardFrom,
      body: `Reply from ${from}: ${body}`,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    // Log the error but do not return here to allow fallback to execute
    console.error('Failed to forward reply:', err);
  }

  // Fallback response for unhandled messages
  return new Response(`<Response><Message>You said: ${body}</Message></Response>`, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
