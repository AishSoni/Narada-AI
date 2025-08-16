/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SerpSearchOptions {
  num?: number;
  start?: number;
  gl?: string; // country
  hl?: string; // language
  device?: 'desktop' | 'mobile';
  safe?: 'active' | 'off';
  tbm?: 'nws' | 'isch' | 'vid' | 'shop'; // search type
}

export interface SerpOrganicResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  displayed_link?: string;
  favicon?: string;
  date?: string;
  cached_page_link?: string;
}

export interface SerpSearchResponse {
  search_metadata: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
  search_parameters: {
    engine: string;
    q: string;
    location_requested?: string;
    location_used?: string;
    google_domain: string;
    hl: string;
    gl: string;
    device: string;
  };
  search_information: {
    query_displayed: string;
    total_results: number;
    time_taken_displayed: number;
    organic_results_state: string;
  };
  organic_results: SerpOrganicResult[];
  related_searches?: Array<{
    query: string;
    link: string;
  }>;
  pagination?: {
    current: number;
    next?: string;
    other_pages?: any;
  };
}

export class SerpClient {
  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search.json';

  constructor(providedApiKey?: string) {
    const apiKey = providedApiKey || process.env.SERP_API_KEY;
    if (!apiKey) {
      throw new Error('SERP_API_KEY is required - either provide it or set it as an environment variable');
    }
    this.apiKey = apiKey;
  }

  async search(query: string, options?: SerpSearchOptions): Promise<SerpSearchResponse> {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        api_key: this.apiKey,
        engine: 'google',
        num: (options?.num || 10).toString(),
        start: (options?.start || 0).toString(),
        gl: options?.gl || 'us',
        hl: options?.hl || 'en',
        device: options?.device || 'desktop',
        safe: options?.safe || 'off',
      });

      if (options?.tbm) {
        searchParams.append('tbm', options.tbm);
      }

      const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
        headers: {
          'User-Agent': 'Narada-AI/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`SERP API error: ${response.status} ${response.statusText}`);
      }

      const data: SerpSearchResponse = await response.json();
      
      // Check for API errors
      if ((data as any).error) {
        throw new Error(`SERP API error: ${(data as any).error}`);
      }

      return data;
    } catch (error: any) {
      throw new Error(`SERP search failed: ${error.message}`);
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
      // SERP API doesn't have a direct scraping endpoint
      // We'll search for the specific URL to get some content
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Scraping timeout')), timeoutMs);
      });

      const domain = new URL(url).hostname;
      const scrapePromise = this.search(`site:${domain}`, {
        num: 1,
      });

      const result = await Promise.race([scrapePromise, timeoutPromise]) as SerpSearchResponse;

      if (result.organic_results && result.organic_results.length > 0) {
        const firstResult = result.organic_results[0];
        
        return {
          markdown: firstResult.snippet || '',
          html: '', // SERP doesn't provide full HTML content
          metadata: {
            title: firstResult.title,
            url: firstResult.link,
            position: firstResult.position,
            displayed_link: firstResult.displayed_link,
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

  // Convert SERP results to the format expected by the search engine
  formatResults(response: SerpSearchResponse) {
    return {
      data: response.organic_results.map((result) => {
        const domain = new URL(result.link).hostname;
        
        return {
          url: result.link,
          title: result.title || 'Untitled',
          description: result.snippet || '',
          markdown: result.snippet || '',
          html: '', // SERP doesn't provide HTML content
          links: [],
          screenshot: null,
          metadata: {
            position: result.position,
            displayed_link: result.displayed_link,
            domain,
            favicon: result.favicon || `https://${domain}/favicon.ico`,
            date: result.date,
          },
          scraped: false, // SERP only provides snippets, not full content
          content: result.snippet || '',
          favicon: result.favicon || `https://${domain}/favicon.ico`,
        };
      }),
      results: response.organic_results, // For backward compatibility
      metadata: {
        search_metadata: response.search_metadata,
        search_parameters: response.search_parameters,
        search_information: response.search_information,
        total_results: response.search_information.total_results,
        related_searches: response.related_searches,
      },
    };
  }
}
