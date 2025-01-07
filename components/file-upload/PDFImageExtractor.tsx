"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useUpload } from "./UploadContext";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

interface ExtractedImage {
  data: string;
  width: number;
  height: number;
  pageNumber: number;
  format: string;
  size: string;
}

export function PDFImageExtractor(): JSX.Element {
  const { file, fileBase64 } = useUpload();
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const extractImages = useCallback(async (pdf: PDFDocumentProxy) => {
    const extractedImages: ExtractedImage[] = [];
    const totalPages = pdf.numPages;
    setProgress({ current: 0, total: totalPages });

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const resources = await page.getOperatorList();
        const pageImages = new Set<string>();

        for (let i = 0; i < resources.fnArray.length; i++) {
          if (
            resources.fnArray[i] === pdfjsLib.OPS.paintImageXObject ||
            resources.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject
          ) {
            const imgName = resources.argsArray[i][0];
            if (imgName) pageImages.add(typeof imgName === "object" ? imgName.name : imgName);
          }
        }

        for (const imgName of pageImages) {
          try {
            const img = page.objs.get(imgName);

            if (img && typeof img === "object") {
              const canvas = document.createElement("canvas");
              let width = 0;
              let height = 0;

              if ("bitmap" in img && img.bitmap instanceof ImageBitmap) {
                width = img.bitmap.width;
                height = img.bitmap.height;
              } else if (
                "width" in img &&
                "height" in img &&
                typeof img.width === "number" &&
                typeof img.height === "number"
              ) {
                width = img.width;
                height = img.height;
              }

              if (width > 0 && height > 0) {
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");

                if (ctx) {
                  if ("bitmap" in img && img.bitmap instanceof ImageBitmap) {
                    ctx.drawImage(img.bitmap, 0, 0);
                  } else if ("data" in img && img.data instanceof Uint8Array) {
                    const imageData = ctx.createImageData(width, height);
                    const rgba = new Uint8ClampedArray(width * height * 4);
                    for (let i = 0, j = 0; i < img.data.length; i += 3, j += 4) {
                      rgba[j] = img.data[i];
                      rgba[j + 1] = img.data[i + 1];
                      rgba[j + 2] = img.data[i + 2];
                      rgba[j + 3] = 255;
                    }
                    imageData.data.set(rgba);
                    ctx.putImageData(imageData, 0, 0);
                  }

                  const dataUrl = canvas.toDataURL("image/png", 1.0);
                  extractedImages.push({
                    data: dataUrl,
                    width,
                    height,
                    pageNumber: pageNum,
                    format: "PNG",
                    size: formatBytes(dataUrl.length),
                  });
                }
              }
            }
          } catch (imgError) {
            console.warn(`Skipping unresolved image: ${imgName}`);
          }
        }

        setProgress((prev) => ({ ...prev, current: pageNum }));
        page.cleanup();
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
      }
    }

    return extractedImages;
  }, []);

  useEffect(() => {
    const processFile = async () => {
      if (!fileBase64) {
        setImages([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const byteArray = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));
        const pdf = await pdfjsLib.getDocument({
          data: byteArray,
          cMapUrl: "/cmaps/",
          cMapPacked: true,
        }).promise;

        const extractedImages = await extractImages(pdf);
        setImages(extractedImages);
        pdf.destroy();
      } catch (err) {
        console.error("Error processing PDF:", err);
        setError("Failed to extract images from the PDF. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    processFile();
  }, [fileBase64, extractImages]);

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Upload a PDF file to extract images</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Extracting Images</p>
          <p className="text-sm text-gray-500">
            Processing page {progress.current} of {progress.total}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No images found in this PDF</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {images.map((image, index) => (
        <div
          key={index}
          className="relative group bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="relative aspect-video bg-gray-100">
            <img
              src={image.data}
              alt={`Image from page ${image.pageNumber}`}
              className="object-contain w-full h-full"
            />
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Page {image.pageNumber}
                </p>
                <p className="text-xs text-gray-500">
                  {image.width} × {image.height} px
                </p>
              </div>
              <button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = image.data;
                  link.download = `image-page${image.pageNumber}-${Date.now()}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="p-2 text-gray-600 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
                title="Download image"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div className="text-xs text-gray-500">
              <p>Format: {image.format}</p>
              <p>Size: {image.size}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
