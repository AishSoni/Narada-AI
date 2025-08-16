/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TavilySearchOptions {
  search_depth?: 'basic' | 'advanced';
  max_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
  include_answer?: boolean;
  include_raw_content?: boolean;
  include_images?: boolean;
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
}

export interface TavilySearchResponse {
  answer?: string;
  query: string;
  response_time: number;
  images?: string[];
  results: TavilySearchResult[];
}

export class TavilyClient {
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';

  constructor(providedApiKey?: string) {
    const apiKey = providedApiKey || process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error('TAVILY_API_KEY is required - either provide it or set it as an environment variable');
    }
    this.apiKey = apiKey;
  }

  async search(query: string, options?: TavilySearchOptions): Promise<TavilySearchResponse> {
    try {
      const searchOptions: any = {
        api_key: this.apiKey,
        query,
        search_depth: options?.search_depth || 'basic',
        max_results: options?.max_results || 10,
        include_answer: options?.include_answer ?? true,
        include_raw_content: options?.include_raw_content ?? true,
        include_images: options?.include_images ?? false,
      };

      if (options?.include_domains) {
        searchOptions.include_domains = options.include_domains;
      }

      if (options?.exclude_domains) {
        searchOptions.exclude_domains = options.exclude_domains;
      }

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchOptions),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
      }

      const data: TavilySearchResponse = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(`Tavily search failed: ${error.message}`);
    }
  }

  async scrapeUrl(url: string, timeoutMs: number = 15000): Promise<{
    markdown: string;
    html: string;
    metadata: any;
    success: boolean;
    error?: string;
  }> {
    try {
      // Tavily doesn't have a direct scraping API, so we'll use their search
      // with the specific URL to get content
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Scraping timeout')), timeoutMs);
      });

      const scrapePromise = this.search(`site:${new URL(url).hostname}`, {
        max_results: 1,
        include_raw_content: true,
      });

      const result = await Promise.race([scrapePromise, timeoutPromise]) as TavilySearchResponse;

      if (result.results && result.results.length > 0) {
        const firstResult = result.results[0];
        
        return {
          markdown: firstResult.raw_content || firstResult.content || '',
          html: '', // Tavily doesn't provide HTML
          metadata: {
            title: firstResult.title,
            url: firstResult.url,
            score: firstResult.score,
          },
          success: true,
        };
      }

      return {
        markdown: '',
        html: '',
        metadata: { error: 'No content found for URL' },
        success: false,
        error: 'not_found',
      };
    } catch (error: any) {
      if (error?.message === 'Scraping timeout') {
        return {
          markdown: '',
          html: '',
          metadata: {
            error: 'Scraping took too long and was stopped',
            timeout: true,
          },
          success: false,
          error: 'timeout',
        };
      }

      return {
        markdown: '',
        html: '',
        metadata: {
          error: error?.message || 'Failed to scrape URL',
        },
        success: false,
        error: 'failed',
      };
    }
  }

  // Convert Tavily results to the format expected by the search engine
  formatResults(response: TavilySearchResponse) {
    return {
      data: response.results.map((result) => {
        const domain = new URL(result.url).hostname;
        
        return {
          url: result.url,
          title: result.title || 'Untitled',
          description: result.content.substring(0, 200) + '...',
          markdown: result.raw_content || result.content || '',
          html: '', // Tavily doesn't provide HTML
          links: [],
          screenshot: null,
          metadata: {
            score: result.score,
            domain,
            favicon: `https://${domain}/favicon.ico`,
          },
          scraped: true,
          content: result.raw_content || result.content || '',
          favicon: `https://${domain}/favicon.ico`,
        };
      }),
      results: response.results, // For backward compatibility
      metadata: {
        query: response.query,
        response_time: response.response_time,
        answer: response.answer,
      },
    };
  }
}
