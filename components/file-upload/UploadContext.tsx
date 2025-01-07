"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

interface UploadContextType {
  file: File | null;
  fileBase64: string | null;
  previewUrl: string | null;
  isLoading: boolean;
  error: string | null;
  updateFile: (file: File | null) => Promise<void>;
  resetFile: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const MAX_CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB total limit
const ALLOWED_FILE_TYPES = ['application/pdf'];

export const UploadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore file data from storage
  React.useEffect(() => {
    const storedData = sessionStorage.getItem("uploadedFileData") || localStorage.getItem("uploadedFileData");
    const storedFileName = sessionStorage.getItem("uploadedFileName") || localStorage.getItem("uploadedFileName");

    if (storedData && storedFileName) {
      try {
        const { base64 } = JSON.parse(storedData);
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], storedFileName, {
          type: "application/pdf"
        });

        const localUrl = URL.createObjectURL(file);

        setFile(file);
        setFileBase64(base64);
        setPreviewUrl(localUrl);
      } catch (error) {
        console.error("Error restoring file data:", error);
        resetFile();
      }
    }
  }, []);

  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error("Invalid file type. Only PDF files are allowed.");
    }

    if (file.size > MAX_TOTAL_SIZE) {
      throw new Error(`File size exceeds the maximum limit of ${MAX_TOTAL_SIZE / (1024 * 1024)}MB.`);
    }

    if (file.size === 0) {
      throw new Error("File is empty.");
    }
  };

  const processLargeFile = async (file: File): Promise<string> => {
    const sizeToProcess = Math.min(file.size, MAX_TOTAL_SIZE);
    const chunk = file.slice(0, sizeToProcess);

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
      reader.readAsDataURL(chunk);
    });
  };

  const updateFile = async (file: File | null) => {
    setError(null);
    setIsLoading(true);

    try {
      let newLocalUrl: string | null = null;
      if (file) {
        // Validate file before processing
        validateFile(file);
        newLocalUrl = URL.createObjectURL(file);
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // Reset state and clear storage data
      setFile(null);
      setFileBase64(null);
      setPreviewUrl(null);
      localStorage.removeItem("uploadedFileData");
      localStorage.removeItem("uploadedFileName");

      if (file) {
        const base64 = await processLargeFile(file);
        if (!base64) throw new Error("Failed to process file");

      // Try to store in sessionStorage first, fallback to memory if quota exceeded
      try {
        sessionStorage.setItem("uploadedFileData", JSON.stringify({ base64 }));
        sessionStorage.setItem("uploadedFileName", file.name);
      } catch (storageError) {
        console.warn("Storage quota exceeded, keeping file in memory only");
        // Clear any existing storage to free up space
        sessionStorage.removeItem("uploadedFileData");
        sessionStorage.removeItem("uploadedFileName");
        localStorage.removeItem("uploadedFileData");
        localStorage.removeItem("uploadedFileName");
      }

        // Update state
        setFile(file);
        setFileBase64(base64);
        setPreviewUrl(newLocalUrl);

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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setFileBase64(null);
    setPreviewUrl(null);
    setError(null);
    sessionStorage.removeItem("uploadedFileData");
    sessionStorage.removeItem("uploadedFileName");
    localStorage.removeItem("uploadedFileData");
    localStorage.removeItem("uploadedFileName");
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <UploadContext.Provider
      value={{
        file,
        fileBase64,
        previewUrl,
        isLoading,
        error,
        updateFile,
        resetFile,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
};
