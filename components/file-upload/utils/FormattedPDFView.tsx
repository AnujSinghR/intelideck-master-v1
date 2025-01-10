import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface FormattedPDFViewProps {
  pages: string[];
}

type FormattedElement = {
  type: 'h1' | 'h2' | 'paragraph' | 'list' | 'steps' | 'callout' | 'table';
  content: string | string[] | string[][];
};

// Parse content with format markers
const parseContent = (content: string): FormattedElement[] => {
  const elements: FormattedElement[] = [];

  // Match format markers like [H1]text[/H1]
  const regex = /\[([A-Z0-9]+)\]([\s\S]*?)\[\/\1\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const [fullMatch, type, text] = match;
    const startIndex = match.index;

    // Add any text before this match as a paragraph
    if (startIndex > lastIndex) {
      const textBefore = content.slice(lastIndex, startIndex).trim();
      if (textBefore) {
        elements.push({ type: 'paragraph', content: textBefore });
      }
    }

    // Process the matched content based on type
    switch (type) {
      case 'H1':
        elements.push({ type: 'h1', content: text.trim() });
        break;
      case 'H2':
        elements.push({ type: 'h2', content: text.trim() });
        break;
      case 'LIST':
        elements.push({ type: 'list', content: text.split('|').map(item => item.trim()) });
        break;
      case 'STEPS':
        elements.push({ type: 'steps', content: text.split('|').map(item => item.trim()) });
        break;
      case 'CALLOUT':
        elements.push({ type: 'callout', content: text.trim() });
        break;
      case 'TABLE':
        elements.push({
          type: 'table',
          content: text.split('\n').map(row => row.split(',').map(cell => cell.trim()))
        });
        break;
      default:
        elements.push({ type: 'paragraph', content: text.trim() });
    }

    lastIndex = startIndex + fullMatch.length;
  }

  // Add any remaining text as a paragraph
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex).trim();
    if (remainingText) {
      elements.push({ type: 'paragraph', content: remainingText });
    }
  }

  return elements;
};

