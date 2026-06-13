'use server';

import { createStreamableValue } from 'ai/rsc';
import { UnifiedSearchClient } from '@/lib/unified-search-client';
import { LangGraphSearchEngine as SearchEngine, SearchEvent } from '@/lib/langgraph-search-engine';
import { BYOKCredentials, resolveConfig, toLLMConfig } from '@/lib/resolved-config';

export async function search(
  query: string,
  context?: { query: string; response: string }[],
  credentials?: BYOKCredentials
) {
  const stream = createStreamableValue<SearchEvent>();
  const config = resolveConfig(credentials);
  const searchClient = new UnifiedSearchClient(config.searchApiKey);
  const searchEngine = new SearchEngine(searchClient, { llmConfig: toLLMConfig(config) });

  (async () => {
    try {
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
