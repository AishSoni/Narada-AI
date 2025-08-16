import { NextRequest, NextResponse } from 'next/server';

interface TestConfig {
  SEARCH_API_PROVIDER: string;
  FIRECRAWL_API_KEY: string;
  TAVILY_API_KEY: string;
  SERP_API_KEY: string;
  LLM_PROVIDER: string;
  OPENAI_API_KEY: string;
  OPENAI_LLM_MODEL: string;
  OLLAMA_API_URL: string;
  OLLAMA_LLM_MODEL: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_LLM_MODEL: string;
  EMBEDDING_PROVIDER: string;
  OPENAI_EMBEDDING_MODEL: string;
  COHERE_API_KEY: string;
  COHERE_EMBEDDING_MODEL: string;
  OLLAMA_EMBEDDING_MODEL: string;
  OLLAMA_EMBEDDING_URL: string;
}

async function testFirecrawlAPI(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.includes('•••')) return false;
    
    const response = await fetch('https://api.firecrawl.dev/v1/credits', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

async function testTavilyAPI(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.includes('•••')) return false;
    
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: 'test',
        max_results: 1,
      }),
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

async function testSerpAPI(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.includes('•••')) return false;
    
    const response = await fetch(`https://serpapi.com/search.json?q=test&api_key=${apiKey}&num=1`);
    return response.ok;
  } catch {
    return false;
  }
}

async function testOpenAIAPI(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.includes('•••')) return false;
    
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

async function testOllamaAPI(url: string): Promise<boolean> {
  try {
    if (!url) return false;
    
    const response = await fetch(`${url}/api/version`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

async function testOpenRouterAPI(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.includes('•••')) return false;
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

async function testCohereAPI(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.includes('•••')) return false;
    
    const response = await fetch('https://api.cohere.ai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const config: TestConfig = await request.json();
    const results: Record<string, boolean> = {};
    
    // Test Search API
    if (config.SEARCH_API_PROVIDER === 'firecrawl' && config.FIRECRAWL_API_KEY) {
      results['FireCrawl API'] = await testFirecrawlAPI(config.FIRECRAWL_API_KEY);
    } else if (config.SEARCH_API_PROVIDER === 'tavily' && config.TAVILY_API_KEY) {
      results['Tavily API'] = await testTavilyAPI(config.TAVILY_API_KEY);
    } else if (config.SEARCH_API_PROVIDER === 'serp' && config.SERP_API_KEY) {
      results['SERP API'] = await testSerpAPI(config.SERP_API_KEY);
    }
    
    // Test LLM Provider
    if (config.LLM_PROVIDER === 'openai' && config.OPENAI_API_KEY) {
      results['OpenAI API'] = await testOpenAIAPI(config.OPENAI_API_KEY);
    } else if (config.LLM_PROVIDER === 'ollama' && config.OLLAMA_API_URL) {
      results['Ollama API'] = await testOllamaAPI(config.OLLAMA_API_URL);
    } else if (config.LLM_PROVIDER === 'openrouter' && config.OPENROUTER_API_KEY) {
      results['OpenRouter API'] = await testOpenRouterAPI(config.OPENROUTER_API_KEY);
    }
    
    // Test Embedding Provider
    if (config.EMBEDDING_PROVIDER === 'openai' && config.OPENAI_API_KEY) {
      results['OpenAI Embeddings'] = await testOpenAIAPI(config.OPENAI_API_KEY);
    } else if (config.EMBEDDING_PROVIDER === 'cohere' && config.COHERE_API_KEY) {
      results['Cohere Embeddings'] = await testCohereAPI(config.COHERE_API_KEY);
    } else if (config.EMBEDDING_PROVIDER === 'ollama' && config.OLLAMA_EMBEDDING_URL) {
      results['Ollama Embeddings'] = await testOllamaAPI(config.OLLAMA_EMBEDDING_URL);
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to test configuration:', error);
    return NextResponse.json({ error: 'Failed to test configuration' }, { status: 500 });
  }
}
