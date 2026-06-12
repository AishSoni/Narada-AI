import { NextRequest, NextResponse } from 'next/server';
import { getStackStore } from '@/lib/stack-store';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const { stackId } = await params;
    const sessionId = request.headers.get('x-narada-session') || undefined;
    const store = await getStackStore(sessionId);

    const success = store.deleteStack(stackId);
    if (!success) {
      return NextResponse.json({ error: 'Knowledge stack not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge stack:', error);
    return NextResponse.json({ error: 'Failed to delete knowledge stack' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const { stackId } = await params;
    const sessionId = request.headers.get('x-narada-session') || undefined;
    const store = await getStackStore(sessionId);

    const stack = store.getStackById(stackId);
    if (!stack) {
      return NextResponse.json({ error: 'Knowledge stack not found' }, { status: 404 });
    }

    return NextResponse.json(stack);
  } catch (error) {
    console.error('Error fetching knowledge stack:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge stack' }, { status: 500 });
  }
}
