import { NextRequest, NextResponse } from 'next/server';
import { UnifiedEmbeddingClient } from '@/lib/unified-embedding-client';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({
        success: false,
        error: 'Text is required'
      }, { status: 400 });
    }

    console.log('Testing embedding generation only...');
    
    const embeddingClient = new UnifiedEmbeddingClient();
    
    // Test embedding generation
    const embedding = await embeddingClient.embedText(text);
    
    return NextResponse.json({
      success: true,
      embedding: {
        dimensions: embedding.length,
        provider: embeddingClient.getProvider(),
        model: process.env.OLLAMA_EMBEDDING_MODEL,
        preview: embedding.slice(0, 5) // Show first 5 dimensions
      },
      config: {
        embeddingProvider: process.env.EMBEDDING_PROVIDER,
        ollamaModel: process.env.OLLAMA_EMBEDDING_MODEL,
        configuredDimensions: process.env.EMBEDDING_DIMENSIONS
      }
    });
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        embeddingProvider: process.env.EMBEDDING_PROVIDER,
        ollamaModel: process.env.OLLAMA_EMBEDDING_MODEL,
        configuredDimensions: process.env.EMBEDDING_DIMENSIONS
      }
    }, { status: 500 });
  }
}
