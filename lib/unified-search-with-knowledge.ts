import { LangGraphSearchEngine, SearchEvent } from './langgraph-search-engine';
import { UnifiedSearchClient } from './unified-search-client';
import { knowledgeStackStore } from './knowledge-stack-store';
import { SearchResult } from './search-engine';

interface KnowledgeSearchResponse {
  results: SearchResult[];
  totalFound: number;
  stackName: string;
}

function extractSnippet(content: string, query: string, maxLength = 200): string {
  const queryWords = query.toLowerCase().split(/\s+/).filter((word: string) => word.length > 2);
  
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

async function searchKnowledgeStack(stackId: string, query: string): Promise<KnowledgeSearchResponse> {
  // Check if stack exists
  const stack = knowledgeStackStore.getStackById(stackId);
  if (!stack) {
    throw new Error('Knowledge stack not found');
  }

  // Search documents using the improved search engine
  const results = knowledgeStackStore.searchDocuments(stackId, query, 5);

  return {
    results,
    totalFound: results.length,
    stackName: stack.name
  };
}

export async function unifiedSearchWithKnowledge(
  query: string,
  context: Array<{ query: string; response: string }>,
  knowledgeStackId?: string,
  onEvent?: (event: SearchEvent) => void
): Promise<void> {
  try {
    // Initialize search client
    const searchClient = new UnifiedSearchClient();
    const searchEngine = new LangGraphSearchEngine(searchClient);

    // If a knowledge stack is selected, search it first
    let knowledgeResults: SearchResult[] = [];
    let knowledgeStackName = '';

    if (knowledgeStackId && onEvent) {
      onEvent({
        type: 'phase-update',
        phase: 'understanding',
        message: 'Searching your knowledge stack...'
      });

      try {
        const knowledgeResponse = await searchKnowledgeStack(knowledgeStackId, query);
        knowledgeResults = knowledgeResponse.results;
        knowledgeStackName = knowledgeResponse.stackName;

        if (knowledgeResults.length > 0) {
          onEvent({
            type: 'thinking',
            message: `Found ${knowledgeResults.length} relevant documents in ${knowledgeStackName} (scores: ${knowledgeResults.map(r => r.score.toFixed(2)).join(', ')})`
          });
        } else {
          onEvent({
            type: 'thinking',
            message: `No relevant documents found in ${knowledgeStackName}. Proceeding with web search.`
          });
        }
      } catch (error) {
        console.error('Knowledge stack search error:', error);
        onEvent({
          type: 'thinking',
          message: 'Knowledge stack search failed. Proceeding with web search only.'
        });
      }
    }

    // Perform web search
    let webSources: any[] = [];
    let finalAnswer = '';

    const wrappedOnEvent = (event: SearchEvent) => {
      if (event.type === 'final-result') {
        webSources = event.sources || [];
        finalAnswer = event.content;

        // Combine knowledge stack results with web sources
        if (knowledgeResults.length > 0) {
          // Transform knowledge results to source format
          const knowledgeSources = knowledgeResults.map((result) => ({
            url: `knowledge://${result.name}`,
            title: `${result.name} (from ${knowledgeStackName})`,
            content: result.content,
            quality: result.score,
            summary: result.snippet
          }));

          // Combine sources, prioritizing knowledge stack results
          const combinedSources = [...knowledgeSources, ...webSources];
          
          // Generate enhanced answer that mentions both sources
          const enhancedMessage = knowledgeResults.length > 0 
            ? `Based on your knowledge stack "${knowledgeStackName}" and web sources:`
            : '';

          if (onEvent) {
            onEvent({
              type: 'final-result',
              content: enhancedMessage ? `${enhancedMessage}\n\n${finalAnswer}` : finalAnswer,
              sources: combinedSources,
              followUpQuestions: event.followUpQuestions
            });
          }
        } else {
          // No knowledge results, pass through web search results
          if (onEvent) {
            onEvent(event);
          }
        }
      } else {
        // Pass through other events
        if (onEvent) {
          onEvent(event);
        }
      }
    };

    // Start web search
    await searchEngine.search(query, wrappedOnEvent, context);

  } catch (error) {
    console.error('Unified search error:', error);
    if (onEvent) {
      onEvent({
        type: 'error',
        error: error instanceof Error ? error.message : 'Search failed',
        errorType: 'search'
      });
    }
  }
}
