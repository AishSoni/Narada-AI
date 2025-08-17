/* eslint-disable @typescript-eslint/no-explicit-any */
import { FirecrawlClient } from './firecrawl';
import { TavilyClient } from './tavily';
import { SerpClient } from './serp';
import { DuckDuckGoClient } from './duckduckgo';
import { getAppConfig } from './app-config';
import { API_PROVIDERS } from './config';

export interface UnifiedSearchResult {
  url: string;
  title: string;
  description: string;
  markdown: string;
  html: string;
  links: string[];
  screenshot: string | null;
  metadata: any;
  scraped: boolean;
  content: string;
  favicon: string;
}

export interface UnifiedSearchResponse {
  data: UnifiedSearchResult[];
  results: any[];
  metadata: any;
}

export interface UnifiedScrapeResult {
  markdown: string;
  html: string;
  metadata: any;
  success: boolean;
  error?: string;
}

export interface SearchClientInterface {
  search(query: string, options?: any): Promise<any>;
  scrapeUrl(url: string, timeoutMs?: number): Promise<UnifiedScrapeResult>;
  formatResults?(response: any): UnifiedSearchResponse;
}

export class UnifiedSearchClient implements SearchClientInterface {
  private client: SearchClientInterface;
  private provider: string;

  constructor(providedApiKey?: string) {
    const config = getAppConfig();
    this.provider = config.searchProvider;
    
    switch (this.provider) {
      case API_PROVIDERS.SEARCH.FIRECRAWL:
        this.client = new FirecrawlClient(providedApiKey || config.searchApiKey);
        break;
      case API_PROVIDERS.SEARCH.TAVILY:
        this.client = new TavilyClient(providedApiKey || config.searchApiKey);
        break;
      case API_PROVIDERS.SEARCH.SERP:
        this.client = new SerpClient(providedApiKey || config.searchApiKey);
        break;
      case API_PROVIDERS.SEARCH.DUCKDUCKGO:
        this.client = new DuckDuckGoClient(providedApiKey || config.searchApiKey);
        break;
      default:
        // Fallback to FireCrawl
        this.client = new FirecrawlClient(providedApiKey || process.env.FIRECRAWL_API_KEY);
        this.provider = API_PROVIDERS.SEARCH.FIRECRAWL;
    }
  }

  async search(query: string, options?: any): Promise<UnifiedSearchResponse> {
    try {
      // Transform options based on provider
      let providerOptions = options;
      
      if (this.client instanceof TavilyClient) {
        // Convert FireCrawl options to Tavily format
        providerOptions = {
          max_results: options?.limit || 10,
          search_depth: 'advanced',
          include_raw_content: true,
          include_answer: true,
        };
      } else if (this.client instanceof SerpClient) {
        // Convert FireCrawl options to SERP format
        providerOptions = {
          num: options?.limit || 10,
          gl: 'us',
          hl: 'en',
        };
      } else if (this.client instanceof DuckDuckGoClient) {
        // Convert options to DuckDuckGo format
        providerOptions = {
          max_results: options?.limit || 10,
          region: 'us-en',
          safesearch: 'moderate',
        };
      }
      
      const response = await this.client.search(query, providerOptions);
      
      // Format results based on provider
      if (this.client instanceof FirecrawlClient) {
        return response; // FireCrawl already returns the expected format
      } else if (this.client instanceof TavilyClient) {
        return this.client.formatResults(response);
      } else if (this.client instanceof SerpClient) {
        return this.client.formatResults(response);
      } else if (this.client instanceof DuckDuckGoClient) {
        return this.client.formatResults(response);
      }
      
      return response;
    } catch (error: any) {
      throw new Error(`Search failed with ${this.provider}: ${error.message}`);
    }
  }

  async scrapeUrl(url: string, timeoutMs: number = 15000): Promise<UnifiedScrapeResult> {
    try {
      return await this.client.scrapeUrl(url, timeoutMs);
    } catch (error: any) {
      throw new Error(`Scraping failed with ${this.provider}: ${error.message}`);
    }
  }

  getProvider(): string {
    return this.provider;
  }

  // Map URL functionality (only available for FireCrawl)
  async mapUrl(url: string, options?: { search?: string; limit?: number }) {
    if (this.client instanceof FirecrawlClient) {
      return await this.client.mapUrl(url, options);
    }
    
    // For other providers, we can simulate mapping by searching for the domain
    if (this.client instanceof TavilyClient || this.client instanceof SerpClient) {
      const domain = new URL(url).hostname;
      const searchResult = await this.search(`site:${domain}`, { max_results: options?.limit || 10 });
      
      return {
        links: searchResult.data.map(result => ({
          url: result.url,
          title: result.title,
        })),
        metadata: {
          domain,
          provider: this.provider,
        },
      };
    }
    
    throw new Error(`Map URL not supported for provider: ${this.provider}`);
  }
}
