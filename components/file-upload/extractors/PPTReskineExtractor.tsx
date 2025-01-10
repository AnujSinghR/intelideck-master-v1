"use client";

import { useEffect, useState, useCallback } from 'react';
import { usePPTUpload } from '../contexts/PPTUploadContext';
import { Button } from '../../ui/button';
import { Loader2, Copy, Check, Search, Download } from 'lucide-react';
import { extractPptData, PPTExtractionError, SlideData } from '../../../lib/pptExtractor';

interface ExtractedImage {
  data: string;
  slideNumber: number;
  format: string;
  size: string;
}

export function PPTReskineExtractor() {
  const { file } = usePPTUpload();
  const [error, setError] = useState<string | null>(null);
  const [extractedSlides, setExtractedSlides] = useState<SlideData[]>([]);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [formattedContent, setFormattedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    const extractContent = async () => {
      if (!file) {
        setExtractedSlides([]);
        setExtractedImages([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const slides = await extractPptData(file);
        setExtractedSlides(slides);

        // Process images
        const images = slides.flatMap((slide: SlideData, index: number) => 
          slide.images.map((imageUrl: string) => ({
            data: imageUrl,
            slideNumber: index + 1,
            format: 'PNG',
            size: formatBytes(imageUrl.length)
          }))
        );
        setExtractedImages(images);

        // Format content for display
        const formattedText = slides.map((slide: SlideData, index: number) => {
          const slideNumber = index + 1;
          const slideText = slide.text.trim();
          return `[Slide ${slideNumber}]\n${slideText}`;
        }).join('\n\n');

        setFormattedContent(formattedText);

      } catch (err: unknown) {
        console.error('Error extracting content:', err);
        setError(err instanceof PPTExtractionError ? err.message : 'Failed to extract content');
      } finally {
        setIsLoading(false);
      }
    };

    extractContent();
  }, [file]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formattedContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err: unknown) {
      console.error('Failed to copy text:', err);
    }
  }, [formattedContent]);

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

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-orange-100 bg-gradient-to-r from-white to-orange-50/30">
        <div className="flex flex-wrap items-center gap-3">
          {isLoading && (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Extracting...</span>
            </div>
          )}
          {extractedSlides.length > 0 && (
            <>
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search in text..."
                  className="w-full px-3 py-1.5 text-sm border rounded-md pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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

          {extractedSlides.length > 0 && (
            <div className="flex items-center space-x-2 bg-orange-50/50 px-3 py-1.5 rounded-lg">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-orange-700">
                {extractedSlides.length} {extractedSlides.length === 1 ? 'slide' : 'slides'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {!file && !error && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border-2 border-orange-100 shadow-lg">
              <div className="bg-white/80 rounded-xl p-8 backdrop-blur-sm">
                <div className="relative">
                  <div className="absolute -top-4 -right-4">
                    <span className="flex h-8 w-8">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-8 w-8 bg-orange-500 items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                    </span>
                  </div>
                  <svg className="w-20 h-20 mb-6 text-orange-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent text-center mb-4">
                  No PowerPoint Selected
                </h3>
                <p className="text-base text-gray-600 text-center">
                  Upload a PowerPoint to extract its content
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-white/80 rounded-xl p-8 shadow-lg border border-orange-50 backdrop-blur-sm">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">
                    Extracting Content...
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Formatted Content */}
            {formattedContent && (
              <div className="prose max-w-none">
                {formattedContent.split('\n').map((line, index) => (
                  <div key={index} className="mb-2">
                    {highlightSearchTerm(line)}
                  </div>
                ))}
              </div>
            )}

            {/* Extracted Images */}
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
                          alt={`Image from slide ${image.slideNumber}`}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Slide {image.slideNumber}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = image.data;
                              link.download = `image-slide${image.slideNumber}-${Date.now()}.png`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="p-2 text-gray-600 hover:text-orange-600 rounded-full hover:bg-orange-50 transition-colors"
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
          </>
        )}
      </div>
    </div>
  );
}
