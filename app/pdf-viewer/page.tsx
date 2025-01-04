"use client";

import { PDFViewer } from "../../components/file-upload/PDFViewer";
import { PDFTextExtractor } from "../../components/file-upload/PDFTextExtractor";
import { UploadProvider } from "../../components/file-upload/UploadContext";
import FileUploadExample from "../../components/file-upload/FileUploadExample";
import { useState } from "react";

export default function PDFViewerPage() {
  const [showExtractedText, setShowExtractedText] = useState(false);

  return (
    <UploadProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
              <div className="mb-6 md:mb-0">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent sm:text-5xl">
                  PDF Viewer
                </h1>
                <p className="mt-3 text-xl text-gray-600 max-w-2xl">
                  Upload, view, and extract text from your PDF documents with our powerful viewer
                </p>
              </div>
              <div className="flex-shrink-0">
                <FileUploadExample />
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-indigo-50">
              {/* Toolbar */}
              <div className="border-b border-indigo-100 bg-gradient-to-r from-white to-indigo-50/30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowExtractedText(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      !showExtractedText
                        ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                        : "text-gray-600 hover:bg-indigo-50"
                    }`}
                  >
                    View PDF
                  </button>
                  <button
                    onClick={() => setShowExtractedText(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      showExtractedText
                        ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                        : "text-gray-600 hover:bg-indigo-50"
                    }`}
                  >
                    Extracted Text
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  Use the toolbar to switch between views
                </div>
              </div>

              {/* Content Area */}
              <div className="flex flex-col lg:flex-row h-[calc(100vh-14rem)]">
                {/* PDF Viewer */}
                <div className={`flex-1 p-6 ${showExtractedText ? 'hidden lg:block' : ''}`}>
                  <PDFViewer className="h-full rounded-xl overflow-hidden" />
                </div>

                {/* Text Extractor */}
                <div 
                  className={`
                    lg:w-1/2 border-t lg:border-t-0 lg:border-l border-indigo-100
                    ${showExtractedText ? 'block' : 'hidden lg:block'}
                    bg-gradient-to-br from-white to-indigo-50/20
                  `}
                >
                  <div className="h-full overflow-y-auto p-6">
                    <PDFTextExtractor />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UploadProvider>
  );
}
