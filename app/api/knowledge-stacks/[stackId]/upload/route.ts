import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { knowledgeStackStore } from '@/lib/knowledge-stack-store';
import { extractTextFromFile, cleanText, chunkText } from '@/lib/text-extraction';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function POST(
  request: NextRequest,
  { params }: { params: { stackId: string } }
) {
  try {
    const stackId = params.stackId;
    
    // Check if stack exists
    const stack = knowledgeStackStore.getStackById(stackId);
    if (!stack) {
      return NextResponse.json(
        { error: 'Knowledge stack not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('documents') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedDocuments = [];

    for (const file of files) {
      try {
        // Extract text content
        const extractionResult = await extractTextFromFile(file);
        
        if (!extractionResult.success) {
          // Create failed document entry
          const document = {
            id: uuidv4(),
            stackId,
            name: file.name,
            type: file.type || 'unknown',
            size: formatFileSize(file.size),
            uploadedAt: new Date().toISOString(),
            status: 'failed' as const,
            content: `Extraction failed: ${extractionResult.error || 'Unknown error'}`
          };

          knowledgeStackStore.addDocument(document);
          uploadedDocuments.push(document);
          continue;
        }

        // Clean and process the extracted content
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
          metadata: extractionResult.metadata
        };

        knowledgeStackStore.addDocument(document);
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
          content: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };

        knowledgeStackStore.addDocument(document);
        uploadedDocuments.push(document);
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedDocuments.length,
      documents: uploadedDocuments
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    );
  }
}
