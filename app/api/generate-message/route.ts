import { NextResponse } from 'next/server';
import openai from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { input, tone } = await req.json();

    if (!input) {
      console.error('Missing input in request body');
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }

    const prompt = `
    You are a helpful assistant that writes short, ${tone || 'casual'} text messages for someone who needs to notify their friends about an event or a change in plans.    
    
    Write a single text message based on the structured event details below. It should sound natural and casual like a real SMS or iMessage (not like an email or formal invite). Use contractions, emojis, and a light tone. The message should either be addressed to "friends" or left generic—no formal greetings or signatures.
    
    Event Details:
    ${input}
    
    Text Message:
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
      max_tokens: 120,
      temperature: 0.7,
    });

    const message = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({ message });
  } catch (error) {
    console.error('[generate-message ERROR]', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
