import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { model, messages, response_format } = await req.body ? await req.json() : {};
    
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured on server' }, { status: 500 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages,
        response_format
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('OpenAI Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
