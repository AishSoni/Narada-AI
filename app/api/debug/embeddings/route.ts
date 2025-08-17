import { NextRequest, NextResponse } from 'next/server';
import { vectorStore } from '@/lib/vector-store';
import { UnifiedEmbeddingClient } from '@/lib/unified-embedding-client';
import { getAppConfig } from '@/lib/app-config';

export async function GET() {
  try {
    const config = getAppConfig();
    const embeddingStatus = vectorStore.getEmbeddingStatus();
    
    // Try to create a new embedding client to test configuration
    let testClientStatus = null;
    try {
      const testClient = new UnifiedEmbeddingClient();
      testClientStatus = {
        initialized: true,
        provider: testClient.getProvider(),
        config: testClient.getConfig()
      };
    } catch (error) {
      testClientStatus = {
        initialized: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test a simple embedding call
    let embeddingTestResult = null;
    if (embeddingStatus.available) {
      try {
        const testClient = new UnifiedEmbeddingClient();
        const embedding = await testClient.embedText("test");
        embeddingTestResult = {
          success: true,
          embeddingLength: embedding.length,
          sampleValues: embedding.slice(0, 5)
        };
      } catch (error) {
        embeddingTestResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    return NextResponse.json({
      appConfig: {
        embeddingProvider: config.embeddingProvider,
        embeddingModel: config.embeddingModel,
        embeddingApiUrl: config.embeddingApiUrl,
        embeddingApiKey: config.embeddingApiKey ? '***PRESENT***' : 'NOT_SET'
      },
      vectorStoreStatus: embeddingStatus,
      testClientStatus,
      embeddingTestResult,
      vectorStoreStats: vectorStore.getStats()
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
