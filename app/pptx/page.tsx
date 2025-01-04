'use client';

import { useState, useEffect, useCallback } from 'react';
import { extractPptData, SlideData, PPTExtractionError, validateFile } from '@/lib/pptExtractor';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProcessedSlide extends SlideData {
  slideNumber: number;
  paragraphs: string[];
}

export default function PPTXPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processedOutput, setProcessedOutput] = useState<ProcessedSlide[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    return () => {
      processedOutput.forEach(slide => {
        slide.images.forEach(URL.revokeObjectURL);
      });
    };
  }, [processedOutput]);

  const resetState = useCallback(() => {
    setError(null);
    setProgress(0);
    processedOutput.forEach(slide => {
      slide.images.forEach(URL.revokeObjectURL);
    });
    setProcessedOutput([]);
    setFile(null);
  }, [processedOutput]);

  const processSlideData = (data: SlideData[]): ProcessedSlide[] => {
    return data.map((slide, index) => {
      // Split text into paragraphs for better organization
      const paragraphs = slide.text
        .split(/(?<=\.|\?|\!)\s+/)
        .filter(p => p.trim().length > 0);

      return {
        ...slide,
        slideNumber: index + 1,
        paragraphs
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    try {
      resetState();
      setFile(uploadedFile);
      setLoading(true);
      
      // Validate file first
      validateFile(uploadedFile);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const extractedData = await extractPptData(uploadedFile);
      const processed = processSlideData(extractedData);
      setProcessedOutput(processed);
      
      clearInterval(progressInterval);
      setProgress(100);
    } catch (err) {
      if (err instanceof PPTExtractionError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('File processing error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-700 via-blue-600 to-indigo-700 mb-4">
            PowerPoint Content Viewer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your PowerPoint presentation to view its content in a beautifully organized format
          </p>
        </div>

        {/* Upload Section */}
        <Card className="bg-white/80 backdrop-blur-sm p-8 mb-8 hover:shadow-xl transition-shadow duration-300">
          <div className="space-y-4">
            <label 
              htmlFor="pptx-upload"
              className="block text-lg font-medium text-gray-700 text-center"
            >
              Choose a PowerPoint file (.pptx)
            </label>
            <input
              id="pptx-upload"
              type="file"
              accept=".pptx"
              className="hidden"
              onChange={handleFileUpload}
              aria-label="Upload PowerPoint file"
            />
            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={() => document.getElementById('pptx-upload')?.click()}
                className="w-full max-w-md bg-gradient-to-r from-violet-600 via-blue-600 to-indigo-600 hover:from-violet-500 hover:via-blue-500 hover:to-indigo-500"
              >
                Upload PowerPoint File
              </Button>
              <p className="text-sm text-gray-500">Maximum file size: 50MB</p>
            </div>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-8" role="alert">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-3 text-sm text-red-700">{error}</p>
              <button
                className="ml-auto"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
              >
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Loading Progress */}
        {loading && (
          <Card className="p-6 mb-8">
            <div className="space-y-4">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 via-blue-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-indigo-600 font-semibold animate-pulse">
                Processing presentation... {progress}%
              </p>
            </div>
          </Card>
        )}

        {/* Content Display */}
        {processedOutput.length > 0 && !loading && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-800">
                Presentation Content
              </h2>
              <Button
                onClick={resetState}
                variant="outline"
                className="hover:bg-slate-100"
              >
                Clear Content
              </Button>
            </div>

            <div className="grid gap-8">
              {processedOutput.map((slide) => (
                <Card 
                  key={slide.slideNumber}
                  className="overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Slide Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Slide {slide.slideNumber}
                      </h3>
                      <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-600 shadow-sm">
                        {slide.images.length} {slide.images.length === 1 ? 'image' : 'images'}
                      </span>
                    </div>
                  </div>

                  {/* Slide Content */}
                  <div className="p-6 space-y-6">
                    {/* Text Content */}
                    {slide.paragraphs.length > 0 && (
                      <div className="prose max-w-none">
                        {slide.paragraphs.map((paragraph, idx) => (
                          <p key={idx} className="text-gray-700 leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Image Gallery */}
                    {slide.images.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {slide.images.map((img, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden">
                            <img
                              src={img}
                              alt={`Content from slide ${slide.slideNumber}`}
                              className="w-full h-auto object-cover transform transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
