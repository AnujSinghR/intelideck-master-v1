import { Slide, slideStyles } from "../types";

function normalizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")   // Normalize smart quotes
    .replace(/[\u201C\u201D]/g, '"')   // Normalize smart quotes
    .replace(/\u2022/g, '•')           // Normalize bullet points
    .replace(/[\u2013\u2014]/g, '-')   // Normalize dashes
    .replace(/\r\n/g, '\n')            // Normalize line endings
    .trim();
}

function extractStyle(lines: string[]): { style: Slide['style'], styleLineIndex: number } {
  // Look for style in first few lines (being flexible about position)
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('style:')) {
      const styleMatch = line.match(/style:\s*(\w+)/i);
      if (styleMatch) {
        const style = styleMatch[1].toLowerCase();
        if (['title', 'section', 'content', 'quote', 'data'].includes(style)) {
          return { style: style as Slide['style'], styleLineIndex: i };
        }
      }
    }
  }

  // If no style found, infer from content
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('introduction') || 
      firstLine.includes('overview') || 
      firstLine.includes('agenda')) {
    return { style: 'title', styleLineIndex: -1 };
  }
  
  if (firstLine.includes('summary') || 
      firstLine.includes('conclusion') || 
      firstLine.includes('key points')) {
    return { style: 'section', styleLineIndex: -1 };
  }

  if (firstLine.includes('statistics') || 
      firstLine.includes('metrics') || 
      firstLine.includes('numbers')) {
    return { style: 'data', styleLineIndex: -1 };
  }

  if (firstLine.includes('quote') || 
      firstLine.includes('saying') || 
      lines.some(l => l.includes('"') || l.includes('"'))) {
    return { style: 'quote', styleLineIndex: -1 };
  }
  
  return { style: 'content', styleLineIndex: -1 }; // Default to content style
}

function extractDataType(lines: string[], styleLineIndex: number): Slide['dataType'] {
  // Look for data type after style line
  const startIndex = styleLineIndex > -1 ? styleLineIndex + 1 : 0;
  for (let i = startIndex; i < Math.min(lines.length, startIndex + 2); i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('data:')) {
      const dataMatch = line.match(/data:\s*(\w+)/i);
      if (dataMatch) {
        const dataType = dataMatch[1].toLowerCase();
        if (['chart', 'comparison', 'statistics'].includes(dataType)) {
          return dataType as Slide['dataType'];
        }
      }
    }
  }

  // Infer data type from content if not explicitly specified
  const content = lines.join(' ').toLowerCase();
  if (content.includes('chart') || content.includes('graph')) return 'chart';
  if (content.includes('compar') || content.includes('versus') || content.includes('vs')) return 'comparison';
  if (content.includes('statistic') || content.includes('metric') || content.includes('%')) return 'statistics';
  
  return 'statistics'; // Default for data slides
}

function convertParagraphToBullets(text: string): string[] {
  // Split into sentences and convert to bullet points
  return text
    .split(/[.!?](?=\s|$)/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0)
    .map(sentence => {
      // Clean up the sentence
      sentence = sentence
        .replace(/^[-•*]\s+/, '')  // Remove existing bullet points
        .replace(/^\d+\.\s+/, '')  // Remove numbering
        .replace(/^[a-zA-Z]\)\s+/, '') // Remove letter lists
        .trim();
      
      // Ensure sentence starts with capital letter
      return sentence.charAt(0).toUpperCase() + sentence.slice(1);
    });
}

function extractContent(lines: string[], styleLineIndex: number, dataTypePresent: boolean): string[] {
  // Skip title, style, and data type lines
  const startIndex = Math.max(
    styleLineIndex > -1 ? styleLineIndex + 1 : 1,
    dataTypePresent ? styleLineIndex + 2 : styleLineIndex + 1
  );

  // First try to find explicit bullet points
  let content = lines
    .slice(startIndex)
    .filter(line => line.trim())
    .filter(line => 
      line.includes('•') || 
      line.match(/^\d+\.\s+/) ||
      line.match(/^[-*]\s+/) ||
      line.match(/^[a-zA-Z]\)\s+/)
    )
    .map(line => {
      return line
        .replace(/^[-•*]\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .replace(/^[a-zA-Z]\)\s+/, '')
        .trim();
    })
    .filter(line => line.length > 0);

  // If no bullet points found, try to extract from paragraphs
  if (content.length === 0) {
    const paragraphs = lines
      .slice(startIndex)
      .filter(line => line.trim())
      .filter(line => 
        !line.toLowerCase().includes('title:') &&
        !line.toLowerCase().includes('style:') &&
        !line.toLowerCase().includes('data:')
      )
      .join(' ');
    
    content = convertParagraphToBullets(paragraphs);
  }

  // If still no content, create a generic bullet point
  if (content.length === 0) {
    content = ['Key points to be discussed'];
  }

  return content;
}

export function parseSlides(text: string): Slide[] {
  // Normalize and split into slides
  const normalizedText = normalizeText(text);
  const slideTexts = normalizedText.split('\n\n').filter(text => 
    text.trim() && (
      text.toLowerCase().includes('title:') ||
      text.match(/^(section|slide)\s*\d*:?/im)
    )
  );

  if (slideTexts.length === 0) {
    // If no slides found, try to create one from the entire text
    const lines = normalizedText.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const title = lines[0].replace(/^(title:|section:|slide:?)/i, '').trim() || 'Overview';
      const content = extractContent(lines, 0, false);
      return [{
        title,
        content,
        style: 'content',
        bgColor: slideStyles.content.bg,
        textColor: slideStyles.content.text
      }];
    }
    throw new Error('No valid content found in the response');
  }

  return slideTexts.map((slideText: string, index: number) => {
    const lines = slideText.split('\n').filter(line => line.trim());
    
    // Extract title (being flexible about format)
    const titleLine = lines[0]
      .replace(/^(title:|section:|slide\s*\d*:?)/i, '')
      .trim() || `Slide ${index + 1}`;

    // Extract and validate style
    const { style, styleLineIndex } = extractStyle(lines);

    // Extract data type if it's a data slide
    const dataType = style === 'data' ? extractDataType(lines, styleLineIndex) : undefined;
    const hasDataType = dataType !== undefined;

    // Extract content
    const content = extractContent(lines, styleLineIndex, hasDataType);

    return {
      title: titleLine,
      content,
      style,
      dataType,
      bgColor: slideStyles[style].bg,
      textColor: slideStyles[style].text
    };
  });
}
