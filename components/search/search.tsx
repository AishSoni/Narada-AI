'use server';

import { createStreamableValue } from 'ai/rsc';
import { UnifiedSearchClient } from '@/lib/unified-search-client';
import { LangGraphSearchEngine as SearchEngine, SearchEvent } from '@/lib/langgraph-search-engine';

export async function search(query: string, context?: { query: string; response: string }[], apiKey?: string) {
  const stream = createStreamableValue<SearchEvent>();
  
  // Create unified search client that handles all providers
  const searchClient = new UnifiedSearchClient(apiKey);
  const searchEngine = new SearchEngine(searchClient);

  // Run search in background
  (async () => {
    try {
      // Stream events as they happen
      await searchEngine.search(query, (event) => {
        stream.update(event);
      }, context);
      
      stream.done();
    } catch (error) {
      stream.error(error);
    }
  })();

  return { stream: stream.value };
}