import pptxgen from "pptxgenjs";
import { Slide } from "../types";

const colorSchemes = {
  title: {
    background: { color: '2563EB' }, // blue-600
    title: { color: 'FFFFFF' },
    text: { color: 'FFFFFF' }
  },
  section: {
    background: { color: '1E293B' }, // slate-800
    title: { color: 'FFFFFF' },
    text: { color: 'FFFFFF' }
  },
  content: {
    background: { color: 'FFFFFF' },
    title: { color: '1E293B' }, // slate-800
    text: { color: '334155' } // slate-700
  },
  quote: {
    background: { color: 'F1F5F9' }, // slate-100
    title: { color: '1E293B' }, // slate-800
    text: { color: '334155' } // slate-700
  },
  data: {
    background: { color: 'F8FAFC' }, // slate-50
    title: { color: '1E293B' }, // slate-800
    text: { color: '334155' } // slate-700
  }
};

const layouts = {
  title: (slide: any, content: Slide) => {
    const scheme = colorSchemes.title;
    slide.background = scheme.background;
    
    // Large centered title
    slide.addText(content.title, {
      x: '10%',
      y: '35%',
      w: '80%',
      h: '30%',
      fontSize: 60,
      color: scheme.title.color,
      bold: true,
      align: 'center',
      valign: 'middle',
      wrap: true
    });

    // Subtitle points with animation
    content.content.forEach((point: string, idx: number) => {
      slide.addText(point, {
        x: '20%',
        y: `${65 + (idx * 8)}%`,
        w: '60%',
        h: '8%',
        fontSize: 24,
        color: scheme.text.color,
        align: 'center',
        valign: 'middle',
        transparency: 50,
        isTextBox: true
      });
    });
  },
  section: (slide: any, content: Slide, pres: pptxgen) => {
    const scheme = colorSchemes.section;
    slide.background = scheme.background;
    
    // Large section title with accent bar
    slide.addShape(pres.ShapeType.rect, {
      x: '10%',
      y: '48%',
      w: '80%',
      h: '4%',
      fill: { color: '3B82F6' } // blue-500
    });

    slide.addText(content.title, {
      x: '10%',
      y: '30%',
      w: '80%',
      h: '15%',
      fontSize: 44,
      color: scheme.title.color,
      bold: true,
      align: 'center',
      valign: 'bottom'
    });

    content.content.forEach((point: string, idx: number) => {
      slide.addText(point, {
        x: '20%',
        y: `${55 + (idx * 8)}%`,
        w: '60%',
        h: '8%',
        fontSize: 24,
        color: scheme.text.color,
        align: 'center',
        valign: 'middle'
      });
    });
  },
  content: (slide: any, content: Slide, pres: pptxgen) => {
    const scheme = colorSchemes.content;
    slide.background = scheme.background;

    // Title with bottom border
    slide.addShape(pres.ShapeType.rect, {
      x: '10%',
      y: '20%',
      w: '80%',
      h: '0.3%',
      fill: { color: '3B82F6' } // blue-500
    });

    slide.addText(content.title, {
      x: '10%',
      y: '5%',
      w: '80%',
      h: '15%',
      fontSize: 36,
      color: scheme.title.color,
      bold: true,
      align: 'left',
      valign: 'middle'
    });

    // Content with bullets and progressive animation
    content.content.forEach((point: string, idx: number) => {
      slide.addText(point, {
        x: '12%',
        y: `${25 + (idx * 12)}%`,
        w: '76%',
        h: '10%',
        fontSize: Math.max(18, Math.min(24, 600 / point.length)),
        color: scheme.text.color,
        bullet: { type: 'number', color: '3B82F6' },
        align: 'left',
        valign: 'middle',
        isTextBox: true
      });
    });
  },
  quote: (slide: any, content: Slide, pres: pptxgen) => {
    const scheme = colorSchemes.quote;
    slide.background = scheme.background;

    // Large quote marks
    slide.addText('"', {
      x: '10%',
      y: '20%',
      w: '15%',
      h: '20%',
      fontSize: 120,
      color: '3B82F6',
      bold: true,
      align: 'left',
      valign: 'top'
    });

    // Main quote text
    slide.addText(content.title, {
      x: '15%',
      y: '30%',
      w: '70%',
      h: '40%',
      fontSize: 32,
      color: scheme.title.color,
      fontFace: 'Georgia',
      align: 'center',
      valign: 'middle',
      italic: true
    });

    // Supporting points
    content.content.forEach((point: string, idx: number) => {
      slide.addText(point, {
        x: '20%',
        y: `${70 + (idx * 8)}%`,
        w: '60%',
        h: '8%',
        fontSize: 20,
        color: scheme.text.color,
        align: 'center',
        valign: 'middle'
      });
    });
  },
  data: (slide: any, content: Slide, pres: pptxgen) => {
    const scheme = colorSchemes.data;
    slide.background = scheme.background;

    // Title with accent background
    slide.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: '20%',
      fill: { color: '3B82F6' }
    });

    slide.addText(content.title, {
      x: '10%',
      y: '5%',
      w: '80%',
      h: '10%',
      fontSize: 32,
      color: 'FFFFFF',
      bold: true,
      align: 'left',
      valign: 'middle'
    });

    // Two-column layout for data points
    const leftPoints = content.content.slice(0, Math.ceil(content.content.length / 2));
    const rightPoints = content.content.slice(Math.ceil(content.content.length / 2));

    leftPoints.forEach((point: string, idx: number) => {
      slide.addText(point, {
        x: '10%',
        y: `${25 + (idx * 15)}%`,
        w: '35%',
        h: '12%',
        fontSize: 20,
        color: scheme.text.color,
        bullet: { type: 'bullet', color: '3B82F6' },
        align: 'left',
        valign: 'middle'
      });
    });

    rightPoints.forEach((point: string, idx: number) => {
      slide.addText(point, {
        x: '55%',
        y: `${25 + (idx * 15)}%`,
        w: '35%',
        h: '12%',
        fontSize: 20,
        color: scheme.text.color,
        bullet: { type: 'bullet', color: '3B82F6' },
        align: 'left',
        valign: 'middle'
      });
    });
  }
};

export const generatePPTX = (slides: Slide[]) => {
  const pres = new pptxgen();

  // Set presentation properties
  pres.author = 'SlideGen AI';
  pres.company = 'SlideGen';
  pres.revision = '1';
  pres.subject = 'AI Generated Presentation';

  // Process each slide with appropriate layout
  slides.forEach((slide: Slide) => {
    const pptSlide = pres.addSlide();
    const style = slide.style?.toLowerCase() || 'content';
    const layout = layouts[style as keyof typeof layouts];
    if (layout) {
      layout(pptSlide, slide, pres);
    } else {
      layouts.content(pptSlide, slide, pres);
    }
  });

  pres.writeFile({ fileName: 'SlideGen-Presentation.pptx' });
};
