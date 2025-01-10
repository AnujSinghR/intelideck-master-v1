"use client";

import { useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { useUpload } from '../contexts/UploadContext';
import { Button } from '../../ui/button';
import { Loader2, Copy, Check, Search, FileText } from 'lucide-react';
import { FormattedPDFView } from '../utils/FormattedPDFView';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

interface ExtractedPage {
  pageNum: number;
  text: string;
}

export function PDFTextExtractor() {
  const { fileBase64 } = useUpload();
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedPages, setExtractedPages] = useState<ExtractedPage[]>([]);
  const [formattedPages, setFormattedPages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFormatted, setShowFormatted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        if (!fileBase64) {
          setPdfDoc(null);
          setExtractedPages([]);
          return;
        }

        const binaryString = atob(fileBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

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
        setExtractedPages([]);
      }
    };

    loadPDF();
  }, [fileBase64]);

  const processText = async (pages: ExtractedPage[]): Promise<void> => {
    try {
      setIsProcessing(true);

      // Pre-process text to improve structure detection
      const processedText = pages.map(page => {
        // Split text into lines and clean up
        const lines = page.text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        // Detect and format potential headers
        const formattedLines = lines.map(line => {
          // Check for potential headers (short lines with specific endings)
          if (line.length < 100 && (line.endsWith(':') || /^[A-Z][^.!?]*[.!?]$/.test(line))) {
            return `[H2]${line}[/H2]`;
          }
          return line;
        });

        return formattedLines.join('\n');
      });

      // Join pages with page breaks
      const combinedText = processedText.join('\n\n---PAGE_BREAK---\n\n');

      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: combinedText }),
      });

      if (!response.ok) {
        throw new Error('Failed to process text');
      }

      const data = await response.json();
      setFormattedPages(data.formattedText);
      setShowFormatted(true);
    } catch (error) {
      console.error('Error processing text:', error);
      setError('Failed to process text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractText = async () => {
    if (!pdfDoc) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setExtractedPages([]);
      
      const numPages = pdfDoc.numPages;
      const extractedText: ExtractedPage[] = [];

      // Process pages in batches of 5 for better performance
      const batchSize = 5;
      for (let i = 0; i < numPages; i += batchSize) {
        const batch = Array.from(
          { length: Math.min(batchSize, numPages - i) },
          (_, index) => i + index + 1
        );

        const batchResults = await Promise.all(
          batch.map(async (pageNum) => {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Improved text extraction with better spacing
            let lastY: number | null = null;
            let text = '';
            
            textContent.items.forEach((item) => {
              const textItem = item as TextItem;
              // Add newline if Y position changes significantly
              if (lastY !== null && Math.abs(textItem.transform[5] - lastY) > 5) {
                text += '\n';
              }
              // Add space if items are on the same line but separated
              else if (text.length > 0 && !text.endsWith(' ') && !text.endsWith('\n')) {
                text += ' ';
              }
              text += textItem.str;
              lastY = textItem.transform[5];
            });

            return { pageNum, text };
          })
        );

        extractedText.push(...batchResults);
        setExtractionProgress(Math.round(((i + batchSize) / numPages) * 100));
      }

      const sortedPages = extractedText.sort((a, b) => a.pageNum - b.pageNum);
      setExtractedPages(sortedPages);
      await processText(sortedPages);
    } catch (err) {
      setError('Error extracting text: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
      setExtractionProgress(0);
    }
  };

  const handleCopyText = useCallback(async () => {
    const text = extractedPages.map(page => page.text).join('\n\n---PAGE_BREAK---\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }, [extractedPages]);

  const highlightSearchTerm = useCallback((text: string) => {
    if (!searchTerm) return text;

    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? 
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark> : 
        part
    );
  }, [searchTerm]);

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

  if (showFormatted && formattedPages.length > 0) {
    return <FormattedPDFView pages={formattedPages} />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={extractText}
            disabled={!pdfDoc || isLoading || isProcessing}
            className="relative"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{extractionProgress > 0 ? `${extractionProgress}%` : 'Extracting...'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Extract & Format</span>
                  </>
                )}
              </div>
            )}
          </Button>

          {extractedPages.length > 0 && (
            <>
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search in text..."
                  className="w-full px-3 py-1.5 text-sm border rounded-md pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                className="ml-auto"
              >
                {isCopied ? (
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4" />
                    <span>Copied!</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Copy className="h-4 w-4" />
                    <span>Copy All</span>
                  </div>
                )}
              </Button>
            </>
          )}

          {pdfDoc && (
            <div className="flex items-center space-x-2 bg-indigo-50/50 px-3 py-1.5 rounded-lg">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-indigo-700">
                {pdfDoc.numPages} {pdfDoc.numPages === 1 ? 'page' : 'pages'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {!pdfDoc && !error && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-100 shadow-lg">
              <div className="bg-white/80 rounded-xl p-8 backdrop-blur-sm">
                <div className="relative">
                  <div className="absolute -top-4 -right-4">
                    <span className="flex h-8 w-8">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-8 w-8 bg-indigo-500 items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                    </span>
                  </div>
                  <svg className="w-20 h-20 mb-6 text-indigo-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-center mb-4">
                  No PDF Selected
                </h3>
                <p className="text-base text-gray-600 text-center">
                  Upload a PDF to extract its text content
                </p>
              </div>
            </div>
          </div>
        )}

        {extractedPages.length > 0 && (
          <div className="space-y-6">
            {extractedPages.map((page) => (
              <div
                key={page.pageNum}
                className="bg-white/80 rounded-xl p-6 shadow-lg border border-indigo-50 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-indigo-600">
                    Page {page.pageNum}
                  </h3>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50/20 rounded-lg p-4 shadow-inner">
                  <p className="whitespace-pre-wrap text-base text-gray-700 leading-relaxed font-mono selection:bg-indigo-100">
                    {highlightSearchTerm(page.text)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
