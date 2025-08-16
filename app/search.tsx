'use server';

import { createStreamableValue } from 'ai/rsc';
import { FirecrawlClient } from '@/lib/firecrawl';
import { LangGraphSearchEngine as SearchEngine, SearchEvent } from '@/lib/langgraph-search-engine';
import { getAppConfig } from '@/lib/app-config';

export async function search(query: string, context?: { query: string; response: string }[], apiKey?: string) {
  const stream = createStreamableValue<SearchEvent>();
  
  // Get current app configuration
  const appConfig = getAppConfig();
  
  // For now, we only support FireCrawl in the search engine
  // TODO: Implement Tavily and SERP search engine adapters
  let searchClient: FirecrawlClient;
  
  if (appConfig.searchProvider === 'firecrawl') {
    // Use provided API key or fall back to environment
    searchClient = new FirecrawlClient(apiKey || appConfig.searchApiKey);
  } else {
    // For other providers, fall back to FireCrawl with environment variable
    // This allows the app to continue working while other providers are being implemented
    searchClient = new FirecrawlClient(process.env.FIRECRAWL_API_KEY);
  }
  
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