"use client";

import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import { useUpload } from "../contexts/UploadContext";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { ScrollArea } from "../../ui/scroll-area";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";

// Ensure worker is loaded correctly in both development and production
const workerSrc = typeof window !== 'undefined' 
  ? `${window.location.origin}/pdf.worker.mjs`
  : '/pdf.worker.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

// Cache for storing rendered pages with size limit
const MAX_CACHE_SIZE = 10; // Reduced cache size to improve memory usage while maintaining smooth navigation
const pageCache = new Map<string, ImageBitmap>();

// Helper function to manage cache size
const limitCacheSize = () => {
  if (pageCache.size > MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(pageCache.keys()).slice(0, pageCache.size - MAX_CACHE_SIZE);
    keysToDelete.forEach(key => pageCache.delete(key));
  }
};

interface PDFPageCanvasProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onRenderComplete?: () => void;
}

const PDFPageCanvas = memo(function PDFPageCanvas({ pdf, pageNumber, scale, onRenderComplete }: PDFPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);
  const cacheKey = `${pageNumber}-${scale}`;

  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      if (!canvasRef.current || !isMounted) return;

      try {
        setIsRendering(true);
        setRenderError(null);

        // Check cache first
        const cachedPage = pageCache.get(cacheKey);
        if (cachedPage) {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d', { alpha: false });
          if (context) {
            canvas.width = cachedPage.width;
            canvas.height = cachedPage.height;
            context.drawImage(cachedPage, 0, 0);
            onRenderComplete?.();
            setIsRendering(false);
            return;
          }
        }

        // Cancel any existing render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const pdfPage = await pdf.getPage(pageNumber);
        const viewport = pdfPage.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { alpha: false });

        if (!context || !isMounted) {
          pdfPage.cleanup();
          return;
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTaskRef.current = pdfPage.render(renderContext);
        await renderTaskRef.current.promise;

        if (isMounted) {
          // Cache the rendered page
          const bitmap = await createImageBitmap(canvas);
          pageCache.set(cacheKey, bitmap);
          limitCacheSize();
          onRenderComplete?.();
        }

        pdfPage.cleanup();
      } catch (error: any) {
        if (error?.name !== 'RenderingCancelledException') {
          console.error("Error rendering PDF page:", error);
          setRenderError(`Error rendering page ${pageNumber}. Please try refreshing.`);
        }
      } finally {
        if (isMounted) {
          setIsRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, pageNumber, scale, cacheKey, onRenderComplete]);

  if (renderError) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-600">
        {renderError}
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="max-w-full shadow-lg rounded-lg"
      />
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )}
    </div>
  );
});

interface ThumbnailProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  isSelected: boolean;
  onClick: () => void;
}

