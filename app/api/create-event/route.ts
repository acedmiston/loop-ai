import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { title, date, time, tone, input, guests, messageMode, message, personalizedMessages } =
    await req.json();

  // Validate required fields for both modes
  if (
    !title ||
    !tone ||
    !input ||
    !Array.isArray(guests) ||
    guests.length === 0 ||
    (messageMode === 'group' && !message) ||
    (messageMode === 'single' && (!personalizedMessages || personalizedMessages.length === 0))
  ) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const eventId = uuidv4();

  // Insert the event
  const { error: eventError } = await supabase.from('events').insert([
    {
      id: eventId,
      title,
      date,
      time,
      tone,
      message:
        messageMode === 'group'
          ? message
          : personalizedMessages && personalizedMessages.length > 0
            ? personalizedMessages[0].message
            : '',
      input,
      created_by: user.id,
    },
  ]);

  if (eventError) {
    console.error('[create-event] Event insert error:', eventError);
    return NextResponse.json({ error: 'Failed to save event' }, { status: 500 });
  }

  // Look up guest IDs for the selected phone numbers
  const { data: guestRows, error: guestLookupError } = await supabase
    .from('guests')
    .select('id')
    .in('phone', guests)
    .eq('created_by', user.id);

  if (guestLookupError) {
    return NextResponse.json({ error: 'Failed to look up guests' }, { status: 500 });
  }

  // Insert into event_guests join table
  const eventGuestInserts = (guestRows || []).map(g => ({
    event_id: eventId,
    guest_id: g.id,
  }));

  if (eventGuestInserts.length > 0) {
    const { error: eventGuestError } = await supabase
      .from('event_guests')
      .insert(eventGuestInserts);

    if (eventGuestError) {
      return NextResponse.json({ error: 'Failed to associate guests' }, { status: 500 });
    }
  }

  // Optionally, store personalizedMessages in a separate table or send notifications here

  return NextResponse.json({ success: true, eventId });
}
