import { NextResponse } from 'next/server';
import openai from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { message, eventDetails, tone, location, displayTime, displayDate, personalize } =
      await req.json();

    const eventBlock = eventDetails?.trim() || message?.trim();
    if (!eventBlock) {
      console.error('Missing event details or message in request body');
      return NextResponse.json(
        { error: 'Event details or message is required' },
        { status: 400 }
      );
    }

    const selectedTone = tone || 'friendly';
    let prompt = `
    You are a helpful assistant that writes short text messages for someone inviting their friends to an event. Only use an apologetic or "change in plans" tone if the event details clearly indicate a cancellation, reschedule, or change of plans.
    
    Use the selected tone: ${selectedTone}. Do not default to apologetic unless the details explicitly suggest a change or cancellation.
    
    Write a single text message based on the structured event details below. It should sound natural like a real SMS or iMessage (not like an email or formal invite). Use contractions, emojis, and a light tone when appropriate.
    `;

    if (personalize || eventBlock.includes('Guest Name:')) {
      prompt += `\n\nPersonalize the message for each guest by including their first name at the start of the message using the placeholder [Name]. For example: 'Hi [Name], ...'. Do not use any other greeting or signature. Only use the placeholder, do not use a real name.`;
    } else {
      prompt += `\n\nThe message should either be addressed to "friends" or left generic—no formal greetings or signatures.`;
    }

    if (displayDate) {
      prompt += `\n\nWhen mentioning the event date, use this exact format: ${displayDate}. Do not reformat it.`;
    }
    if (displayTime) {
      prompt += `\n\nWhen mentioning the event time, use this exact format: ${displayTime}. Do not reformat it.`;
    }
    prompt += `\n\nWhen the event details include an End Date different from the start date, mention both dates in the message (e.g. "Tuesday 8pm to Wednesday 2am").`;

    prompt += `
    
    Event Details:
    ${eventBlock}${location ? `\nLocation: ${location}` : ''}
    
    Text Message:
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      max_tokens: 120,
      temperature: 0.7,
    });

    const messageResponse = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({ message: messageResponse });
  } catch (error) {
    console.error('[generate-message ERROR]', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}