"use client";

import { useEffect, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { useUpload } from '../contexts/UploadContext';
import { Button } from '../../ui/button';
import { Loader2, Copy, Check, Search, FileText, Download, Image as ImageIcon } from 'lucide-react';
import { FormattedPDFView } from '../utils/FormattedPDFView';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

interface ExtractedPage {
  pageNum: number;
  text: string;
}

interface ExtractedImage {
  data: string;
  width: number;
  height: number;
  pageNumber: number;
  format: string;
  size: string;
}

export function PDFReskineExtractor() {
  const { fileBase64 } = useUpload();
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedPages, setExtractedPages] = useState<ExtractedPage[]>([]);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [formattedPages, setFormattedPages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFormatted, setShowFormatted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    const loadPDFAndExtract = async () => {
      try {
        if (!fileBase64) {
          setPdfDoc(null);
          setExtractedPages([]);
          setExtractedImages([]);
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
        
        // Automatically start extraction once PDF is loaded
        if (pdf) {
          await extractContent(pdf);
        }
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError('Error loading PDF: ' + (err instanceof Error ? err.message : String(err)));
        setPdfDoc(null);
        setExtractedPages([]);
        setExtractedImages([]);
      }
    };

    loadPDFAndExtract();
  }, [fileBase64]);

  const processText = async (pages: ExtractedPage[]): Promise<void> => {
    try {
      setIsProcessing(true);

      const processedText = pages.map(page => {
        const lines = page.text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        const formattedLines = lines.map(line => {
          if (line.length < 100 && (line.endsWith(':') || /^[A-Z][^.!?]*[.!?]$/.test(line))) {
            return `[H2]${line}[/H2]`;
          }
          return line;
        });

        return formattedLines.join('\n');
      });

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

  const extractImages = useCallback(async (pdf: pdfjsLib.PDFDocumentProxy) => {
    const extractedImages: ExtractedImage[] = [];
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const resources = await page.getOperatorList();
        const pageImages = new Set<string>();

        for (let i = 0; i < resources.fnArray.length; i++) {
          if (
            resources.fnArray[i] === pdfjsLib.OPS.paintImageXObject ||
            resources.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject
          ) {
            const imgName = resources.argsArray[i][0];
            if (imgName) pageImages.add(typeof imgName === "object" ? imgName.name : imgName);
          }
        }

        for (const imgName of pageImages) {
          try {
            const img = page.objs.get(imgName);

            if (img && typeof img === "object") {
              const canvas = document.createElement("canvas");
              let width = 0;
              let height = 0;

              if ("bitmap" in img && img.bitmap instanceof ImageBitmap) {
                width = img.bitmap.width;
                height = img.bitmap.height;
              } else if (
                "width" in img &&
                "height" in img &&
                typeof img.width === "number" &&
                typeof img.height === "number"
              ) {
                width = img.width;
                height = img.height;
              }

              if (width > 0 && height > 0) {
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");

                if (ctx) {
                  if ("bitmap" in img && img.bitmap instanceof ImageBitmap) {
                    ctx.drawImage(img.bitmap, 0, 0);
                  } else if ("data" in img && img.data instanceof Uint8Array) {
                    const imageData = ctx.createImageData(width, height);
                    const rgba = new Uint8ClampedArray(width * height * 4);
                    for (let i = 0, j = 0; i < img.data.length; i += 3, j += 4) {
                      rgba[j] = img.data[i];
                      rgba[j + 1] = img.data[i + 1];
                      rgba[j + 2] = img.data[i + 2];
                      rgba[j + 3] = 255;
                    }
                    imageData.data.set(rgba);
                    ctx.putImageData(imageData, 0, 0);
                  }

                  const dataUrl = canvas.toDataURL("image/png", 1.0);
                  extractedImages.push({
                    data: dataUrl,
                    width,
                    height,
                    pageNumber: pageNum,
                    format: "PNG",
                    size: formatBytes(dataUrl.length),
                  });
                }
              }
            }
          } catch (imgError) {
            console.warn(`Skipping unresolved image: ${imgName}`);
          }
        }

        page.cleanup();
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
      }
    }

    return extractedImages;
  }, []);

  const extractContent = async (pdf: pdfjsLib.PDFDocumentProxy) => {
    
    try {
      setIsLoading(true);
      setError(null);
      setExtractedPages([]);
      setExtractedImages([]);
      
      const numPages = pdf.numPages;
      const extractedText: ExtractedPage[] = [];
      setProgress({ current: 0, total: numPages });

      // Extract text
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let lastY: number | null = null;
        let text = '';
        
        textContent.items.forEach((item) => {
          const textItem = item as TextItem;
          if (lastY !== null && Math.abs(textItem.transform[5] - lastY) > 5) {
            text += '\n';
          } else if (text.length > 0 && !text.endsWith(' ') && !text.endsWith('\n')) {
            text += ' ';
          }
          text += textItem.str;
          lastY = textItem.transform[5];
        });

        extractedText.push({ pageNum: i, text });
        setProgress(prev => ({ ...prev, current: i }));
      }

      // Extract images
      const images = await extractImages(pdf);
      
      setExtractedPages(extractedText);
      setExtractedImages(images);
      await processText(extractedText);
    } catch (err) {
      setError('Error extracting content: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
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
    return (
      <div className="space-y-8">
        <FormattedPDFView pages={formattedPages} />
        {extractedImages.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Extracted Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {extractedImages.map((image, index) => (
                <div
                  key={index}
                  className="relative group bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-video bg-gray-100">
                    <img
                      src={image.data}
                      alt={`Image from page ${image.pageNumber}`}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Page {image.pageNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {image.width} × {image.height} px
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = image.data;
                          link.download = `image-page${image.pageNumber}-${Date.now()}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="p-2 text-gray-600 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
                        title="Download image"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Format: {image.format}</p>
                      <p>Size: {image.size}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30">
        <div className="flex flex-wrap items-center gap-3">
          {isLoading && (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{progress.current > 0 ? `${Math.round((progress.current / progress.total) * 100)}%` : 'Extracting...'}</span>
            </div>
          )}
          {isProcessing && (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
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
                  Upload a PDF to extract its content
                </p>
              </div>
            </div>
          </div>
        )}

        {(isLoading || isProcessing) && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-white/80 rounded-xl p-8 shadow-lg border border-indigo-50 backdrop-blur-sm">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">
                    {isLoading ? 'Extracting Content...' : 'Processing Text...'}
                  </p>
                  {isLoading && progress.current > 0 && (
                    <p className="text-sm text-gray-500">
                      Page {progress.current} of {progress.total}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
