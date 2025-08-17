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
  try {
    // Check if stack exists
    const stack = knowledgeStackStore.getStackById(stackId);
    if (!stack) {
      const availableStacks = knowledgeStackStore.getAllStacks();
      console.warn(`Knowledge stack with ID "${stackId}" not found. Available stacks:`, availableStacks.map(s => ({ id: s.id, name: s.name })));
      
      // If there's exactly one stack available, use it instead
      if (availableStacks.length === 1) {
        const fallbackStack = availableStacks[0];
        console.log(`Using fallback stack: ${fallbackStack.id} - "${fallbackStack.name}"`);
        
        // Search documents using the fallback stack
        const results = await knowledgeStackStore.searchDocuments(fallbackStack.id, query, 5);
        
        return {
          results,
          totalFound: results.length,
          stackName: fallbackStack.name
        };
      }
      
      throw new Error(`Knowledge stack with ID "${stackId}" not found. Please check that the stack exists and try again.`);
    }

    // Search documents using the improved search engine with vector embeddings
    const results = await knowledgeStackStore.searchDocuments(stackId, query, 5);

    return {
      results,
      totalFound: results.length,
      stackName: stack.name
    };
  } catch (error) {
    console.error(`Error in searchKnowledgeStack for stackId ${stackId}:`, error);
    throw error;
  }
}

export async function unifiedSearchWithKnowledge(
  query: string,
  context: Array<{ query: string; response: string }>,
  knowledgeStackId?: string,
  onEvent?: (event: SearchEvent) => void
): Promise<void> {
  try {
    console.log('Starting unifiedSearchWithKnowledge with:', { query, knowledgeStackId, hasContext: !!context, hasOnEvent: !!onEvent });
    
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
        console.log(`Searching knowledge stack: ${knowledgeStackId}`);
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
        if (onEvent) {
          onEvent({
            type: 'error',
            error: error instanceof Error ? error.message : 'Knowledge stack search failed',
            errorType: 'search'
          });
        }
        throw error; // Re-throw to be handled by the outer try-catch
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
