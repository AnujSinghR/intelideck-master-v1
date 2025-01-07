import React from 'react';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface FormattedPDFViewProps {
  pages: string[];
}

const gradients = [
  'from-blue-50 to-indigo-50',
  'from-purple-50 to-pink-50',
  'from-green-50 to-emerald-50',
  'from-yellow-50 to-amber-50',
  'from-red-50 to-rose-50',
];

export function FormattedPDFView({ pages }: FormattedPDFViewProps) {
  const handleDownload = () => {
    // Initialize PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // A4 dimensions in mm
    const pageWidth = 210;
    const pageHeight = 297;
    
    // Margins in mm
    const margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    };
    
    const usableWidth = pageWidth - (margin.left + margin.right);
    const lineHeight = 7; // mm
    const paragraphSpacing = 5; // mm
    
    // Process each logical section
    pages.forEach((content, pageIndex) => {
      // Add new page for each section (except first)
      if (pageIndex > 0) {
        doc.addPage();
      }

      let yPosition = margin.top;

      // Add header with page number
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Page ${pageIndex + 1}`, margin.left, yPosition);
      
      // Reset font for content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      // Move position down after header
      yPosition += lineHeight * 2;

      // Split content into paragraphs and process each
      const paragraphs = content.split('\n').filter(p => p.trim());
      
      paragraphs.forEach((paragraph: string) => {
        // Check if we need a new page
        if (yPosition > pageHeight - margin.bottom - lineHeight) {
          doc.addPage();
          yPosition = margin.top;
        }

        // Split paragraph into lines that fit the page width
        const lines = doc.splitTextToSize(paragraph.trim(), usableWidth);
        
        // Process each line
        lines.forEach((line: string) => {
          // Check if we need a new page
          if (yPosition > pageHeight - margin.bottom) {
            doc.addPage();
            yPosition = margin.top;
          }
          
          // Add the line
          doc.text(line, margin.left, yPosition);
          yPosition += lineHeight;
        });

        // Add paragraph spacing
        yPosition += paragraphSpacing;
      });
    });

    doc.save('formatted-text.pdf');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-4 border-b">
        <Button onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {pages.map((content, index) => (
            <div
              key={index}
              className="bg-white/80 rounded-xl p-6 shadow-lg border border-indigo-50 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-indigo-600">
                  Page {index + 1}
                </h3>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-indigo-50/20 rounded-lg p-6 shadow-inner">
                <div className="whitespace-pre-wrap text-base text-gray-700 leading-relaxed">
                  {content.split('\n').map((paragraph, pIndex) => (
                    paragraph.trim() && (
                      <p key={pIndex} className="mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    )
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
