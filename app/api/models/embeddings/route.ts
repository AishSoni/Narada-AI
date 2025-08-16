import { NextRequest, NextResponse } from 'next/server';

interface EmbeddingModelInfo {
  id: string;
  name: string;
  description?: string;
  dimensions?: number;
}

async function getOpenAIEmbeddingModels(apiKey: string): Promise<EmbeddingModelInfo[]> {
  try {
    // Validate API key format
    if (!apiKey || apiKey.length < 10 || !apiKey.startsWith('sk-')) {
      throw new Error('Invalid API key format');
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      // For authentication errors, don't return fallback models
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter to only include embedding models
    const embeddingModels = data.data
      .filter((model: any) => model.id.includes('embedding'))
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        description: `Created: ${new Date(model.created * 1000).toLocaleDateString()}`,
        dimensions: model.id.includes('text-embedding-3-small') ? 1536 : 
                   model.id.includes('text-embedding-3-large') ? 3072 : 
                   model.id.includes('ada-002') ? 1536 : undefined
      }))
      .sort((a: any, b: any) => b.created - a.created);

    // If no embedding models found in API response, return fallback models
    if (embeddingModels.length === 0) {
      return [
        { id: 'text-embedding-3-small', name: 'text-embedding-3-small', description: 'Most cost-effective', dimensions: 1536 },
        { id: 'text-embedding-3-large', name: 'text-embedding-3-large', description: 'Higher performance', dimensions: 3072 },
        { id: 'text-embedding-ada-002', name: 'text-embedding-ada-002', description: 'Legacy model', dimensions: 1536 },
      ];
    }

    return embeddingModels;
  } catch (error) {
    // Don't return fallback models for authentication errors
    if (error instanceof Error && error.message.includes('Authentication failed')) {
      throw error;
    }
    
    // Only return fallback models for network/timeout errors
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      return [
        { id: 'text-embedding-3-small', name: 'text-embedding-3-small', description: 'Most cost-effective (fallback)', dimensions: 1536 },
        { id: 'text-embedding-3-large', name: 'text-embedding-3-large', description: 'Higher performance (fallback)', dimensions: 3072 },
        { id: 'text-embedding-ada-002', name: 'text-embedding-ada-002', description: 'Legacy model (fallback)', dimensions: 1536 },
      ];
    }
    
    // For other errors, rethrow
    throw error;
  }
}

async function getOllamaEmbeddingModels(apiUrl: string): Promise<EmbeddingModelInfo[]> {
  try {
    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(apiUrl);
    } catch {
      throw new Error('Invalid URL format');
    }

    const response = await fetch(`${validUrl.toString()}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter to models that are typically used for embeddings
    const embeddingKeywords = ['embed', 'nomic', 'mxbai', 'minilm', 'arctic'];
    
    const embeddingModels = data.models
      ?.filter((model: any) => 
        embeddingKeywords.some(keyword => 
          model.name.toLowerCase().includes(keyword)
        )
      )
      .map((model: any) => ({
        id: model.name.split(':')[0], // Remove tag
        name: model.name.split(':')[0],
        description: `Size: ${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB, Modified: ${new Date(model.modified_at).toLocaleDateString()}`,
      })) || [];

    // If no embedding models found, return fallback models
    if (embeddingModels.length === 0) {
      return [
        { id: 'nomic-embed-text', name: 'nomic-embed-text', description: 'High-quality embeddings (not installed)' },
        { id: 'mxbai-embed-large', name: 'mxbai-embed-large', description: 'Large embedding model (not installed)' },
        { id: 'all-minilm', name: 'all-minilm', description: 'Lightweight embeddings (not installed)' },
        { id: 'snowflake-arctic-embed', name: 'snowflake-arctic-embed', description: 'Snowflake embeddings (not installed)' },
      ];
    }

    return embeddingModels;
  } catch (error) {
    // For connection errors, don't return fallback models
    if (error instanceof Error && (error.message.includes('fetch') || error.name === 'AbortError' || error.message.includes('API error'))) {
      throw error;
    }
    
    // For invalid URL format, also throw
    if (error instanceof Error && error.message.includes('Invalid URL')) {
      throw error;
    }
    
    // For other unexpected errors, return fallback models
    return [
      { id: 'nomic-embed-text', name: 'nomic-embed-text', description: 'High-quality embeddings (fallback)' },
      { id: 'mxbai-embed-large', name: 'mxbai-embed-large', description: 'Large embedding model (fallback)' },
      { id: 'all-minilm', name: 'all-minilm', description: 'Lightweight embeddings (fallback)' },
      { id: 'snowflake-arctic-embed', name: 'snowflake-arctic-embed', description: 'Snowflake embeddings (fallback)' },
    ];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const apiKey = searchParams.get('apiKey');
  const apiUrl = searchParams.get('apiUrl');

  if (!provider) {
    return NextResponse.json({ error: 'Provider parameter is required' }, { status: 400 });
  }

  try {
    let models: EmbeddingModelInfo[] = [];

    switch (provider) {
      case 'openai':
        if (!apiKey) {
          return NextResponse.json({ error: 'API key is required for OpenAI' }, { status: 400 });
        }
        models = await getOpenAIEmbeddingModels(apiKey);
        break;

      case 'ollama':
        const ollamaUrl = apiUrl || 'http://localhost:11434';
        models = await getOllamaEmbeddingModels(ollamaUrl);
        break;

      default:
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching embedding models:', error);
    
    // For authentication errors, return a specific error response
    if (error instanceof Error && error.message.includes('Authentication failed')) {
      return NextResponse.json({ error: 'Invalid API key', models: [] }, { status: 401 });
    }
    
    // For connection errors, return empty models array
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('API error') || error.message.includes('Invalid URL'))) {
      return NextResponse.json({ error: 'Connection failed', models: [] }, { status: 503 });
    }
    
    return NextResponse.json({ error: 'Failed to fetch embedding models', models: [] }, { status: 500 });
  }
}
