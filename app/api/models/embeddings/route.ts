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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter to only include embedding models
    return data.data
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
  } catch (error) {
    // Return fallback models if API fails
    return [
      { id: 'text-embedding-3-small', name: 'text-embedding-3-small', description: 'Most cost-effective', dimensions: 1536 },
      { id: 'text-embedding-3-large', name: 'text-embedding-3-large', description: 'Higher performance', dimensions: 3072 },
      { id: 'text-embedding-ada-002', name: 'text-embedding-ada-002', description: 'Legacy model', dimensions: 1536 },
    ];
  }
}

async function getOllamaEmbeddingModels(apiUrl: string): Promise<EmbeddingModelInfo[]> {
  try {
    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(apiUrl);
    } catch {
      // Return fallback models for invalid URLs
      return [
        { id: 'nomic-embed-text', name: 'nomic-embed-text', description: 'High-quality embeddings' },
        { id: 'mxbai-embed-large', name: 'mxbai-embed-large', description: 'Large embedding model' },
        { id: 'all-minilm', name: 'all-minilm', description: 'Lightweight embeddings' },
        { id: 'snowflake-arctic-embed', name: 'snowflake-arctic-embed', description: 'Snowflake embeddings' },
      ];
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
    
    return data.models
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
  } catch (error) {
    // Return fallback models if API fails
    return [
      { id: 'nomic-embed-text', name: 'nomic-embed-text', description: 'High-quality embeddings' },
      { id: 'mxbai-embed-large', name: 'mxbai-embed-large', description: 'Large embedding model' },
      { id: 'all-minilm', name: 'all-minilm', description: 'Lightweight embeddings' },
      { id: 'snowflake-arctic-embed', name: 'snowflake-arctic-embed', description: 'Snowflake embeddings' },
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
    return NextResponse.json({ error: 'Failed to fetch embedding models' }, { status: 500 });
  }
}
