import { NextRequest, NextResponse } from 'next/server';

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  created?: number;
}

interface OpenAIModel {
  id: string;
  created: number;
  owned_by: string;
  object: string;
}

interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

interface OllamaModelsResponse {
  models: OllamaModel[];
}

interface OpenRouterModel {
  id: string;
  description?: string;
  context_length?: number;
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

async function getOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
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

    const data: { data: OpenAIModel[] } = await response.json();
    
    // Filter to only include GPT models and sort by creation date (newest first)
    return data.data
      .filter((model: OpenAIModel) => model.id.includes('gpt'))
      .map((model: OpenAIModel) => ({
        id: model.id,
        name: model.id,
        description: `Created: ${new Date(model.created * 1000).toLocaleDateString()}`,
        created: model.created
      }))
      .sort((a: ModelInfo, b: ModelInfo) => (b.created || 0) - (a.created || 0));
  } catch {
    // Return fallback models if API fails
    return [
      { id: 'gpt-4o', name: 'gpt-4o', description: 'Latest flagship model' },
      { id: 'gpt-4o-mini', name: 'gpt-4o-mini', description: 'Fast, cost-effective model' },
      { id: 'gpt-4-turbo', name: 'gpt-4-turbo', description: 'High-performance model' },
      { id: 'gpt-4', name: 'gpt-4', description: 'Classic GPT-4' },
      { id: 'gpt-3.5-turbo', name: 'gpt-3.5-turbo', description: 'Fast and affordable' },
    ];
  }
}

async function getOllamaModels(apiUrl: string): Promise<ModelInfo[]> {
  try {
    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(apiUrl);
    } catch {
      // Return fallback models for invalid URLs
      return [
        { id: 'llama3.2', name: 'llama3.2', description: 'Latest Llama model' },
        { id: 'llama3.1', name: 'llama3.1', description: 'Previous generation' },
        { id: 'llama3', name: 'llama3', description: 'Stable version' },
        { id: 'mistral', name: 'mistral', description: 'Mistral AI model' },
        { id: 'codellama', name: 'codellama', description: 'Code-specialized model' },
        { id: 'phi3', name: 'phi3', description: 'Microsoft small model' },
        { id: 'gemma2', name: 'gemma2', description: 'Google Gemma model' },
        { id: 'qwen2.5', name: 'qwen2.5', description: 'Alibaba Qwen model' },
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

    const data: OllamaModelsResponse = await response.json();
    
    return data.models?.map((model: OllamaModel) => ({
      id: model.name.split(':')[0], // Remove tag (e.g., ":latest")
      name: model.name.split(':')[0],
      description: `Size: ${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB, Modified: ${new Date(model.modified_at).toLocaleDateString()}`,
    })) || [];
  } catch {
    // Return fallback models if API fails
    return [
      { id: 'llama3.2', name: 'llama3.2', description: 'Latest Llama model' },
      { id: 'llama3.1', name: 'llama3.1', description: 'Previous generation' },
      { id: 'llama3', name: 'llama3', description: 'Stable version' },
      { id: 'mistral', name: 'mistral', description: 'Mistral AI model' },
      { id: 'codellama', name: 'codellama', description: 'Code-specialized model' },
      { id: 'phi3', name: 'phi3', description: 'Microsoft small model' },
      { id: 'gemma2', name: 'gemma2', description: 'Google Gemma model' },
      { id: 'qwen2.5', name: 'qwen2.5', description: 'Alibaba Qwen model' },
    ];
  }
}

async function getOpenRouterModels(apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: OpenRouterModelsResponse = await response.json();
    
    return data.data?.map((model: OpenRouterModel) => ({
      id: model.id,
      name: model.id,
      description: model.description || `Context: ${model.context_length || 'Unknown'}`,
    })) || [];
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    // Return fallback models if API fails
    return [
      { id: 'openai/gpt-4o', name: 'openai/gpt-4o', description: 'OpenAI GPT-4o via OpenRouter' },
      { id: 'openai/gpt-4o-mini', name: 'openai/gpt-4o-mini', description: 'OpenAI GPT-4o Mini' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'anthropic/claude-3.5-sonnet', description: 'Latest Claude model' },
      { id: 'anthropic/claude-3-haiku', name: 'anthropic/claude-3-haiku', description: 'Fast Claude model' },
      { id: 'google/gemini-pro-1.5', name: 'google/gemini-pro-1.5', description: 'Google Gemini' },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'meta-llama/llama-3.1-70b-instruct', description: 'Large Llama model' },
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
    let models: ModelInfo[] = [];

    switch (provider) {
      case 'openai':
        if (!apiKey) {
          return NextResponse.json({ error: 'API key is required for OpenAI' }, { status: 400 });
        }
        models = await getOpenAIModels(apiKey);
        break;

      case 'ollama':
        const ollamaUrl = apiUrl || 'http://localhost:11434';
        models = await getOllamaModels(ollamaUrl);
        break;

      case 'openrouter':
        if (!apiKey) {
          return NextResponse.json({ error: 'API key is required for OpenRouter' }, { status: 400 });
        }
        models = await getOpenRouterModels(apiKey);
        break;

      default:
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}
