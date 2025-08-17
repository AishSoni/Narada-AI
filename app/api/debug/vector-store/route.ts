import { NextRequest, NextResponse } from 'next/server';
import { vectorStore } from '@/lib/vector-store';

export async function GET(request: NextRequest) {
  try {
    // Check if vector store has a health check method (Qdrant implementation)
    if ('healthCheck' in vectorStore) {
      const isHealthy = await (vectorStore as any).healthCheck();
      
      const collectionInfo = 'getCollectionInfo' in vectorStore 
        ? await (vectorStore as any).getCollectionInfo()
        : null;
      
      return NextResponse.json({
        success: true,
        vectorStore: {
          type: process.env.VECTOR_DB_PROVIDER || 'in-memory',
          healthy: isHealthy,
          collection: collectionInfo
        }
      });
    } else {
      // In-memory store
      const stats = 'getStats' in vectorStore 
        ? (vectorStore as any).getStats()
        : { totalVectors: 0, stacks: [], documents: [] };
      
      return NextResponse.json({
        success: true,
        vectorStore: {
          type: 'in-memory',
          healthy: true,
          stats
        }
      });
    }
  } catch (error) {
    console.error('Vector store test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      vectorStore: {
        type: process.env.VECTOR_DB_PROVIDER || 'in-memory',
        healthy: false
      }
    }, { status: 500 });
  }
}
