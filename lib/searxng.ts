/* eslint-disable @typescript-eslint/no-explicit-any */

export interface SearxngSearchOptions {
  language?: string;
  pageno?: number;
  categories?: string;
  engines?: string;
  time_range?: 'day' | 'week' | 'month' | 'year';
  safesearch?: 0 | 1 | 2;
  max_results?: number;
}

export interface SearxngResult {
  url: string;
  title: string;
  content: string;
  engine: string;
  score?: number;
  category?: string;
  publishedDate?: string;
  img_src?: string;
}

export interface SearxngSearchResponse {
  query: string;
  number_of_results: number;
  results: SearxngResult[];
  answers?: string[];
  suggestions?: string[];
  unresponsive_engines?: string[][];
}

export class SearxngClient {
  private baseUrl: string;

  constructor(providedApiUrl?: string) {
    const apiUrl = providedApiUrl || process.env.SEARXNG_API_URL || 'http://localhost:8080';
    if (!apiUrl) {
      throw new Error('SEARXNG_API_URL is required - either provide it or set it as an environment variable');
    }
    this.baseUrl = apiUrl.replace(/\/$/, '');
  }

  async search(query: string, options: SearxngSearchOptions = {}): Promise<SearxngSearchResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    searchParams.append('format', 'json');
    searchParams.append('language', options.language || 'en');
    searchParams.append('pageno', String(options.pageno || 1));

    if (options.categories) searchParams.append('categories', options.categories);
    if (options.engines) searchParams.append('engines', options.engines);
    if (options.time_range) searchParams.append('time_range', options.time_range);
    if (options.safesearch !== undefined) searchParams.append('safesearch', String(options.safesearch));

    try {
      const response = await fetch(`${this.baseUrl}/search?${searchParams}`, {
        headers: {
          'User-Agent': 'Narada-AI/1.0',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`SearXNG API error: ${response.status} ${response.statusText}`);
      }

      const data: SearxngSearchResponse = await response.json();

      if (options.max_results && data.results) {
        data.results = data.results.slice(0, options.max_results);
      }

      return data;
    } catch (error) {
      console.error('SearXNG search error:', error);
      throw new Error(`SearXNG search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();

      const markdown = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        markdown,
        html,
        metadata: {
          url,
          title: html.match(/<title>(.*?)<\/title>/i)?.[1] || '',
          provider: 'searxng',
        },
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.name === 'AbortError'
          ? `SearXNG scraping timed out after ${timeoutMs}ms`
          : `SearXNG scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

      console.error('SearXNG scraping error:', error);

      return {
        markdown: '',
        html: '',
        metadata: {
          url,
          provider: 'searxng',
        },
        success: false,
        error: errorMessage,
      };
    }
  }

  formatResults(response: SearxngSearchResponse) {
    return {
      data: response.results.map((result, index) => {
        const domain = new URL(result.url).hostname;

        return {
          url: result.url,
          title: result.title || 'Untitled',
          description: result.content.substring(0, 200) + (result.content.length > 200 ? '...' : ''),
          markdown: result.content || '',
          html: '',
          links: [],
          screenshot: null,
          metadata: {
            position: index + 1,
            domain,
            favicon: `https://${domain}/favicon.ico`,
            engine: result.engine,
            score: result.score,
            category: result.category,
            publishedDate: result.publishedDate,
            provider: 'searxng',
          },
          scraped: false,
          content: result.content || '',
          favicon: `https://${domain}/favicon.ico`,
        };
      }),
      results: response.results,
      metadata: {
        query: response.query,
        number_of_results: response.number_of_results,
        answers: response.answers,
        suggestions: response.suggestions,
        unresponsive_engines: response.unresponsive_engines,
        provider: 'searxng',
        total_results: response.results.length,
      },
    };
  }
}
