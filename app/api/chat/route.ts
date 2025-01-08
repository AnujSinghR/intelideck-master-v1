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
       system: "You are a presentation expert. When asked to create a presentation, respond with a well-structured outline. Each section should start with a clear title (like 'Introduction', 'Key Points', etc.) followed by bullet points. Format your response with clear line breaks between sections.",
       messages: messages.map((msg: any) => ({
         role: msg.role === 'user' ? 'user' : 'assistant',
         content: msg.content
       })),
       max_tokens: 4000,
       temperature: 0.7
     }),
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
