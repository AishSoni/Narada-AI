import { NextRequest, NextResponse } from 'next/server';
import { knowledgeStackStore } from '@/lib/knowledge-stack-store';

function extractSnippet(content: string, query: string, maxLength = 200): string {
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const contentLower = content.toLowerCase();
  
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
  { params }: { params: { stackId: string } }
) {
  try {
    const stackId = params.stackId;
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

    // Search documents using the store
    const matchedDocuments = knowledgeStackStore.searchDocuments(stackId, query, limit);

    if (matchedDocuments.length === 0) {
      return NextResponse.json({
        results: [],
        totalFound: 0,
        stackName: stack.name,
        message: 'No documents found in this knowledge stack'
      });
    }

    // Transform to the expected format
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((word: string) => word.length > 2);
    
    const scoredResults = matchedDocuments.map(doc => {
      const contentLower = (doc.content || '').toLowerCase();
      let score = 0;
      
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          score += 1;
          // Bonus for exact matches
          if (contentLower.includes(word + ' ') || contentLower.includes(' ' + word)) {
            score += 0.5;
          }
        }
      }
      
      return {
        id: doc.id,
        name: doc.name,
        type: doc.type,
        score: queryWords.length > 0 ? score / queryWords.length : 0,
        content: doc.content || '',
        snippet: extractSnippet(doc.content || '', query)
      };
    });

    return NextResponse.json({
      results: scoredResults,
      totalFound: scoredResults.length,
      stackName: stack.name
    });
  } catch (error) {
    console.error('Error searching knowledge stack:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge stack' },
      { status: 500 }
    );
  }
}