export function FormattedPDFView({ pages }: FormattedPDFViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      setCurrentPage(0);
      setProgress(0);
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
  
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const usableWidth = pageWidth - 2 * margin;
      const lineHeight = 7;
  
      // Load the background image
      let bgImage: string;
      try {
        bgImage = await fetch("/pdf-bg.jpg")
          .then((res) => {
            if (!res.ok) throw new Error('Failed to load background image');
            return res.blob();
          })
          .then((blob) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result;
              if (typeof result === 'string') {
                resolve(result);
              } else {
                reject(new Error('Failed to convert image to base64'));
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          }));
      } catch (error) {
        console.warn('Failed to load background image:', error);
        // Continue without background image
        bgImage = '';
      }
  
      for (let i = 0; i < pages.length; i++) {
        setCurrentPage(i + 1);
        setProgress(Math.round((i / pages.length) * 100));
  
        if (i > 0) {
          doc.addPage();
        }
  
        // Add the background image if loaded successfully
        if (bgImage) {
          doc.addImage(bgImage, "JPEG", 0, 0, pageWidth, pageHeight);
        }
  
        // Add page number
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Page ${i + 1}`, margin, margin);
  
        // Line below the page number
        doc.setDrawColor(79, 70, 229); // indigo-600
        doc.setLineWidth(0.5);
        doc.line(margin, margin + 5, pageWidth - margin, margin + 5);
  
        let yPosition = margin + 20;
  
        // Process formatted content
        const elements = parseContent(pages[i]);
  
        elements.forEach((element: FormattedElement) => {
          if (yPosition > pageHeight - margin - lineHeight) {
            doc.addPage();
            if (bgImage) {
              doc.addImage(bgImage, "JPEG", 0, 0, pageWidth, pageHeight);
            }
            yPosition = margin + 20;
          }
  
          switch (element.type) {
            case "h1":
              doc.setFont("helvetica", "bold");
              doc.setFontSize(16);
              doc.setTextColor(0, 0, 0);
              doc.text(element.content as string, margin, yPosition);
              yPosition += lineHeight * 2;
              break;
  
            case "h2":
              doc.setFont("helvetica", "bold");
              doc.setFontSize(14);
              doc.setTextColor(0, 0, 0);
              doc.text(element.content as string, margin, yPosition);
              yPosition += lineHeight * 1.5;
              break;
  
            case "list":
            case "steps":
              doc.setFont("helvetica", "normal");
              doc.setFontSize(11);
              doc.setTextColor(0, 0, 0);
              (element.content as string[]).forEach((item, index) => {
                const bullet = element.type === "steps" ? `${index + 1}.` : "•";
                const bulletWidth = doc.getTextWidth(bullet + " ");
                doc.text(bullet, margin, yPosition);
                const lines = doc.splitTextToSize(item, usableWidth - bulletWidth - 2);
                lines.forEach((line: string, lineIndex: number) => {
                  doc.text(line, margin + bulletWidth, yPosition + lineIndex * lineHeight);
                  if (lineIndex === lines.length - 1) yPosition += (lineIndex + 1) * lineHeight;
                });
                yPosition += lineHeight;
              });
              yPosition += lineHeight;
              break;
  
            case "callout":
              doc.setFillColor(243, 244, 246); // gray-100
              doc.roundedRect(margin, yPosition - 5, usableWidth, 30, 2, 2, "F");
              doc.setFont("helvetica", "bold");
              doc.setFontSize(11);
              doc.setTextColor(0, 0, 0);
              const calloutLines = doc.splitTextToSize(element.content as string, usableWidth - 20);
              calloutLines.forEach((line: string) => {
                doc.text(line, margin + 10, yPosition + 5);
                yPosition += lineHeight;
              });
              yPosition += lineHeight * 2;
              break;
  
            case "table":
              const table = element.content as string[][];
              const colWidth = (usableWidth - 20) / table[0].length;
  
              // Table header
              doc.setFillColor(243, 244, 246); // gray-100
              doc.rect(margin, yPosition - 5, usableWidth, lineHeight + 5, "F");
              doc.setFont("helvetica", "bold");
              doc.setFontSize(11);
              doc.setTextColor(0, 0, 0);
  
              table[0].forEach((header, colIndex) => {
                doc.text(header, margin + 5 + colWidth * colIndex, yPosition);
              });
              yPosition += lineHeight * 1.5;
  
              // Table rows
              doc.setFont("helvetica", "normal");
              table.slice(1).forEach((row, rowIndex) => {
                if (rowIndex % 2 === 0) {
                  doc.setFillColor(249, 250, 251); // gray-50
                  doc.rect(margin, yPosition - 5, usableWidth, lineHeight + 5, "F");
                }
                row.forEach((cell, colIndex) => {
                  doc.text(cell, margin + 5 + colWidth * colIndex, yPosition);
                });
                yPosition += lineHeight * 1.5;
              });
              yPosition += lineHeight;
              break;
  
            default:
              doc.setFont("helvetica", "normal");
              doc.setFontSize(11);
              doc.setTextColor(0, 0, 0);
              const lines = doc.splitTextToSize(element.content as string, usableWidth);
              lines.forEach((line: string) => {
                doc.text(line, margin, yPosition);
                yPosition += lineHeight;
              });
              yPosition += 5;
          }
        });
      }
  
      setProgress(100);
      doc.save("formatted-text.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
      setCurrentPage(0);
      setProgress(0);
    }
  };
  

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          {isGenerating && (
            <>
              <div className="text-sm text-gray-600">
                Processing page {currentPage} of {pages.length}
              </div>
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          )}
        </div>
        <Button 
          onClick={handleDownload} 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </>
          )}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="space-y-6 max-w-[210mm] mx-auto">
          {pages.map((content, index) => (
            <div
              key={index}
              className="bg-gradient-to-t from-gray-50 to-white min-h-[297mm] shadow-lg relative"
              style={{
                opacity: isGenerating ? (currentPage === index + 1 ? 1 : 0.5) : 1,
                padding: '20mm'
              }}
            >
              <div className="relative">
                {/* Header */}
                <div className="mb-5">
                  <div className="font-bold text-gray-900 mb-2">Page {index + 1}</div>
                  <div className="h-px bg-indigo-600" />
                </div>
                
                {/* Formatted content */}
                <div>
                  {parseContent(content).map((element, eIndex) => {
                    switch (element.type) {
                      case 'h1':
                        return (
                          <h1 key={eIndex} className="text-2xl font-bold text-gray-900 mb-6">
                            {element.content}
                          </h1>
                        );

                      case 'h2':
                        return (
                          <h2 key={eIndex} className="text-xl font-bold text-gray-800 mb-4">
                            {element.content}
                          </h2>
                        );

                      case 'list':
                        return (
                          <ul key={eIndex} className="list-disc list-inside mb-6 space-y-2">
                            {(element.content as string[]).map((item, i) => (
                              <li key={i} className="text-gray-900">{item}</li>
                            ))}
                          </ul>
                        );

                      case 'steps':
                        return (
                          <ol key={eIndex} className="list-decimal list-inside mb-6 space-y-2">
                            {(element.content as string[]).map((item, i) => (
                              <li key={i} className="text-gray-900">{item}</li>
                            ))}
                          </ol>
                        );

                      case 'callout':
                        return (
                          <div key={eIndex} className="bg-gray-100 rounded-lg p-4 mb-6">
                            <p className="text-gray-900 font-medium">{element.content}</p>
                          </div>
                        );

                      case 'table':
                        return (
                          <div key={eIndex} className="mb-6 overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-100">
                                <tr>
                                  {(element.content as string[][])[0].map((header, i) => (
                                    <th key={i} className="px-4 py-2 text-left font-bold text-gray-900">
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(element.content as string[][]).slice(1).map((row, i) => (
                                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                                    {row.map((cell, j) => (
                                      <td key={j} className="px-4 py-2 text-gray-900">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );

                      default:
                        return (
                          <p key={eIndex} className="text-gray-900 mb-6 last:mb-0">
                            {element.content}
                          </p>
                        );
                    }
                  })}
                </div>
              </div>

              {/* Processing overlay */}
              {isGenerating && currentPage === index + 1 && (
                <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-3 shadow-lg">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
