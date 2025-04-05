import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const searchQuery = url.searchParams.get('search') || '';

  const query = supabase
    .from('guests')
    .select('*')
    .order('first_name')
    .ilike('first_name', `%${searchQuery}%`)
    .or(`ilike(last_name, '%${searchQuery}%')`)
    .or(`ilike(first_name || ' ' || last_name, '%${searchQuery}%')`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 });
  }

  return NextResponse.json({ guests: data });
}

export async function POST(req: Request) {
  const { first_name, last_name, phone } = await req.json();

  if (!first_name || !phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Basic phone format validation (digits only, optionally with +)
  const isPhoneValid = /^\+?[0-9]{10,15}$/.test(phone);
  if (!isPhoneValid) {
    return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
  }

  // Check for existing guest with same phone
  const { data: existing } = await supabase
    .from('guests')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Guest with this phone number already exists' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('guests')
    .insert([{ first_name, last_name, phone }])
    .select()
    .single();

  if (error) {
    console.error('[Add Guest] Supabase Error:', error);
    return NextResponse.json({ error: 'Failed to add guest' }, { status: 500 });
  }

  return NextResponse.json({ success: true, guest: data });
}
