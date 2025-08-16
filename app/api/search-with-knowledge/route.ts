import { NextRequest, NextResponse } from 'next/server';
import { unifiedSearchWithKnowledge } from '../../../lib/unified-search-with-knowledge';
import { SearchEvent } from '@/lib/langgraph-search-engine';

export async function POST(request: NextRequest) {
  try {
    const { query, context, knowledgeStackId } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' }, 
        { status: 400 }
      );
    }

    // Create a ReadableStream for the search response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await unifiedSearchWithKnowledge(
            query,
            context || [],
            knowledgeStackId,
            (event: SearchEvent) => {
              // Send each event to the client
              const chunk = JSON.stringify(event) + '\n';
              controller.enqueue(new TextEncoder().encode(chunk));
            }
          );
          
          controller.close();
        } catch (error) {
          console.error('Search error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
