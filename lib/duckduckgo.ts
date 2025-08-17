/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DuckDuckGoSearchOptions {
  region?: string;
  safesearch?: 'strict' | 'moderate' | 'off';
  time?: 'd' | 'w' | 'm' | 'y'; // day, week, month, year
  max_results?: number;
}

export interface DuckDuckGoResult {
  title: string;
  href: string;
  body: string;
  icon?: string;
}

export interface DuckDuckGoSearchResponse {
  results: DuckDuckGoResult[];
  query: string;
  answered: boolean;
}

export class DuckDuckGoClient {
  private apiKey: string;
  private baseUrl = 'https://api.duckduckgo.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, options: DuckDuckGoSearchOptions = {}): Promise<DuckDuckGoSearchResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    searchParams.append('format', 'json');
    searchParams.append('no_redirect', '1');
    searchParams.append('no_html', '1');
    searchParams.append('skip_disambig', '1');
    
    if (options.region) searchParams.append('region', options.region);
    if (options.safesearch) searchParams.append('safesearch', options.safesearch);
    if (options.time) searchParams.append('time', options.time);

    try {
      // Note: DuckDuckGo's instant answer API is free but limited
      // For a production implementation, you might want to use a different service
      // or implement web scraping with proper rate limiting
      const response = await fetch(`${this.baseUrl}/?${searchParams}`, {
        headers: {
          'User-Agent': 'Narada-AI/1.0',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform the response to match our interface
      const results: DuckDuckGoResult[] = [];
      
      // Add related topics as results
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, options.max_results || 10)) {
          if (topic.FirstURL && topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'DuckDuckGo Result',
              href: topic.FirstURL,
              body: topic.Text,
              icon: topic.Icon?.URL
            });
          }
        }
      }

      // Add abstract if available
      if (data.Abstract && data.AbstractURL) {
        results.unshift({
          title: data.Heading || 'DuckDuckGo Abstract',
          href: data.AbstractURL,
          body: data.Abstract,
          icon: data.Image
        });
      }

      return {
        results,
        query,
        answered: data.AnswerType !== ''
      };
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      throw new Error(`DuckDuckGo search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async scrapeUrl(url: string, timeoutMs: number = 15000): Promise<{ markdown: string; html: string; metadata: any; success: boolean; error?: string }> {
    try {
      // Basic scraping implementation with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      
      // Basic HTML to markdown conversion (simplified)
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
          provider: 'duckduckgo'
        },
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof Error && error.name === 'AbortError' 
        ? `DuckDuckGo scraping timed out after ${timeoutMs}ms`
        : `DuckDuckGo scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      console.error('DuckDuckGo scraping error:', error);
      
      return {
        markdown: '',
        html: '',
        metadata: {
          url,
          provider: 'duckduckgo'
        },
        success: false,
        error: errorMessage
      };
    }
  }

  formatResults(response: DuckDuckGoSearchResponse) {
    return {
      data: response.results.map((result, index) => {
        const domain = new URL(result.href).hostname;
        
        return {
          url: result.href,
          title: result.title || 'Untitled',
          description: result.body.substring(0, 200) + '...',
          markdown: result.body || '',
          html: '', // DuckDuckGo doesn't provide HTML
          links: [],
          screenshot: null,
          metadata: {
            position: index + 1,
            domain,
            favicon: result.icon || `https://${domain}/favicon.ico`,
            provider: 'duckduckgo'
          },
          scraped: false,
          content: result.body || '',
          favicon: result.icon || `https://${domain}/favicon.ico`,
        };
      }),
      results: response.results,
      metadata: {
        query: response.query,
        answered: response.answered,
        provider: 'duckduckgo',
        total_results: response.results.length
      }
    };
  }
}
