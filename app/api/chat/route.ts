import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Anthropic API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY
      },
      body: JSON.stringify({
        model: 'claude-2.1',
        system: `You are a presentation expert specializing in creating modern, engaging presentations. Format your responses as a structured presentation with the following rules:

1. Slide Structure:
- Each slide separated by two newlines
- Start with 'Title: [Slide Title]'
- Use '• ' for bullet points
- Include 'Style: [style]' after title to specify slide style (title, section, content, quote, data)
- For data slides, include 'Data: [type]' (chart, comparison, statistics)

2. Content Guidelines:
- Keep 4-6 bullet points per slide for readability
- Use clear, concise language
- Include engaging hooks and transitions
- Balance text with visual suggestions
- Group related content into sections

Example format:

Title: Transforming Ideas Into Reality
Style: title
• Your journey starts here
• Innovation meets execution
• Building the future together

Title: Market Overview
Style: data
Data: chart
• Market size: $50B by 2025
• 45% YoY growth rate
• Key segments: Enterprise (60%), SMB (30%), Consumer (10%)
• Emerging trends in AI and automation

Title: Strategic Approach
Style: content
• Implement data-driven decision making
• Foster cross-functional collaboration
• Leverage cutting-edge technologies
• Maintain agile methodology`,
        messages: messages.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.content || !Array.isArray(data.content) || !data.content[0]?.text) {
      throw new Error('Invalid response format from API');
    }

    return NextResponse.json({ text: data.content[0].text });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
