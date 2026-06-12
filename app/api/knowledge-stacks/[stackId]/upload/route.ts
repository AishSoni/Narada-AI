import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getStackStore } from '@/lib/stack-store';
import { extractTextFromFile, cleanText, isAllowedFileType } from '@/lib/text-extraction';
import { getUploadLimits } from '@/lib/runtime';
import { isRateLimited } from '@/lib/rate-limit';
import { resolveConfig } from '@/lib/resolved-config';
import { ErrorType, handleNextError } from '@/lib/error-handler';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const rateLimit = await isRateLimited(request, 'knowledge-upload');
    if (!rateLimit.success) {
      return handleNextError(new Error('Rate limit exceeded'), ErrorType.RATE_LIMIT, 'knowledge-upload');
    }

    const { stackId } = await params;
    const sessionId = request.headers.get('x-narada-session') || undefined;
    const store = await getStackStore(sessionId);
    const config = resolveConfig();

    const stack = store.getStackById(stackId);
    if (!stack) {
      return handleNextError(new Error('Stack not found'), ErrorType.NOT_FOUND, 'knowledge-upload');
    }

    const formData = await request.formData();
    const files = formData.getAll('documents') as File[];
    const limits = getUploadLimits();

    if (!files || files.length === 0) {
      return handleNextError(new Error('No files provided'), ErrorType.VALIDATION, 'knowledge-upload');
    }

    if (files.length > limits.maxFiles) {
      return handleNextError(
        new Error(`Too many files. Maximum ${limits.maxFiles} per upload.`),
        ErrorType.VALIDATION,
        'knowledge-upload'
      );
    }

    const uploadedDocuments = [];

    for (const file of files) {
      if (file.size > limits.maxFileSizeBytes) {
        uploadedDocuments.push({
          id: uuidv4(),
          stackId,
          name: file.name,
          type: file.type || 'unknown',
          size: formatFileSize(file.size),
          uploadedAt: new Date().toISOString(),
          status: 'failed' as const,
          content: `File exceeds maximum size of ${formatFileSize(limits.maxFileSizeBytes)}`,
        });
        continue;
      }

      if (!isAllowedFileType(file)) {
        uploadedDocuments.push({
          id: uuidv4(),
          stackId,
          name: file.name,
          type: file.type || 'unknown',
          size: formatFileSize(file.size),
          uploadedAt: new Date().toISOString(),
          status: 'failed' as const,
          content: 'Unsupported file type',
        });
        continue;
      }

      try {
        const extractionResult = await extractTextFromFile(file);

        if (!extractionResult.success) {
          const document = {
            id: uuidv4(),
            stackId,
            name: file.name,
            type: file.type || 'unknown',
            size: formatFileSize(file.size),
            uploadedAt: new Date().toISOString(),
            status: 'failed' as const,
            content: extractionResult.error || 'Extraction failed',
          };
          store.addDocument(document, config);
          uploadedDocuments.push(document);
          continue;
        }

        const cleanContent = cleanText(extractionResult.content);
        const document = {
          id: uuidv4(),
          stackId,
          name: file.name,
          type: file.type || 'unknown',
          size: formatFileSize(file.size),
          uploadedAt: new Date().toISOString(),
          status: 'completed' as const,
          content: cleanContent,
          metadata: extractionResult.metadata,
        };

        store.addDocument(document, config);
        uploadedDocuments.push(document);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        const document = {
          id: uuidv4(),
          stackId,
          name: file.name,
          type: file.type || 'unknown',
          size: formatFileSize(file.size),
          uploadedAt: new Date().toISOString(),
          status: 'failed' as const,
          content: 'Processing failed',
        };
        store.addDocument(document, config);
        uploadedDocuments.push(document);
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedDocuments.length,
      documents: uploadedDocuments,
    });
  } catch (error) {
    return handleNextError(error, ErrorType.SERVER_ERROR, 'knowledge-upload');
  }
}
