import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  // Twilio sends data as application/x-www-form-urlencoded
  const formData = await req.formData();
  const messageSid = formData.get('MessageSid');
  const messageStatus = formData.get('MessageStatus');
  const errorCode = formData.get('ErrorCode');
  const errorMessage = formData.get('ErrorMessage');

  if (!messageSid || !messageStatus) {
    return NextResponse.json({ error: 'Missing MessageSid or MessageStatus' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const update: any = {
    status: messageStatus,
    delivery_status_updated_at: new Date().toISOString(),
  };
  if (errorCode) update.error_code = errorCode;
  if (errorMessage) update.error_message = errorMessage;

  await supabase.from('sent_messages').update(update).eq('twilio_sid', messageSid.toString());

  return NextResponse.json({ success: true });
}
