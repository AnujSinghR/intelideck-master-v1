"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

interface UploadContextType {
  file: File | null;
  fileBase64: string | null;
  previewUrl: string | null;
  updateFile: (file: File | null) => Promise<void>;
  resetFile: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const MAX_CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB total limit

export const UploadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Restore file data from localStorage
  React.useEffect(() => {
    const storedData = localStorage.getItem("uploadedFileData");
    const storedFileName = localStorage.getItem("uploadedFileName");

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
          type: "application/pdf" // You can modify this for other file types
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
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(chunk);
    });
  };

  const updateFile = async (file: File | null) => {
    try {
      let newLocalUrl: string | null = null;
      if (file) {
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

        // Store in localStorage
        localStorage.setItem("uploadedFileData", JSON.stringify({ base64 }));
        localStorage.setItem("uploadedFileName", file.name);

        // Update state
        setFile(file);
        setFileBase64(base64);
        setPreviewUrl(newLocalUrl);

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Error processing file:", error);
      resetFile();
      throw error;
    }
  };

  const resetFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setFileBase64(null);
    setPreviewUrl(null);
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
