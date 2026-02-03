This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

Copy `.env.example` to `.env.local` and fill in your values.

### Twilio Content Template (WhatsApp)

For WhatsApp messaging, you must use an approved [Content Template](https://www.twilio.com/docs/content/overview) from the Twilio Content Template Builder. The `event_update` template is required for business-initiated messages and messages outside the 24-hour reply window.

1. Create or use an approved template in **Twilio Console > Content Template Builder**
2. Copy the **Content Template SID** (starts with `HX`)
3. Set `TWILIO_WHATSAPP_CONTENT_SID` in your `.env.local`

The default `event_update` template format: `LooP Update: {{1}} Reply STOP to opt out.` — variable `{{1}}` is filled with your message.

### Messaging Service (recommended for Content Templates)

Twilio docs recommend using a [Messaging Service](https://www.twilio.com/docs/messaging/services) when sending Content Templates:

1. Go to **Twilio Console > Messaging > Services**
2. Create a new Messaging Service (or use existing)
3. In **Sender Pool**, add your WhatsApp number (+14155238886 for sandbox)
4. Copy the Messaging Service SID (starts with `MG`)
5. Set `TWILIO_MESSAGING_SERVICE_SID` in your `.env.local`

### WhatsApp Sandbox (testing)

When using the [Twilio Sandbox for WhatsApp](https://www.twilio.com/docs/whatsapp/sandbox):

1. Set `TWILIO_WHATSAPP_NUMBER=+14155238886` (or omit it; this is the default)
2. Recipients must send the sandbox join phrase to the sandbox number before they can receive messages
3. See [Twilio Console > Messaging > Try it out > Send a WhatsApp message](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn) for the join instructions

**Error 63027?** Your custom template may not be approved for the sandbox. Either add a Messaging Service (above) or try your own WhatsApp number (+15557509381) if `event_update` is approved for that sender.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
