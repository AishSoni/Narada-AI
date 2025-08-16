// Text extraction utilities for different file types
// This will be used by the knowledge stack upload functionality

export interface ExtractionResult {
  success: boolean;
  content: string;
  error?: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    fileType: string;
  };
}

// Simple text extraction for supported formats
export async function extractTextFromFile(file: File): Promise<ExtractionResult> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  try {
    if (fileType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      const text = await file.text();
      return {
        success: true,
        content: text,
        metadata: {
          fileType: 'text',
          wordCount: text.split(/\s+/).length
        }
      };
    }
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // For now, return simulated content with better structure
      // In production, this would use pdf-parse or similar library
      const content = await simulatePdfExtraction(file);
      return {
        success: true,
        content,
        metadata: {
          fileType: 'pdf',
          pageCount: Math.ceil(file.size / 2000), // Rough estimate
          wordCount: content.split(/\s+/).length
        }
      };
    }
    
    if (fileType.includes('word') || fileName.endsWith('.docx')) {
      // Simulate DOCX extraction with better structure
      const content = await simulateDocxExtraction(file);
      return {
        success: true,
        content,
        metadata: {
          fileType: 'docx',
          wordCount: content.split(/\s+/).length
        }
      };
    }
    
    if (fileType.startsWith('image/') && (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg'))) {
      // Simulate OCR extraction
      const content = await simulateImageOcr(file);
      return {
        success: true,
        content,
        metadata: {
          fileType: 'image',
          wordCount: content.split(/\s+/).length
        }
      };
    }
    
    return {
      success: false,
      content: '',
      error: `Unsupported file type: ${fileType}. Supported formats: TXT, MD, PDF, DOCX, PNG, JPG, JPEG`
    };
    
  } catch (error) {
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    };
  }
}

async function simulatePdfExtraction(file: File): Promise<string> {
  // Create more realistic simulated content for PDFs
  const baseContent = `Document: ${file.name}
Source: PDF Document
File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB

This is a simulation of PDF text extraction. In a production environment, this would contain the actual text content extracted from the PDF file using libraries like pdf-parse or pdf2pic with OCR.

The extracted content would typically include:
- Document headers and titles
- Body text with proper paragraph structure
- Tables and lists (formatted as text)
- Metadata like author, creation date, etc.

To implement real PDF extraction, you would:
1. Install pdf-parse: npm install pdf-parse
2. Use it in a Node.js environment to extract text
3. Handle images within PDFs using OCR if needed
4. Preserve document structure and formatting

Example implementation:
\`\`\`javascript
import pdf from 'pdf-parse';
const buffer = await file.arrayBuffer();
const data = await pdf(Buffer.from(buffer));
return data.text;
\`\`\`

This simulated content represents what would be extracted from a typical PDF document.`;

  return baseContent;
}

async function simulateDocxExtraction(file: File): Promise<string> {
  const baseContent = `Document: ${file.name}
Source: Microsoft Word Document
File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB

This is a simulation of DOCX text extraction. In a production environment, this would contain the actual text content extracted from the Word document using libraries like mammoth.js.

The extracted content would typically include:
- Document text with proper formatting
- Headers and footers
- Tables and lists
- Comments and footnotes (optionally)

To implement real DOCX extraction, you would:
1. Install mammoth: npm install mammoth
2. Extract text while preserving structure
3. Handle embedded images and objects
4. Convert to plain text or maintain some formatting

Example implementation:
\`\`\`javascript
import mammoth from 'mammoth';
const buffer = await file.arrayBuffer();
const result = await mammoth.extractRawText({buffer: Buffer.from(buffer)});
return result.value;
\`\`\`

This simulated content represents structured text that would be extracted from a Word document.`;

  return baseContent;
}

async function simulateImageOcr(file: File): Promise<string> {
  const baseContent = `Image: ${file.name}
Source: Image file (${file.type})
File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB

This is a simulation of OCR text extraction from an image. In a production environment, this would contain the actual text recognized from the image using OCR libraries like Tesseract.js.

The OCR process would typically:
- Analyze the image for text regions
- Recognize characters and words
- Apply language models for accuracy
- Handle different fonts and layouts
- Extract text with confidence scores

To implement real OCR extraction, you would:
1. Install tesseract.js: npm install tesseract.js
2. Process the image through OCR
3. Clean and format the extracted text
4. Handle multiple languages if needed

Example implementation:
\`\`\`javascript
import Tesseract from 'tesseract.js';
const { data: { text } } = await Tesseract.recognize(file, 'eng');
return text;
\`\`\`

This simulated content represents text that would be extracted from an image containing text, documents, or screenshots.`;

  return baseContent;
}

// Utility function to chunk large text content for better vector embedding
export function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // If we're not at the end, try to break at a sentence or paragraph
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const lastSpace = text.lastIndexOf(' ', end);
      
      // Choose the best break point
      const breakPoint = Math.max(lastPeriod, lastNewline, lastSpace);
      if (breakPoint > start + maxChunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }
    
    chunks.push(text.substring(start, end).trim());
    start = Math.max(start + 1, end - overlap); // Ensure progress with overlap
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

// Clean and normalize text content
export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Reduce excessive newlines
    .replace(/[ \t]{2,}/g, ' ') // Reduce excessive spaces
    .trim();
}
