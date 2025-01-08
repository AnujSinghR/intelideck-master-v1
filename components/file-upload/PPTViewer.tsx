"use client";

import { useState, useEffect } from "react";
import { usePPTUpload } from "./PPTUploadContext";
import { extractPptData, PPTExtractionError, SlideData } from "../../lib/pptExtractor";

interface PPTViewerProps {
  className?: string;
}

export function PPTViewer({ className = "" }: PPTViewerProps) {
  const { file, fileBase64 } = usePPTUpload();
  const [isLoading, setIsLoading] = useState(false);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Process PowerPoint file when it changes
  useEffect(() => {
    const processPPT = async () => {
      if (!file) {
        setSlides([]);
        return;
      }

      try {
        setIsLoading(true);
        const extractedSlides = await extractPptData(file);
        setSlides(extractedSlides);
        setCurrentSlide(0);
      } catch (error) {
        console.error('Error processing PowerPoint:', error);
      } finally {
        setIsLoading(false);
      }
    };

    processPPT();
  }, [file]);

  const handlePrevSlide = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1));
  };

  if (!file) {
    return (
      <div className={`flex items-center justify-center min-h-[calc(100vh-12rem)] ${className}`}>
        <div className="text-center max-w-md mx-auto p-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-orange-100">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6 border-2 border-orange-100">
            <svg className="h-10 w-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No PowerPoint Selected</h3>
          <p className="text-base text-gray-600">Upload a PowerPoint file to view it here</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[calc(100vh-12rem)] ${className}`}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-gray-500">Processing PowerPoint file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Navigation Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevSlide}
            disabled={currentSlide === 0}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm font-medium">
            Slide {currentSlide + 1} of {slides.length}
          </span>
          <button
            onClick={handleNextSlide}
            disabled={currentSlide === slides.length - 1}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="p-4">
        {slides[currentSlide] && (
          <div className="space-y-4">
            {/* Text Content */}
            <div className="prose max-w-none">
              {slides[currentSlide].text.split('\n').map((line, index) => (
                <p key={index} className="mb-2">{line}</p>
              ))}
            </div>

            {/* Images */}
            {slides[currentSlide].images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slides[currentSlide].images.map((imageUrl, index) => (
                  <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={`Image ${index + 1} from slide ${currentSlide + 1}`}
                      className="object-contain w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
