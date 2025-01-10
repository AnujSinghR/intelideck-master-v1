"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

interface PPTUploadContextType {
  file: File | null;
  fileBase64: string | null;
  isLoading: boolean;
  error: string | null;
  updateFile: (file: File | null) => Promise<void>;
  resetFile: () => void;
}

const PPTUploadContext = createContext<PPTUploadContextType | undefined>(undefined);

const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total limit
const ALLOWED_FILE_TYPES = ['application/vnd.openxmlformats-officedocument.presentationml.presentation'];

export const PPTUploadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pptx')) {
      throw new Error("Invalid file type. Only PowerPoint (.pptx) files are allowed.");
    }

    if (file.size > MAX_TOTAL_SIZE) {
      throw new Error(`File size exceeds the maximum limit of ${MAX_TOTAL_SIZE / (1024 * 1024)}MB.`);
    }

    if (file.size === 0) {
      throw new Error("File is empty.");
    }
  };

  const processFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        } catch (error) {
          reject(new Error("Failed to process file. Please try again."));
        }
      };
      reader.onerror = () => reject(new Error("Error reading file. Please try again."));
      reader.readAsDataURL(file);
    });
  };

  const updateFile = async (file: File | null) => {
    setError(null);
    setIsLoading(true);

    try {
      // Reset state
      setFile(null);
      setFileBase64(null);

      if (file) {
        // Validate file before processing
        validateFile(file);
        const base64 = await processFile(file);
        if (!base64) throw new Error("Failed to process file");

        // Update state
        setFile(file);
        setFileBase64(base64);

        // Small delay to ensure state updates are processed
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Error processing file:", error);
      resetFile();
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetFile = () => {
    setFile(null);
    setFileBase64(null);
    setError(null);
  };

  return (
    <PPTUploadContext.Provider
      value={{
        file,
        fileBase64,
        isLoading,
        error,
        updateFile,
        resetFile,
      }}
    >
      {children}
    </PPTUploadContext.Provider>
  );
};

export const usePPTUpload = () => {
  const context = useContext(PPTUploadContext);
  if (context === undefined) {
    throw new Error("usePPTUpload must be used within a PPTUploadProvider");
  }
  return context;
};
