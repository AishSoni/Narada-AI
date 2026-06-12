import { NextRequest, NextResponse } from 'next/server';
import { getStackStore } from '@/lib/stack-store';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string; documentId: string }> }
) {
  try {
    const { stackId, documentId } = await params;
    const sessionId = request.headers.get('x-narada-session') || undefined;
    const store = await getStackStore(sessionId);

    const success = store.deleteDocument(stackId, documentId);
    if (!success) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
