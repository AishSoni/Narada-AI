import { NextRequest, NextResponse } from 'next/server';
import { knowledgeStackStore } from '@/lib/knowledge-stack-store';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const { stackId } = await params;
    
    const success = knowledgeStackStore.deleteStack(stackId);
    if (!success) {
      return NextResponse.json(
        { error: 'Knowledge stack not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge stack:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge stack' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const { stackId } = await params;
    
    const stack = knowledgeStackStore.getStackById(stackId);
    if (!stack) {
      return NextResponse.json(
        { error: 'Knowledge stack not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stack);
  } catch (error) {
    console.error('Error fetching knowledge stack:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge stack' },
      { status: 500 }
    );
  }
}
