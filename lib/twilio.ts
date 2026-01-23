import twilio from 'twilio';

// Validate that Twilio credentials are set
const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

if (!accountSid || !authToken) {
  console.error('Missing Twilio credentials:');
  console.error('TWILIO_ACCOUNT_SID:', accountSid ? '✓ Set' : '✗ Missing');
  console.error('TWILIO_AUTH_TOKEN:', authToken ? '✓ Set' : '✗ Missing');
  throw new Error(
    'Twilio credentials are not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.'
  );
}

const client = twilio(accountSid, authToken);

/**
 * Get the WhatsApp sender number, formatted with whatsapp: prefix
 */
export function getWhatsAppFromNumber(): string {
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';
  return `whatsapp:${whatsappNumber.replace(/^whatsapp:/, '')}`;
}

/**
 * Get the status callback URL for Twilio webhooks
 */
export function getStatusCallbackUrl(): string {
  return `${process.env.NEXT_PUBLIC_BASE_URL || 'https://loop-ai-five.vercel.app'}/api/twilio-status-callback`;
}

export default client;
