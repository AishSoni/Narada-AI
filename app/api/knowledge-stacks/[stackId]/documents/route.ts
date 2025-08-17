import { NextRequest, NextResponse } from 'next/server';
import { knowledgeStackStore } from '@/lib/knowledge-stack-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const { stackId } = await params;
    
    const documents = knowledgeStackStore.getDocumentsByStackId(stackId);
    
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
