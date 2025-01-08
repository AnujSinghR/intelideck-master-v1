"use client";

import { useState, useCallback } from "react";
import { usePPTUpload } from "./PPTUploadContext";
import { Button } from "../ui/button";
import { Upload, X } from "lucide-react";

export function PPTUpload() {
  const { updateFile, error, isLoading } = usePPTUpload();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    try {
      await updateFile(file);
    } catch (err) {
      // Error is handled by context
      console.error('Error handling file:', err);
    }
  }, [updateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="relative">
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? "border-orange-500 bg-orange-50"
            : "border-gray-300 hover:border-orange-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pptx"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
        <div className="p-4 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
              <p className="mt-2 text-sm text-gray-500">Processing file...</p>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                <span className="font-semibold text-orange-600">Click to upload</span> or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-500">PowerPoint files only (.pptx)</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 rounded-md p-2 flex items-center">
          <span className="flex-1">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateFile(null)}
            className="ml-2 h-auto p-1 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
