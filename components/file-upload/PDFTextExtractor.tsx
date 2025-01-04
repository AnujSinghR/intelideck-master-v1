"use client";

import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { useUpload } from './UploadContext';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

export function PDFTextExtractor() {
  const { fileBase64 } = useUpload();
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        if (!fileBase64) {
          setPdfDoc(null);
          setExtractedText('');
          return;
        }

        // Convert base64 to array buffer
        const binaryString = atob(fileBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({
          data: bytes.buffer,
          cMapUrl: '/cmaps/',
          cMapPacked: true,
        });
        
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setError(null);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError('Error loading PDF: ' + (err instanceof Error ? err.message : String(err)));
        setPdfDoc(null);
        setExtractedText('');
      }
    };

    loadPDF();
  }, [fileBase64]); // Re-run when fileBase64 changes

  const extractText = async () => {
    if (!pdfDoc) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Extract text from all pages
      const textPromises = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => (item as TextItem).str)
          .join(' ');
        textPromises.push(pageText);
      }
      
      const allText = (await Promise.all(textPromises)).join('\n\n--- Page Break ---\n\n');
      setExtractedText(allText);
    } catch (err) {
      setError('Error extracting text: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center p-4 bg-red-50 rounded-xl border border-red-100">
          <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-base text-red-800 font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
        <button
          onClick={extractText}
          disabled={!pdfDoc || isLoading}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            !pdfDoc || isLoading 
              ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
              : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Extracting text...</span>
              </div>
            </span>
          ) : (
            'Extract Text'
          )}
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {!pdfDoc && !error && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-100 shadow-sm">
              <div className="bg-white/60 rounded-xl p-6 backdrop-blur-sm">
                <svg className="w-16 h-16 mb-4 text-indigo-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">No PDF Selected</h3>
                <p className="text-base text-gray-600 text-center">Upload a PDF to extract its text content</p>
              </div>
            </div>
          </div>
        )}

        {extractedText && (
          <div className="prose max-w-none">
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/60 rounded-xl p-4 backdrop-blur-sm border border-indigo-50">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Extracted Text
                </h3>
                <span className="text-sm text-gray-500 bg-indigo-50 px-3 py-1 rounded-full">
                  {pdfDoc?.numPages} {pdfDoc?.numPages === 1 ? 'page' : 'pages'}
                </span>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-50">
                <p className="whitespace-pre-wrap text-base text-gray-700 leading-relaxed">{extractedText}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
