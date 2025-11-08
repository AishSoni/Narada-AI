import { LangGraphSearchEngine, SearchEvent, ExtractedQuery, Source } from './langgraph-search-engine';
import { UnifiedSearchClient } from './unified-search-client';
import { knowledgeStackStore } from './knowledge-stack-store';
import { SearchResult } from './search-engine';

interface KnowledgeSearchResponse {
  results: SearchResult[];
  totalFound: number;
  stackName: string;
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

/**
 * Unified search function that performs RAG search first, then web search.
 * 
 * IMPORTANT FIX: This function now ensures that both RAG and web search use the same 
 * searchable terms by first breaking down the user's query into searchable terms 
 * (just like the web search does), and then using those same terms for both searches.
 * 
 * Previously, RAG search used the raw user query while web search broke it down into
 * searchable terms, leading to inconsistent search behavior.
 */
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

    // First, break down the user query into searchable terms
    // This ensures both RAG and web search use the same searchable terms
    let searchTerms: string[] = [];
    
    if (onEvent) {
      onEvent({
        type: 'phase-update',
        phase: 'understanding',
        message: 'Breaking down your query into searchable terms...'
      });
    }

    try {
      // Extract sub-queries to get searchable terms (same as LangGraphSearchEngine does)
      const extractedQueries: ExtractedQuery[] = await searchEngine.extractSubQueries(query);
      searchTerms = extractedQueries.map(sq => sq.searchQuery);
      
      console.log(`[RAG_WEB_SYNC] Extracted search terms from query "${query}":`, searchTerms);
      
      if (onEvent && searchTerms.length > 1) {
        onEvent({
          type: 'thinking',
          message: `I'll search for: ${searchTerms.join(', ')}`
        });
      }
    } catch (error) {
      console.warn('Failed to extract sub-queries, using original query:', error);
      searchTerms = [query]; // Fallback to original query
    }

    // If a knowledge stack is selected, search it first using the extracted search terms
    let knowledgeResults: SearchResult[] = [];
    let knowledgeStackName = '';

    if (knowledgeStackId && onEvent) {
      onEvent({
        type: 'phase-update',
        phase: 'understanding',
        message: 'Searching your knowledge stack...'
      });

      try {
        console.log(`Searching knowledge stack: ${knowledgeStackId} with terms: ${searchTerms.join(', ')}`);
        console.log(`[RAG_WEB_SYNC] Using search terms for RAG search:`, searchTerms);
        
        // Search knowledge stack using each search term and combine results
        const allKnowledgeResults: SearchResult[] = [];
        const seenIds = new Set<string>();
        
        for (const searchTerm of searchTerms) {
          const knowledgeResponse = await searchKnowledgeStack(knowledgeStackId, searchTerm);
          
          // Add unique results to avoid duplicates
          for (const result of knowledgeResponse.results) {
            if (!seenIds.has(result.id)) {
              seenIds.add(result.id);
              allKnowledgeResults.push(result);
            }
          }
          
          if (!knowledgeStackName) {
            knowledgeStackName = knowledgeResponse.stackName;
          }
        }
        
        // Sort by relevance score and take top results
        knowledgeResults = allKnowledgeResults
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

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

    // Perform web search using the same extracted search terms
    let webSources: Source[] = [];
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

    // Start web search using the same extracted search queries for consistency
    if (searchTerms.length > 0) {
      console.log(`[RAG_WEB_SYNC] Using same search terms for web search:`, searchTerms);
      
      // Convert search terms back to the format expected by LangGraphSearchEngine
      const extractedQueries: ExtractedQuery[] = searchTerms.map(term => ({
        question: `Information about ${term}`,
        searchQuery: term
      }));
      
      await searchEngine.searchWithExtractedQueries(query, wrappedOnEvent, context, extractedQueries);
    } else {
      console.log(`[RAG_WEB_SYNC] No search terms extracted, falling back to original query`);
      // Fallback to regular search if no terms were extracted
      await searchEngine.search(query, wrappedOnEvent, context);
    }

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
