/**
 * File Upload Component Structure
 * 
 * /viewers
 * - PDFViewer.tsx - Main PDF viewing component with zoom, navigation, and thumbnail features
 * - PPTViewer.tsx - PowerPoint presentation viewer with slide navigation
 * 
 * /contexts
 * - UploadContext.tsx - Context provider for PDF file uploads and management
 * - PPTUploadContext.tsx - Context provider for PowerPoint file uploads and management
 * 
 * /extractors
 * - PDFTextExtractor.tsx - Extracts text content from PDF files
 * - PDFImageExtractor.tsx - Extracts images from PDF files
 * - PDFReskineExtractor.tsx - Specialized PDF content extractor
 * - PPTReskineExtractor.tsx - Specialized PowerPoint content extractor
 * 
 * /modals
 * - FileUploadModal.tsx - Reusable modal component for file uploads with drag & drop
 * 
 * /utils (experimental/unused components)
 * - FileUploadExample.tsx - Example implementation of file upload
 * - FormattedPDFView.tsx - Alternative PDF viewer implementation
 */

// Viewers
export { PDFViewer } from './viewers/PDFViewer';
export { PPTViewer } from './viewers/PPTViewer';

// Contexts
export { useUpload, UploadProvider } from './contexts/UploadContext';
export { usePPTUpload, PPTUploadProvider } from './contexts/PPTUploadContext';

// Modals
export { FileUploadModal } from './modals/FileUploadModal';

// Extractors
export { PDFTextExtractor } from './extractors/PDFTextExtractor';
export { PDFImageExtractor } from './extractors/PDFImageExtractor';
export { PDFReskineExtractor } from './extractors/PDFReskineExtractor';
export { PPTReskineExtractor } from './extractors/PPTReskineExtractor';

// Utils
export { default as FileUploadExample } from './utils/FileUploadExample';
export { FormattedPDFView } from './utils/FormattedPDFView';
