import React from 'react';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

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
    const element = document.getElementById('formatted-pdf-content');
    if (!element) return;

    const opt = {
      margin: 1,
      filename: 'formatted-text.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end p-4 border-b">
        <Button onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8" id="formatted-pdf-content">
        {pages.map((content, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${gradients[index % gradients.length]} p-8 rounded-lg shadow-lg border border-gray-100`}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-inner">
              <div className="prose prose-indigo max-w-none">
                {content.split('\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="mb-4 last:mb-0 text-gray-800 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
