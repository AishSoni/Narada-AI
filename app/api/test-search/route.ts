import { NextRequest, NextResponse } from 'next/server';
import { UnifiedSearchClient } from '@/lib/unified-search-client';

interface SearchResultItem {
  title: string;
  url: string;
  description?: string;
}

interface SearchResponse {
  data?: SearchResultItem[];
}
import { TavilyClient } from '@/lib/tavily';
import { SerpClient } from '@/lib/serp';
import { FirecrawlClient } from '@/lib/firecrawl';

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey, query } = await request.json();

    if (!provider || !query) {
      return NextResponse.json({ 
        error: 'Provider and query are required' 
      }, { status: 400 });
    }

    let client;
    let results: SearchResponse;

    switch (provider) {
      case 'firecrawl':
        if (!apiKey && !process.env.FIRECRAWL_API_KEY) {
          return NextResponse.json({ 
            error: 'FireCrawl API key is required' 
          }, { status: 400 });
        }
        client = new FirecrawlClient(apiKey);
        results = await client.search(query, { limit: 3 });
        break;

      case 'tavily':
        if (!apiKey && !process.env.TAVILY_API_KEY) {
          return NextResponse.json({ 
            error: 'Tavily API key is required' 
          }, { status: 400 });
        }
        client = new TavilyClient(apiKey);
        const tavilyResults = await client.search(query, { max_results: 3 });
        results = client.formatResults(tavilyResults);
        break;

      case 'serp':
        if (!apiKey && !process.env.SERP_API_KEY) {
          return NextResponse.json({ 
            error: 'SERP API key is required' 
          }, { status: 400 });
        }
        client = new SerpClient(apiKey);
        const serpResults = await client.search(query, { num: 3 });
        results = client.formatResults(serpResults);
        break;

      case 'unified':
        // Test the unified client
        client = new UnifiedSearchClient(apiKey);
        results = await client.search(query);
        break;

      default:
        return NextResponse.json({ 
          error: 'Unsupported provider' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      provider: provider,
      resultCount: results.data?.length || 0,
      results: results.data?.slice(0, 2).map((r: SearchResultItem) => ({
        title: r.title,
        url: r.url,
        description: r.description?.substring(0, 100) + '...',
      })) || [],
      metadata: {
        query,
        provider: client instanceof UnifiedSearchClient ? client.getProvider() : provider,
      }
    });

  } catch (error: unknown) {
    console.error('Search test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Search test failed',
    }, { status: 500 });
  }
}
