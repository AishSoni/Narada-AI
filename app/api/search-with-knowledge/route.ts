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

    console.log('Search request:', { query, knowledgeStackId, hasContext: !!context });

    // Create a ReadableStream for the search response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting unified search with knowledge...');
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
          
          console.log('Search completed successfully');
          controller.close();
        } catch (error) {
          console.error('Search error:', error);
          const errorChunk = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Search failed',
            errorType: 'search'
          }) + '\n';
          controller.enqueue(new TextEncoder().encode(errorChunk));
          controller.close();
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
