import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET: Fetch all contacts for the authenticated user
export async function GET() {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Fetch contacts created by this user
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('created_by', user.id)
    .order('first_name');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }

  return NextResponse.json({ guests: data });
}

// POST: Add a new contact for the authenticated user
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { first_name, last_name, phone } = await req.json();

  if (!first_name || !phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Basic phone format validation (digits only, optionally with +)
  const isPhoneValid = /^\+?[0-9]{10,15}$/.test(phone);
  if (!isPhoneValid) {
    return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
  }

  // Get the current user for created_by
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Check for existing contact with same phone for this user
  const { data: existing } = await supabase
    .from('guests')
    .select('id')
    .eq('phone', phone)
    .eq('created_by', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Contact with this phone number already exists' },
      { status: 400 }
    );
  }

  // Insert the new contact (no event_id)
  const { data, error } = await supabase
    .from('guests')
    .insert([{ first_name, last_name, phone, created_by: user.id }])
    .select()
    .single();

  if (error) {
    console.error('[Add Contact] Supabase Error:', error);
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 });
  }

  return NextResponse.json({ success: true, guest: data });
}

// DELETE: Remove a contact by phone number
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const phone = url.searchParams.get('phone');

  if (!phone) {
    return NextResponse.json(
      { success: false, error: 'Phone number is required' },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('guests').delete().eq('phone', phone);

  if (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contact' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
