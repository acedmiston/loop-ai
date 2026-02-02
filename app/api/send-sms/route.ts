import { NextResponse } from 'next/server';
import client, {
  getWhatsAppFromNumber,
  getStatusCallbackUrl,
  getWhatsAppContentTemplateSid,
} from '@/lib/twilio';

export async function POST(req: Request) {
  const { to, body, channel } = await req.json();

  if (!to || !body) {
    return NextResponse.json({ error: 'Missing phone number or message body' }, { status: 400 });
  }

  try {
    const isWhatsApp =
      channel === 'whatsapp' || (typeof to === 'string' && to.startsWith('whatsapp:'));
    const from = isWhatsApp ? getWhatsAppFromNumber() : process.env.TWILIO_PHONE_NUMBER!;
    const statusCallback = getStatusCallbackUrl();
    const contentSid = isWhatsApp ? getWhatsAppContentTemplateSid() : undefined;

    // Log the request details (without exposing sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.log('[send-sms] Sending message to:', to, 'via', channel, contentSid ? '(content template)' : '');
    }

    // For WhatsApp: use Content Template when configured (required for business-initiated / outside 24hr window)
    let message;
    if (isWhatsApp && contentSid) {
      // Use approved Content Template (event_update: "LooP Update: {{1}} Reply STOP to opt out.")
      message = await client.messages.create({
        to,
        from,
        contentSid,
        contentVariables: JSON.stringify({ 1: body }), // Variable {{1}} in template
        statusCallback,
      });
    } else if (isWhatsApp) {
      // No template configured: try freeform (works only within 24-hour window)
      try {
        message = await client.messages.create({
          to,
          from,
          body,
          statusCallback,
        });
      } catch (freeformError: any) {
        if (freeformError?.code === 63016) {
          throw new Error(
            'WhatsApp requires a Content Template for business-initiated messages. ' +
              'Add TWILIO_WHATSAPP_CONTENT_SID (your event_update template SID) to your environment. ' +
              'Create templates in Twilio Console > Content Template Builder.'
          );
        }
        throw freeformError;
      }
    } else {
      // Regular SMS - no template needed
      message = await client.messages.create({
        to,
        from,
        body,
        statusCallback,
      });
    }

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error: any) {
    console.error('[send-sms]', error);

    // Provide more specific error messages
    if (error?.code === 20003) {
      return NextResponse.json(
        {
          error:
            'Twilio authentication failed. Please check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.',
          details: 'Error 20003: Invalid credentials provided',
        },
        { status: 401 }
      );
    }

    if (error?.code === 21211) {
      return NextResponse.json(
        {
          error:
            'Invalid phone number format. For WhatsApp, ensure the number is in E.164 format (e.g., whatsapp:+1234567890)',
          details: error.message,
        },
        { status: 400 }
      );
    }

    if (error?.code === 63016) {
      return NextResponse.json(
        {
          error:
            "WhatsApp messaging window expired. You can only send freeform messages within 24 hours of the recipient's last message. For initial messages, you must use a pre-approved WhatsApp Message Template.",
          details:
            'Error 63016: Outside the 24-hour messaging window. Use Message Templates for initial messages.',
          code: 63016,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to send SMS/WhatsApp',
        details: error?.message || 'Unknown error',
        code: error?.code,
      },
      { status: 500 }
    );
  }
}
