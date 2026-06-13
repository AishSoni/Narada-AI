import { NextRequest, NextResponse } from 'next/server';
import { getStackStore } from '@/lib/stack-store';
import { isRateLimited } from '@/lib/rate-limit';
import { resolveConfig } from '@/lib/resolved-config';
import { ErrorType, handleNextError } from '@/lib/error-handler';

function extractSnippet(content: string, query: string, maxLength = 200): string {
  const queryWords = query.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
  let bestPosition = 0;
  let bestScore = 0;

  for (let i = 0; i < content.length - maxLength; i += 50) {
    const snippet = content.substring(i, i + maxLength).toLowerCase();
    let score = 0;
    for (const word of queryWords) {
      if (snippet.includes(word)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestPosition = i;
    }
  }

  let snippet = content.substring(bestPosition, bestPosition + maxLength);
  const firstSpace = snippet.indexOf(' ');
  if (firstSpace > 0 && firstSpace < 50) snippet = snippet.substring(firstSpace + 1);
  const lastSpace = snippet.lastIndexOf(' ');
  if (lastSpace > maxLength - 50) snippet = snippet.substring(0, lastSpace);
  return snippet.trim() + (bestPosition + maxLength < content.length ? '...' : '');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const rateLimit = await isRateLimited(request, 'knowledge-search');
    if (!rateLimit.success) {
      return handleNextError(new Error('Rate limit exceeded'), ErrorType.RATE_LIMIT, 'knowledge-search');
    }

    const { stackId } = await params;
    const { query, limit = 5 } = await request.json();
    const sessionId = request.headers.get('x-narada-session') || undefined;
    const store = await getStackStore(sessionId);
    const config = resolveConfig();

    if (!query || !query.trim()) {
      return handleNextError(new Error('Query is required'), ErrorType.VALIDATION, 'knowledge-search');
    }

    const stack = store.getStackById(stackId);
    if (!stack) {
      return handleNextError(new Error('Knowledge stack not found'), ErrorType.NOT_FOUND, 'knowledge-search');
    }

    const searchResults = await store.searchDocuments(stackId, query, limit, config);

    if (searchResults.length === 0) {
      return NextResponse.json({
        results: [],
        totalFound: 0,
        stackName: stack.name,
        message: 'No documents found in this knowledge stack',
        searchType: 'vector_and_keyword',
      });
    }

    const results = searchResults.map((result) => ({
      id: result.id,
      name: result.name,
      type: result.metadata?.fileType || 'unknown',
      score: result.score,
      content: result.content,
      snippet: extractSnippet(result.content, query),
    }));

    return NextResponse.json({
      results,
      totalFound: results.length,
      stackName: stack.name,
      searchType: 'vector_and_keyword',
    });
  } catch (error) {
    return handleNextError(error, ErrorType.SERVER_ERROR, 'knowledge-search');
  }
}