const Thumbnail = memo(function Thumbnail({ pdf, pageNumber, isSelected, onClick }: ThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { 
        root: null,
        rootMargin: '50px',
        threshold: 0.1 
      }
    );

    if (thumbnailRef.current) {
      observer.observe(thumbnailRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={thumbnailRef}
      className={`cursor-pointer p-2 transition-all ${
        isSelected ? "bg-indigo-100 ring-2 ring-indigo-500" : "hover:bg-gray-100"
      } rounded-lg`}
      onClick={onClick}
    >
      <div className="relative min-h-[180px] flex items-center justify-center">
        {isVisible ? (
          <>
            <PDFPageCanvas
              pdf={pdf}
              pageNumber={pageNumber}
              scale={0.3}
              onRenderComplete={() => setIsLoading(false)}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <Loader2 className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>
      <div className="text-center text-sm mt-1 text-gray-600">
        Page {pageNumber}
      </div>
    </div>
  );
});

interface PDFViewerProps {
  className?: string;
}

export function PDFViewer({ className = "" }: PDFViewerProps) {
  const { file, fileBase64 } = useUpload();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [showThumbnails, setShowThumbnails] = useState(false); // Always show thumbnails by default
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF document
  useEffect(() => {
    let isActive = true;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    const loadPDF = async () => {
      setIsLoading(true);
      setError(null);
      setLoadingProgress(0);
      pageCache.clear(); // Clear cache when loading new document

      if (!file || !fileBase64) {
        setError("No PDF file found");
        setIsLoading(false);
        return;
      }

      try {
        const byteCharacters = atob(fileBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        loadingTask = pdfjsLib.getDocument({
          data: byteArray,
          cMapUrl: "/cmaps/",
          cMapPacked: true,
          enableXfa: false, // Disabled XFA support for faster loading
          useSystemFonts: false, // Disabled system fonts for faster loading
        });

        loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
          if (isActive) {
            const percent = (progress.loaded / progress.total) * 100;
            setLoadingProgress(Math.round(percent));
          }
        };

        const pdf = await loadingTask.promise;
        
        if (isActive) {
          setPdfDocument(pdf);
          setTotalPages(pdf.numPages);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Error loading PDF:", err);
        if (isActive) {
          setError("Failed to load PDF file. Please ensure it's a valid PDF document.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      isActive = false;
      pageCache.clear();
      if (loadingTask) {
        loadingTask.destroy();
      }
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [file, fileBase64]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setZoomLevel(prev => Math.min(200, prev + 10));
        } else if (e.key === "-") {
          e.preventDefault();
          setZoomLevel(prev => Math.max(50, prev - 10));
        } else if (e.key === "0") {
          e.preventDefault();
          setZoomLevel(100);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentPage(prev => Math.max(1, prev - 1));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [totalPages]);

  // Memoized handlers
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(200, prev + 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(50, prev - 10));
  }, []);

  const toggleThumbnails = useCallback(() => {
    setShowThumbnails(prev => !prev);
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[calc(100vh-12rem)] ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-100"></div>
            <div 
              className="absolute top-0 left-0 rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"
              style={{ 
                transform: `rotate(${loadingProgress * 3.6}deg)`,
                transition: "transform 0.3s ease-out"
              }}
            ></div>
          </div>
          <p className="text-lg font-medium text-indigo-700">
            Loading PDF... {loadingProgress}%
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-[calc(100vh-12rem)] ${className}`}>
        <div className="text-center max-w-md mx-auto p-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-red-100">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6 border-2 border-red-200">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-3">{error}</h3>
          <p className="text-base text-red-600">Please upload a valid PDF file to view it here.</p>
        </div>
      </div>
    );
  }

  if (!pdfDocument) {
    return (
      <div className={`flex items-center justify-center min-h-[calc(100vh-12rem)] ${className}`}>
        <div className="text-center max-w-md mx-auto p-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6 border-2 border-indigo-100">
            <svg className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No PDF Selected</h3>
          <p className="text-base text-gray-600">Upload a PDF file to view it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col ${className} relative`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center space-x-4">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              title="Zoom Out (Ctrl + -)"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 bg-white rounded-md text-sm font-medium text-indigo-600 min-w-[4rem] text-center shadow-sm border border-gray-200">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
              title="Zoom In (Ctrl + +)"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Toggle Thumbnails */}
          <button
            onClick={toggleThumbnails}
            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          >
            {showThumbnails ? "Hide Thumbnails" : "Show Thumbnails"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <div className="w-48 border-r bg-gray-50 overflow-hidden flex flex-col h-full">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Thumbnail
                    key={pageNum}
                    pdf={pdfDocument}
                    pageNumber={pageNum}
                    isSelected={pageNum === currentPage}
                    onClick={() => setCurrentPage(pageNum)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* PDF Display */}
        <div ref={containerRef} className="flex-1 overflow-auto p-4">
          <div className="min-h-full flex items-center justify-center">
            <PDFPageCanvas
              pdf={pdfDocument}
              pageNumber={currentPage}
              scale={zoomLevel/100}
              onRenderComplete={() => {
                // Additional logic after page render if needed
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
