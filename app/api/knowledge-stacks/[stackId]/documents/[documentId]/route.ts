import { NextRequest, NextResponse } from 'next/server';
import { knowledgeStackStore } from '@/lib/knowledge-stack-store';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { stackId: string; documentId: string } }
) {
  try {
    const { stackId, documentId } = params;
    
    const success = knowledgeStackStore.deleteDocument(stackId, documentId);
    if (!success) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
