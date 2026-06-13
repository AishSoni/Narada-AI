import { LangGraphSearchEngine, SearchEvent, ExtractedQuery, Source } from './langgraph-search-engine';
import { UnifiedSearchClient } from './unified-search-client';
import { getStackStore, StackStore } from './stack-store';
import { SearchResult } from './search-engine';
import { BYOKCredentials, resolveConfig, toLLMConfig } from './resolved-config';

export interface UnifiedSearchOptions {
  credentials?: BYOKCredentials;
  signal?: AbortSignal;
  stackStore?: StackStore;
  sessionId?: string;
}

interface KnowledgeSearchResponse {
  results: SearchResult[];
  totalFound: number;
  stackName: string;
}

async function searchKnowledgeStack(
  store: StackStore,
  stackId: string,
  query: string,
  config: ReturnType<typeof resolveConfig>
): Promise<KnowledgeSearchResponse> {
  const stack = store.getStackById(stackId);
  if (!stack) {
    const availableStacks = store.getAllStacks();
    if (availableStacks.length === 1) {
      const fallbackStack = availableStacks[0];
      const results = await store.searchDocuments(fallbackStack.id, query, 5, config);
      return { results, totalFound: results.length, stackName: fallbackStack.name };
    }
    throw new Error(`Knowledge stack with ID "${stackId}" not found. Please check that the stack exists and try again.`);
  }

  const results = await store.searchDocuments(stackId, query, 5, config);
  return { results, totalFound: results.length, stackName: stack.name };
}

export async function unifiedSearchWithKnowledge(
  query: string,
  context: Array<{ query: string; response: string }>,
  knowledgeStackId?: string,
  onEvent?: (event: SearchEvent) => void,
  options?: UnifiedSearchOptions
): Promise<void> {
  const config = resolveConfig(options?.credentials);
  const signal = options?.signal;
  const store = options?.stackStore ?? await getStackStore(options?.sessionId);

  const emit = (event: SearchEvent) => {
    if (signal?.aborted) return;
    onEvent?.(event);
  };

  try {
    if (signal?.aborted) return;

    const searchClient = new UnifiedSearchClient(config.searchApiKey, config.searchApiUrl);
    const searchEngine = new LangGraphSearchEngine(searchClient, {
      llmConfig: toLLMConfig(config),
      signal,
    });

    let searchTerms: string[] = [];

    emit({
      type: 'phase-update',
      phase: 'understanding',
      message: 'Breaking down your query into searchable terms...',
    });

    try {
      const extractedQueries: ExtractedQuery[] = await searchEngine.extractSubQueries(query);
      searchTerms = extractedQueries.map((sq) => sq.searchQuery);
      if (searchTerms.length > 1) {
        emit({ type: 'thinking', message: `I'll search for: ${searchTerms.join(', ')}` });
      }
    } catch (error) {
      console.warn('Failed to extract sub-queries, using original query:', error);
      searchTerms = [query];
    }

    let knowledgeResults: SearchResult[] = [];
    let knowledgeStackName = '';

    if (knowledgeStackId) {
      emit({
        type: 'phase-update',
        phase: 'understanding',
        message: 'Searching your knowledge stack...',
      });

      try {
        const allKnowledgeResults: SearchResult[] = [];
        const seenIds = new Set<string>();

        for (const searchTerm of searchTerms) {
          if (signal?.aborted) return;
          const knowledgeResponse = await searchKnowledgeStack(store, knowledgeStackId, searchTerm, config);
          for (const result of knowledgeResponse.results) {
            if (!seenIds.has(result.id)) {
              seenIds.add(result.id);
              allKnowledgeResults.push(result);
            }
          }
          if (!knowledgeStackName) knowledgeStackName = knowledgeResponse.stackName;
        }

        knowledgeResults = allKnowledgeResults.sort((a, b) => b.score - a.score).slice(0, 5);

        if (knowledgeResults.length > 0) {
          emit({
            type: 'thinking',
            message: `Found ${knowledgeResults.length} relevant documents in ${knowledgeStackName}`,
          });
        } else {
          emit({
            type: 'thinking',
            message: `No relevant documents found in ${knowledgeStackName}. Proceeding with web search.`,
          });
        }
      } catch (error) {
        console.error('Knowledge stack search error:', error);
        emit({
          type: 'error',
          error: error instanceof Error ? error.message : 'Knowledge stack search failed',
          errorType: 'search',
        });
        throw error;
      }
    }

    let webSources: Source[] = [];
    let finalAnswer = '';

    const wrappedOnEvent = (event: SearchEvent) => {
      if (signal?.aborted) return;
      if (event.type === 'final-result') {
        webSources = event.sources || [];
        finalAnswer = event.content;

        if (knowledgeResults.length > 0) {
          const knowledgeSources = knowledgeResults.map((result) => ({
            url: `knowledge://${result.name}`,
            title: `${result.name} (from ${knowledgeStackName})`,
            content: result.content,
            quality: result.score,
            summary: result.snippet,
          }));
          const combinedSources = [...knowledgeSources, ...webSources];
          const enhancedMessage = `Based on your knowledge stack "${knowledgeStackName}" and web sources:`;
          emit({
            type: 'final-result',
            content: `${enhancedMessage}\n\n${finalAnswer}`,
            sources: combinedSources,
            followUpQuestions: event.followUpQuestions,
          });
        } else {
          emit(event);
        }
      } else {
        emit(event);
      }
    };

    if (signal?.aborted) return;

    if (searchTerms.length > 0) {
      const extractedQueries: ExtractedQuery[] = searchTerms.map((term) => ({
        question: `Information about ${term}`,
        searchQuery: term,
      }));
      await searchEngine.searchWithExtractedQueries(query, wrappedOnEvent, context, extractedQueries);
    } else {
      await searchEngine.search(query, wrappedOnEvent, context);
    }
  } catch (error) {
    if (signal?.aborted) return;
    console.error('Unified search error:', error);
    emit({
      type: 'error',
      error: error instanceof Error ? error.message : 'Search failed',
      errorType: 'search',
    });
  }
}
