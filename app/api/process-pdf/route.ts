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
          content: `Analyze and format this text into a well-structured document optimized for PDF presentation. Format each logical section using appropriate markers and ensure content is organized for optimal readability.

Content Analysis Instructions:
1. Detect and Format Structure:
   - Main sections -> Use [H1]Title[/H1]
   - Subsections -> Use [H2]Subtitle[/H2]
   - Regular text -> No special markers needed
   - Important points -> Use [CALLOUT]Key information[/CALLOUT]

2. Identify and Format Lists:
   - For bullet points -> Use [LIST]item1|item2|item3[/LIST]
   - For numbered steps -> Use [STEPS]step1|step2|step3[/STEPS]
   - For data tables -> Use [TABLE]
     header1,header2,header3
     value1,value2,value3
     [/TABLE]

3. Page Organization:
   - Keep related content together
   - Start new sections with headers
   - Use '---PAGE_BREAK---' for natural content breaks
   - Aim for 300-400 words per page for better readability
   - Each page should be self-contained and complete
   - Add page breaks before major sections
   - Ensure no section is split across pages unless necessary

4. Content Enhancement:
   - Convert bullet lists into [LIST] format
   - Convert numbered lists into [STEPS] format
   - Add descriptive headers where appropriate
   - Structure hierarchical information clearly
   - Break long paragraphs into smaller, digestible chunks

Here's the text to analyze and format:

${text}

Important:
- Maintain logical content flow
- Use format markers consistently
- Create clear content hierarchy
- Add page breaks at natural transitions
- Ensure each page has a clear purpose
- Don't split sections mid-thought
- Keep related content on the same page`
        }],
        max_tokens: 4000,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    const formattedPages = data.content[0].text
      .split('---PAGE_BREAK---')
      .map((page: string) => page.trim())
      .filter((page: string) => page.length > 0)
      // Ensure each page starts with a header if it doesn't have one
      .map((page: string, index: number) => {
        if (!page.includes('[H1]') && !page.includes('[H2]')) {
          return `[H1]Page ${index + 1}[/H1]\n\n${page}`;
        }
        return page;
      });

    return NextResponse.json({ formattedText: formattedPages });
  } catch (error: any) {
    console.error('PDF Processing Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process PDF text' },
      { status: 500 }
    );
  }
}
