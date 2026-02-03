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
 * Normalize phone to E.164 for WhatsApp (digits only, + prefix).
 * Handles US numbers: 10 digits -> +1XXXXXXXXXX, 11 digits starting with 1 -> +1XXXXXXXXXX
 */
export function toE164WhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits.startsWith('+') ? phone : `+${digits}`;
}

/**
 * Get the WhatsApp sender number, formatted with whatsapp: prefix.
 * Use +14155238886 for Twilio Sandbox.
 */
export function getWhatsAppFromNumber(): string {
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';
  const normalized = toE164WhatsApp(whatsappNumber.replace(/^whatsapp:/, ''));
  return `whatsapp:${normalized}`;
}

/**
 * Get the status callback URL for Twilio webhooks
 */
export function getStatusCallbackUrl(): string {
  return `${process.env.NEXT_PUBLIC_BASE_URL || 'https://loop-ai-five.vercel.app'}/api/twilio-status-callback`;
}

/**
 * Get the Content Template SID for WhatsApp (event_update template).
 * Templates created in the Twilio Content Template Builder are required for
 * WhatsApp business-initiated messages and for messages outside the 24-hour window.
 * @see https://www.twilio.com/docs/content/overview
 */
export function getWhatsAppContentTemplateSid(): string | undefined {
  return process.env.TWILIO_WHATSAPP_CONTENT_SID?.trim() || undefined;
}

/**
 * Get the Messaging Service SID (MG...) if configured.
 * Twilio docs recommend using a Messaging Service when sending Content Templates.
 * Create one at: Twilio Console > Messaging > Services
 * Add your WhatsApp sender to the Sender Pool.
 */
export function getMessagingServiceSid(): string | undefined {
  return process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() || undefined;
}

export default client;
