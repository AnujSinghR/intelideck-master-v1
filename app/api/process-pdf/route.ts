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
          content: `Please analyze and format the following text into well-organized sections that will be rendered on A4 pages. Each section should be marked with '---PAGE_BREAK---'.

Important guidelines:
1. Each section should be sized appropriately for an A4 page (approximately 500-600 words with standard margins)
2. Break content at natural topic transitions
3. Use clear paragraph breaks for readability
4. Add section headings where appropriate
5. Keep paragraphs concise and well-structured
6. Ensure each section can stand alone while maintaining flow
7. Mark each section with '---PAGE_BREAK---'

Here's the text to process:

${text}

Remember:
- Size sections appropriately for A4 pages
- Use clear paragraph breaks
- Mark sections with '---PAGE_BREAK---'`
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
      formattedText: data.content[0].text.split('---PAGE_BREAK---').map((page: string) => page.trim()).filter((page: string) => page.length > 0)
    });
  } catch (error: any) {
    console.error('PDF Processing Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process PDF text' },
      { status: 500 }
    );
  }
}
