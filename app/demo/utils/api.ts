interface RetryConfig {
  maxRetries?: number;
  delayMs?: number;
  backoffFactor?: number;
}

export async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  config: RetryConfig = {}
): Promise<Response> {
  const { 
    maxRetries = 3, 
    delayMs = 1000, 
    backoffFactor = 2 
  } = config;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Only retry on 5xx errors or network failures
      if (response.status < 500) {
        return response;
      }
      
      lastError = new Error(`Server error: ${response.status} ${response.statusText}`);
    } catch (error: any) {
      lastError = error;
    }

    // Don't wait after the last attempt
    if (attempt < maxRetries - 1) {
      const delay = delayMs * Math.pow(backoffFactor, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

export async function generatePresentation(messages: any[]) {
  const response = await fetchWithRetry('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages })
  }, {
    maxRetries: 3,
    delayMs: 1000,
    backoffFactor: 2
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle specific error cases
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    if (response.status === 503) {
      throw new Error('AI service is temporarily unavailable. Please try again later.');
    }
    if (response.status === 422) {
      throw new Error('Failed to generate valid presentation format. Please try rephrasing your request.');
    }
    
    throw new Error(errorData.error || 'Failed to generate presentation');
  }

  const data = await response.json();
  
  if (!data.text) {
    throw new Error('Invalid response format from server');
  }

  return data.text;
}

export function sanitizePrompt(prompt: string): string {
  // Remove any special formatting that might interfere with the presentation format
  return prompt
    .replace(/^Title:/gmi, 'Section:') // Avoid confusion with slide titles
    .replace(/^Style:/gmi, 'Type:')    // Avoid confusion with slide styles
    .replace(/^Data:/gmi, 'Info:')     // Avoid confusion with data slides
    .replace(/^[•\-*]\s*/gm, '')       // Remove existing bullet points
    .trim();
}
