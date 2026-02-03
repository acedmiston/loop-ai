import { NextResponse } from 'next/server';
import client, {
  getWhatsAppFromNumber,
  getStatusCallbackUrl,
  getWhatsAppContentTemplateSid,
  getMessagingServiceSid,
  toE164WhatsApp,
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
    const messagingServiceSid = isWhatsApp ? getMessagingServiceSid() : undefined;

    // Normalize recipient to E.164 (Twilio requires E.164; WhatsApp: whatsapp:<E.164>)
    const toRaw = typeof to === 'string' ? to.replace(/^whatsapp:/, '') : String(to);
    const toNormalized = isWhatsApp ? `whatsapp:${toE164WhatsApp(toRaw)}` : toE164WhatsApp(toRaw);

    // Log the request details (without exposing sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '[send-sms] Sending message to:',
        toNormalized,
        'via',
        channel,
        contentSid ? '(content template)' : ''
      );
    }

    // For WhatsApp: use Content Template when configured (required for business-initiated / outside 24hr window)
    let message;
    if (isWhatsApp && contentSid) {
      // WhatsApp Content Variables: no newlines, no tabs, max 4 consecutive spaces, max 255 chars per variable
      // @see https://www.twilio.com/docs/content/using-variables-with-content-api
      const sanitizedBody = body
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/ {5,}/g, '    ')
        .trim()
        .slice(0, 255);
      if (!sanitizedBody) {
        return NextResponse.json(
          {
            error: 'Message body is empty after sanitization',
            details: 'WhatsApp template variables cannot contain only whitespace',
          },
          { status: 400 }
        );
      }
      // Per Twilio docs: include MessagingServiceSid when sending Content Templates for best compatibility
      const templateParams = {
        from,
        to: toNormalized,
        contentSid,
        contentVariables: JSON.stringify({ '1': sanitizedBody }),
        statusCallback,
        ...(messagingServiceSid ? { messagingServiceSid } : {}),
      };
      message = await client.messages.create(templateParams);
    } else if (isWhatsApp) {
      // No template configured: try freeform (works only within 24-hour window)
      try {
        message = await client.messages.create({
          to: toNormalized,
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
        to: toNormalized,
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

    if (error?.code === 63027) {
      return NextResponse.json(
        {
          error: 'Template does not exist for this language/locale or sender.',
          details:
            'Error 63027: Ensure TWILIO_WHATSAPP_CONTENT_SID matches your approved event_update template. ' +
            'The template must be approved for the WhatsApp number you are sending from. ' +
            'Variables cannot contain newlines—messages are sanitized automatically.',
          code: 63027,
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
