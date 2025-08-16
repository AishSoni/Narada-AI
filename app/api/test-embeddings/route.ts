import { NextRequest, NextResponse } from 'next/server';
import { UnifiedEmbeddingClient } from '@/lib/unified-embedding-client';

export async function POST(request: NextRequest) {
  try {
    const { text, provider, apiKey, model } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    // Create unified embedding client with override config
    const embeddingClient = new UnifiedEmbeddingClient({
      provider,
      apiKey,
      model,
    });

    // Generate embedding
    const embedding = await embeddingClient.embedText(text);
    const dimensions = embeddingClient.getEmbeddingDimensions();

    return NextResponse.json({
      text,
      provider,
      model: embeddingClient.getConfig().model,
      embedding,
      dimensions,
      embeddingLength: embedding.length,
    });
  } catch (error) {
    console.error('Embedding test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with { text, provider, apiKey?, model? } to test embeddings',
    supportedProviders: ['openai', 'cohere', 'ollama'],
    examples: {
      cohere: {
        text: 'Hello world',
        provider: 'cohere',
        apiKey: 'your-cohere-api-key',
        model: 'embed-english-v3.0',
      },
      openai: {
        text: 'Hello world',
        provider: 'openai',
        apiKey: 'your-openai-api-key',
        model: 'text-embedding-3-small',
      },
      ollama: {
        text: 'Hello world',
        provider: 'ollama',
        model: 'nomic-embed-text',
      },
    },
  });
}
