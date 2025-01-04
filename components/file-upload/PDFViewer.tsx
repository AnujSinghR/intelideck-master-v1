"use client";

import React, { useEffect, useState } from "react";
import { useUpload } from "./UploadContext";

interface PDFViewerProps {
  className?: string;
}

export function PDFViewer({ className = "" }: PDFViewerProps) {
  const { file, fileBase64 } = useUpload();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    if (!file || !fileBase64) {
      setError("No PDF file found");
      setPdfUrl(null);
      setIsLoading(false);
      return;
    }

    try {
      // Convert base64 to Blob
      const byteCharacters = atob(fileBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Create URL for the blob
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      // Clean up the old URL when component unmounts or when URL changes
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error("Error loading PDF:", err);
      setError("Failed to load PDF file");
    } finally {
      setIsLoading(false);
    }
  }, [file, fileBase64]); // Re-run when file or fileBase64 changes

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[600px] ${className}`}>
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-100"></div>
            <div className="absolute top-0 left-0 animate-spin rounded-full h-20 w-20 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-indigo-700 animate-pulse">Loading PDF viewer...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we prepare your document</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-[600px] ${className}`}>
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <div className="bg-red-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6 border-2 border-red-100">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-3">{error}</h3>
          <p className="text-base text-red-600 mb-6">Please upload a valid PDF file to view it here.</p>
          <div className="border-t border-red-100 pt-6">
            <p className="text-sm text-gray-500">Need help? Check our documentation for supported file formats.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className={`flex items-center justify-center min-h-[600px] ${className}`}>
        <div className="text-center max-w-md mx-auto p-8 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6 border-2 border-indigo-100">
            <svg className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">No PDF Selected</h3>
          <p className="text-base text-gray-600 mb-6">Upload a PDF file using the button above to view it here.</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Supported formats: PDF</p>
            <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* PDF Display */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-indigo-50/20 rounded-lg shadow-inner">
        {pdfUrl ? (
          <div className="h-full p-4">
            <iframe
              src={`${pdfUrl}#toolbar=1&view=FitH`}
              className="w-full h-full border-0 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl bg-white"
              title="PDF Viewer"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-6">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900">No PDF loaded</h3>
              <p className="mt-1 text-sm text-gray-500">Upload a PDF file to view it here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
