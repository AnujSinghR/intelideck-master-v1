# File Upload Components

This directory contains components for handling file uploads, specifically for PDF and PowerPoint files. The components are organized into the following subdirectories:

## Directory Structure

### /viewers
- `PDFViewer.tsx` - Main PDF viewing component with features like zoom, navigation, and thumbnails
- `PPTViewer.tsx` - PowerPoint presentation viewer with slide navigation

### /contexts
- `UploadContext.tsx` - Context provider for PDF file uploads and management
- `PPTUploadContext.tsx` - Context provider for PowerPoint file uploads and management

### /extractors
- `PDFTextExtractor.tsx` - Extracts and formats text content from PDF files
- `PDFImageExtractor.tsx` - Extracts images from PDF files
- `PDFReskineExtractor.tsx` - Combined PDF content extractor (text + images)
- `PPTReskineExtractor.tsx` - PowerPoint content extractor (slides + images)

### /modals
- `FileUploadModal.tsx` - Reusable modal component for file uploads with drag & drop support

### /utils
- `FileUploadExample.tsx` - Example implementation (for reference)
- `FormattedPDFView.tsx` - Alternative PDF viewer implementation (experimental)

## Usage

The components are designed to work together but can also be used independently. The main workflow is:

1. Use `UploadContext` or `PPTUploadContext` to manage file state
2. Use `FileUploadModal` for the upload interface
3. Use appropriate viewer (`PDFViewer` or `PPTViewer`) to display the content
4. Use extractors as needed to process file content

## Example

```tsx
import { UploadProvider } from './contexts/UploadContext';
import { FileUploadModal } from './modals/FileUploadModal';
import { PDFViewer } from './viewers/PDFViewer';

function App() {
  return (
    <UploadProvider>
      <FileUploadModal />
      <PDFViewer />
    </UploadProvider>
  );
}
