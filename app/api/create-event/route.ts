import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  const { tone, message, guests, title, date, time } = await req.json();

  if (!title || !tone || !message || !Array.isArray(guests)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (guests.length === 0) {
    return NextResponse.json({ error: 'At least one guest must be selected.' }, { status: 400 });
  }

  const eventId = uuidv4();

  const { error: eventError } = await supabase.from('events').insert([
    {
      id: eventId,
      title,
      date,
      time,
      tone,
      message,
    },
  ]);

  if (eventError) {
    console.error('[create-event] Event insert error:', eventError);
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 });
  }

  const guestInserts = guests.map((phone: string) => ({
    event_id: eventId,
    phone,
  }));

  const { error: guestError } = await supabase.from('guests').insert(guestInserts);

  if (guestError) {
    console.error('[create-event] Guest insert error:', guestError);
    return NextResponse.json({ error: 'Failed to save guests' }, { status: 500 });
  }

  return NextResponse.json({ success: true, eventId });
}
