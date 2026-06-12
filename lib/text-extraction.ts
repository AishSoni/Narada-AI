import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';
import { isLocal } from './runtime';

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

const ALLOWED_EXTENSIONS = new Set(['.txt', '.md', '.pdf', '.docx', '.png', '.jpg', '.jpeg']);

export function isAllowedFileType(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return [...ALLOWED_EXTENSIONS].some((ext) => fileName.endsWith(ext));
}

export async function extractTextFromFile(file: File): Promise<ExtractionResult> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  if (!isAllowedFileType(file)) {
    return {
      success: false,
      content: '',
      error: `Unsupported file type. Supported formats: TXT, MD, PDF, DOCX${isLocal() ? ', PNG, JPG, JPEG' : ''}`,
    };
  }

  try {
    if (fileType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      const text = await file.text();
      return {
        success: true,
        content: text,
        metadata: { fileType: 'text', wordCount: text.split(/\s+/).length },
      };
    }

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const buffer = await file.arrayBuffer();
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text, totalPages } = await extractText(pdf, { mergePages: true });
      const content = Array.isArray(text) ? text.join('\n\n') : text;
      return {
        success: true,
        content,
        metadata: { fileType: 'pdf', pageCount: totalPages, wordCount: content.split(/\s+/).length },
      };
    }

    if (
      fileType.includes('word') ||
      fileName.endsWith('.docx') ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const buffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      const content = result.value;
      return {
        success: true,
        content,
        metadata: { fileType: 'docx', wordCount: content.split(/\s+/).length },
      };
    }

    if (
      isLocal() &&
      fileType.startsWith('image/') &&
      (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg'))
    ) {
      const Tesseract = await import('tesseract.js');
      const { data } = await Tesseract.recognize(file, 'eng');
      const content = data.text;
      return {
        success: true,
        content,
        metadata: { fileType: 'image', wordCount: content.split(/\s+/).length },
      };
    }

    return {
      success: false,
      content: '',
      error: isLocal()
        ? `Unsupported file type: ${fileType || fileName}`
        : 'Image OCR is only available in local mode. Upload PDF or DOCX instead.',
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : 'Unknown extraction error',
    };
  }
}

export function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
  if (text.length <= maxChunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChunkSize;
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const lastSpace = text.lastIndexOf(' ', end);
      const breakPoint = Math.max(lastPeriod, lastNewline, lastSpace);
      if (breakPoint > start + maxChunkSize * 0.5) end = breakPoint + 1;
    }
    chunks.push(text.substring(start, end).trim());
    start = Math.max(start + 1, end - overlap);
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
