import { NextRequest, NextResponse } from 'next/server';
import { unifiedSearchWithKnowledge } from '../../../lib/unified-search-with-knowledge';
import { SearchEvent } from '@/lib/langgraph-search-engine';
import { isRateLimited } from '@/lib/rate-limit';
import { isHosted } from '@/lib/runtime';
import { BYOKCredentials } from '@/lib/resolved-config';
import { ErrorType, handleNextError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await isRateLimited(request, 'search-with-knowledge');
    if (!rateLimit.success) {
      return handleNextError(new Error('Rate limit exceeded'), ErrorType.RATE_LIMIT, 'search-with-knowledge');
    }

    const body = await request.json();
    const { query, context, knowledgeStackId, credentials } = body as {
      query: string;
      context?: Array<{ query: string; response: string }>;
      knowledgeStackId?: string;
      credentials?: BYOKCredentials;
    };

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (isHosted() && !credentials?.searchApiKey && !credentials?.llmApiKey) {
      return NextResponse.json(
        { error: 'API credentials are required in hosted mode (BYOK)' },
        { status: 400 }
      );
    }

    const sessionId = request.headers.get('x-narada-session') || undefined;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let closed = false;

        const safeEnqueue = (event: SearchEvent) => {
          if (closed || request.signal.aborted) return;
          try {
            controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
          } catch {
            closed = true;
          }
        };

        const onAbort = () => {
          closed = true;
          try {
            controller.close();
          } catch {
            // already closed
          }
        };
        request.signal.addEventListener('abort', onAbort, { once: true });

        try {
          await unifiedSearchWithKnowledge(
            query,
            context || [],
            knowledgeStackId,
            safeEnqueue,
            { credentials, signal: request.signal, sessionId }
          );
          if (!closed && !request.signal.aborted) {
            controller.close();
          }
        } catch (error) {
          if (!closed && !request.signal.aborted) {
            safeEnqueue({
              type: 'error',
              error: error instanceof Error ? error.message : 'Search failed',
              errorType: 'search',
            });
            controller.close();
          }
        } finally {
          request.signal.removeEventListener('abort', onAbort);
        }
      },
      cancel() {
        // Client disconnected
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return handleNextError(error, ErrorType.SERVER_ERROR, 'search-with-knowledge');
  }
}
