import JSZip from 'jszip';

export interface SlideData {
  text: string;
  images: string[];
}

export class PPTExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PPTExtractionError';
  }
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

export const validateFile = (file: File): void => {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new PPTExtractionError('Invalid file type. Please upload a .pptx file.');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new PPTExtractionError('File size exceeds 50MB limit.');
  }
};

const sanitizeText = (text: string): string => {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const extractPptData = async (file: File): Promise<SlideData[]> => {
  try {
    validateFile(file);
    
    const zip = new JSZip();
    const pptx = await zip.loadAsync(file);

    const slides: SlideData[] = [];
    const slideRegex = /^ppt\/slides\/slide(\d+).xml$/;
    const slideEntries = Object.entries(pptx.files).filter(([path]) => slideRegex.test(path));

    if (slideEntries.length === 0) {
      throw new PPTExtractionError('No slides found in the presentation.');
    }

    for (const [path, fileObj] of slideEntries) {
      try {
        const content = await fileObj.async('text');

        // Extract and sanitize text
        const textMatches = Array.from(content.matchAll(/<a:t>(.*?)<\/a:t>/g));
        const text = sanitizeText(textMatches.map((match) => match[1]).join(' ').trim());

        // Extract images
        const imagePaths: string[] = [];
        const relsPath = path.replace('slides/slide', '_rels/slides/slide').replace('.xml', '.xml.rels');
        
        if (pptx.files[relsPath]) {
          const relsContent = await pptx.files[relsPath].async('text');
          const imageMatches = Array.from(relsContent.matchAll(/Target="([^"]+?)"/g));
          
          for (const imgMatch of imageMatches) {
            const imgPath = imgMatch[1].startsWith('/') ? imgMatch[1].substring(1) : imgMatch[1];
            
            if (pptx.files[imgPath]) {
              try {
                const imgBlob = new Blob([await pptx.files[imgPath].async('arraybuffer')]);
                const imgUrl = URL.createObjectURL(imgBlob);
                imagePaths.push(imgUrl);
              } catch (error) {
                console.error(`Failed to process image in slide ${path}:`, error);
                // Continue processing other images
              }
            }
          }
        }

        slides.push({ text, images: imagePaths });
      } catch (error) {
        console.error(`Failed to process slide ${path}:`, error);
        // Continue processing other slides
      }
    }

    if (slides.length === 0) {
      throw new PPTExtractionError('Failed to extract any content from the presentation.');
    }

    return slides;
  } catch (error) {
    if (error instanceof PPTExtractionError) {
      throw error;
    }
    throw new PPTExtractionError('Failed to process the PowerPoint file. Please try again.');
  }
};
