import { NextResponse } from 'next/server';

function validateSlideFormat(text: string): boolean {
  // Normalize text
  const normalizedText = text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2022/g, '•')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\r\n/g, '\n')
    .trim();

  // Split into potential slides
  const slides = normalizedText.split('\n\n').filter(s => s.trim());
  
  // Must have at least one slide-like section
  if (slides.length === 0) return false;

  // Check if we have any valid slide-like content
  return slides.some(slide => {
    const lines = slide.split('\n').filter((line: string) => line.trim());
    if (lines.length < 2) return false; // Need at least title and content

    // Check for title-like first line
    const hasTitle = lines[0].toLowerCase().includes('title:') ||
                    lines[0].match(/^(section|slide)\s*\d*:?/i);
    if (!hasTitle) return false;

    // Check for any content after title
    const hasContent = lines.slice(1).some((line: string) => 
      line.trim() && 
      !line.toLowerCase().includes('style:') && 
      !line.toLowerCase().includes('data:')
    );

    return hasContent;
  });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Anthropic API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json();

    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request format: messages must be a non-empty array' },
        { status: 400 }
      );
    }

    // Ensure each message has required fields
    const validMessages = messages.every(msg => 
      msg && typeof msg === 'object' && 
      ['user', 'assistant'].includes(msg.role) && 
      typeof msg.content === 'string'
    );

    if (!validMessages) {
      return NextResponse.json(
        { error: 'Invalid message format: each message must have role and content' },
        { status: 400 }
      );
    }

    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': process.env.ANTHROPIC_API_KEY
        },
        body: JSON.stringify({
          model: 'claude-2.1',
          system: `You are a presentation expert specializing in creating modern, engaging presentations. Create a structured presentation following these guidelines:

1. Basic Structure:
- Each slide should be separated by blank lines
- Start each slide with "Title: [Slide Title]"
- Include "Style: [style]" where style can be: title, section, content, quote, or data
- For data slides, include "Data: [type]" where type can be: chart, comparison, or statistics
- Use bullet points (•) or numbered lists for content

2. Content Guidelines:
- Keep points clear and concise
- Use complete sentences
- Group related information
- Include relevant data and examples
- Maintain consistent formatting

Example Formats:

Title: Digital Strategy Overview
Style: title
• Transforming Business Through Innovation
• Driving Growth and Efficiency
• Building Future-Ready Solutions
• Maximizing Digital Potential

Title: Market Analysis
Style: data
Data: statistics
• Market size reached $500B in 2023
• 45% year-over-year growth
• Key sectors: Technology (40%), Finance (30%)
• Projected 2024 growth: 25%

Title: Implementation Steps
Style: content
1. Assess current capabilities
2. Define strategic objectives
3. Develop action plan
4. Build team structure
5. Monitor progress

You can also use regular paragraphs, and I will format them into presentation points.`,
          messages: messages.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          max_tokens: 4000,
          temperature: 0.7
        })
      });
    } catch (fetchError: any) {
      console.error('API Fetch Error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to connect to AI service. Please try again.' },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || `API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('API Response Parse Error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse API response' },
        { status: 500 }
      );
    }

    if (!data.content || !Array.isArray(data.content) || !data.content[0]?.text) {
      console.error('Invalid API Response Format:', data);
      return NextResponse.json(
        { error: 'Invalid response format from API' },
        { status: 500 }
      );
    }

    const generatedText = data.content[0].text;

    // Validate the response format
    if (!validateSlideFormat(generatedText)) {
      console.error('Invalid slide format received:', generatedText);
      
      // Try to extract any usable content
      const lines = generatedText.split('\n').filter((line: string) => line.trim());
      if (lines.length > 0) {
        // Create a basic slide structure
        const formattedText = `Title: ${lines[0]}\nStyle: content\n\n` + 
          lines.slice(1).map((line: string) => `• ${line}`).join('\n');
        return NextResponse.json({ text: formattedText });
      }
      
      return NextResponse.json(
        { error: 'Failed to generate valid presentation content. Please try again with a different prompt.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: generatedText });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process request',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
