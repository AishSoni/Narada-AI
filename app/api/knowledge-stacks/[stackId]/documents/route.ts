import { NextRequest, NextResponse } from 'next/server';
import { getStackStore } from '@/lib/stack-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const { stackId } = await params;
    const sessionId = request.headers.get('x-narada-session') || undefined;
    const store = await getStackStore(sessionId);

    return NextResponse.json(store.getDocumentsByStackId(stackId));
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
