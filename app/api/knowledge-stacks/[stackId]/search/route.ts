import { NextRequest, NextResponse } from 'next/server';
import { knowledgeStackStore } from '@/lib/knowledge-stack-store';

function extractSnippet(content: string, query: string, maxLength = 200): string {
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  
  // Find the best position to extract snippet from
  let bestPosition = 0;
  let bestScore = 0;
  
  for (let i = 0; i < content.length - maxLength; i += 50) {
    const snippet = content.substring(i, i + maxLength).toLowerCase();
    let score = 0;
    
    for (const word of queryWords) {
      if (snippet.includes(word)) {
        score += 1;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestPosition = i;
    }
  }
  
  let snippet = content.substring(bestPosition, bestPosition + maxLength);
  
  // Try to start at a word boundary
  const firstSpace = snippet.indexOf(' ');
  if (firstSpace > 0 && firstSpace < 50) {
    snippet = snippet.substring(firstSpace + 1);
  }
  
  // Try to end at a word boundary
  const lastSpace = snippet.lastIndexOf(' ');
  if (lastSpace > maxLength - 50) {
    snippet = snippet.substring(0, lastSpace);
  }
  
  return snippet.trim() + (bestPosition + maxLength < content.length ? '...' : '');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    const { stackId } = await params;
    const { query, limit = 5 } = await request.json();
    
    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check if stack exists
    const stack = knowledgeStackStore.getStackById(stackId);
    if (!stack) {
      return NextResponse.json(
        { error: 'Knowledge stack not found' },
        { status: 404 }
      );
    }

    // Search documents using vector embeddings and fallback to TF-IDF
    const searchResults = await knowledgeStackStore.searchDocuments(stackId, query, limit);

    if (searchResults.length === 0) {
      return NextResponse.json({
        results: [],
        totalFound: 0,
        stackName: stack.name,
        message: 'No documents found in this knowledge stack',
        searchType: 'vector_and_keyword'
      });
    }

    // Transform results to the expected format with snippets
    const results = searchResults.map(result => ({
      id: result.id,
      name: result.name,
      type: result.metadata?.fileType || 'unknown',
      score: result.score,
      content: result.content,
      snippet: extractSnippet(result.content, query)
    }));

    return NextResponse.json({
      results,
      totalFound: results.length,
      stackName: stack.name,
      searchType: 'vector_and_keyword'
    });
  } catch (error) {
    console.error('Error searching knowledge stack:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge stack' },
      { status: 500 }
    );
  }
}
