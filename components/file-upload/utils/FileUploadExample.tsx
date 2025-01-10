"use client";

import { useState } from "react";
import { FileUploadModal } from "../modals/FileUploadModal";
import { useUpload } from "../contexts/UploadContext";

export default function FileUploadExample() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { file, previewUrl, updateFile, resetFile } = useUpload();

  const handleFileUpload = async (file: File) => {
    try {
      await updateFile(file);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div>
      <div className="max-w-3xl mx-auto">
        {!file ? (
          <div 
            onClick={() => setIsUploadModalOpen(true)}
            className="border-2 border-dashed border-indigo-200 rounded-2xl p-12 text-center hover:border-indigo-400 transition-all duration-300 cursor-pointer bg-gradient-to-br from-indigo-50/50 to-purple-50/50 hover:from-indigo-50 hover:to-purple-50 group backdrop-blur-sm shadow-sm hover:shadow-md"
          >
            <div className="mx-auto flex flex-col items-center">
              <div className="bg-white/60 rounded-full p-4 mb-6 w-20 h-20 mx-auto group-hover:scale-110 transition-transform duration-300">
                <svg 
                  className="h-12 w-12 text-indigo-500" 
                  stroke="currentColor" 
                  fill="none" 
                  viewBox="0 0 48 48" 
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 14v20c0 4.418 3.582 8 8 8h16c4.418 0 8-3.582 8-8V14m-16 6v16m0-16L32 24m-16-4L8 24" 
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Upload a PDF file
                </p>
                <p className="text-base text-gray-600">Click to browse or drag and drop</p>
                <p className="text-sm text-gray-500 bg-white/60 px-4 py-1 rounded-full inline-block">PDF up to 20MB</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-indigo-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <svg 
                      className="h-7 w-7 text-indigo-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{file.name}</h3>
                    <p className="text-sm text-gray-600">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
                  >
                    Change
                  </button>
                  <button
                    onClick={resetFile}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onFileUpload={handleFileUpload}
          title="Upload Your File"
          acceptedTypes="application/pdf"
          maxSize={20 * 1024 * 1024} // 20MB
        />
      </div>
    </div>
  );
}
