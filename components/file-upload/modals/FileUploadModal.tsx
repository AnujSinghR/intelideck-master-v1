"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Upload } from "lucide-react";
import { useState, useRef } from "react";
import { useUpload } from "../contexts/UploadContext";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  acceptedTypes?: string;
  maxSize?: number; // in bytes
  title?: string;
}

export function FileUploadModal({
  isOpen,
  onClose,
  onFileUpload,
  acceptedTypes = "application/pdf",
  maxSize = 20 * 1024 * 1024, // 20MB default
  title = "Upload File"
}: FileUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoading: isUploading } = useUpload();

  const formatAcceptedTypes = (types: string) => {
    return types.split(',').map(type => {
      return type.trim().replace('application/', '').toUpperCase();
    }).join(', ');
  };

  const validateFileType = (file: File) => {
    const acceptedTypesList = acceptedTypes.split(',').map(type => type.trim());
    if (!acceptedTypesList.includes(file.type)) {
      throw new Error(`Invalid file type. Accepted types: ${formatAcceptedTypes(acceptedTypes)}`);
    }
  };

  const validateFileSize = (file: File) => {
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }
    if (file.size === 0) {
      throw new Error("File is empty");
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);

    try {
      // Validate file before processing
      validateFileType(file);
      validateFileSize(file);

      await onFileUpload(file);
      onClose();
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error instanceof Error ? error.message : "Failed to upload file. Please try again.");
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isUploading) {
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-[475px] p-0 bg-gradient-to-br from-indigo-600 to-purple-700 border-0 shadow-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-white px-6 pt-6">{title}</DialogTitle>
        </DialogHeader>
        <div
          className={`flex flex-col items-center justify-center p-12 text-white border-2 border-dashed border-white/40 m-4 rounded-xl transition-all duration-300 ${
            isUploading ? "cursor-wait" : "cursor-pointer hover:border-white/60"
          } ${isDragging ? "bg-gradient-to-br from-indigo-500 to-purple-600 scale-[0.99] border-white/60" : ""}`}
          onDragEnter={handleDragEnter}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label={`Click or drag and drop to upload a ${formatAcceptedTypes(acceptedTypes)} file`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={acceptedTypes}
            disabled={isUploading}
            aria-label={`Choose a ${formatAcceptedTypes(acceptedTypes)} file`}
          />
          <div className="relative">
            <div 
              className={`w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center mb-8 transition-transform duration-300 ${
                isDragging ? 'scale-110' : ''
              } ${isUploading ? 'animate-pulse' : ''}`}
              aria-hidden="true"
            >
              <Upload
                className={`h-10 w-10 text-indigo-600 transition-transform duration-300 ${
                  isDragging ? 'scale-110' : ''
                } ${isUploading ? 'animate-bounce' : ''}`}
              />
            </div>
            {isUploading && (
              <div 
                className="absolute inset-0 flex items-center justify-center"
                role="progressbar"
                aria-label="Uploading file"
              >
                <div className="w-24 h-24 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div className="space-y-4 text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              {isUploading ? "Processing File..." : title}
            </h2>
            <div className="space-y-2">
              <p className="text-base text-blue-100 text-center max-w-sm">
                {isUploading ? (
                  "Please wait while we process your file..."
                ) : error ? (
                  <span 
                    className="text-red-200 bg-red-500/20 px-3 py-1.5 rounded-full"
                    role="alert"
                  >
                    {error}
                  </span>
                ) : (
                  "Click here or drag and drop a file to upload."
                )}
              </p>
              {!isUploading && !error && (
                <div className="space-y-2">
                  <p className="text-sm text-blue-200/80 bg-white/10 px-4 py-1.5 rounded-full inline-block backdrop-blur-sm">
                    Maximum file size: {maxSize / (1024 * 1024)}MB
                  </p>
                  <p className="text-sm text-blue-200/80">
                    Accepted types: {formatAcceptedTypes(acceptedTypes)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
