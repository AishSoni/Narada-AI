'use server';

import { createStreamableValue } from 'ai/rsc';
import { SearchEvent } from '@/lib/langgraph-search-engine';
import { unifiedSearchWithKnowledge } from '@/lib/unified-search-with-knowledge';

export async function searchWithKnowledge(
  query: string, 
  context?: Array<{ query: string; response: string }>,
  knowledgeStackId?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _firecrawlApiKey?: string
) {
  const stream = createStreamableValue<SearchEvent>();

  // Handle the search in the background
  (async () => {
    try {
      await unifiedSearchWithKnowledge(
        query,
        context || [],
        knowledgeStackId,
        (event: SearchEvent) => {
          stream.update(event);
        }
      );
    } catch (error) {
      console.error('Search with knowledge error:', error);
      stream.update({
        type: 'error',
        error: error instanceof Error ? error.message : 'Search failed',
        errorType: 'search'
      });
    } finally {
      stream.done();
    }
  })();

  return {
    stream: stream.value
  };
}
