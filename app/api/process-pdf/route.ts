import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Anthropic API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { text } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: [{
          role: 'user',
          content: `Please organize and structure the following extracted PDF text into well-formatted pages. Each page should be clearly separated and organized with proper paragraphs, headings, and sections where appropriate. Here's the text:\n\n${text}`
        }],
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ 
      formattedText: data.content[0].text 
    });
  } catch (error: any) {
    console.error('PDF Processing Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process PDF text' },
      { status: 500 }
    );
  }
}
