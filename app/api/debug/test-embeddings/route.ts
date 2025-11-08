import { NextRequest, NextResponse } from 'next/server';
import { vectorStore } from '@/lib/vector-store';

// Interface for collection info structure
interface CollectionInfo {
  config?: {
    params?: {
      vectors?: {
        size?: number;
        distance?: string;
      };
    };
  };
  points_count?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({
        success: false,
        error: 'Text is required'
      }, { status: 400 });
    }

    // Test embedding generation and vector storage
    const testStackId = 'test-stack-' + Date.now();
    const testDocId = 'test-doc-' + Date.now();
    
    console.log('Testing embedding generation and storage...');
    
    // Add a test document with embeddings
    const vectorIds = await vectorStore.addDocument(
      testStackId,
      testDocId,
      [text],
      { test: true, timestamp: new Date().toISOString() }
    );
    
    console.log('Test document added, vector IDs:', vectorIds);
    
    // Test vector search
    console.log('Testing vector search...');
    const searchResults = await vectorStore.searchSimilar(testStackId, text, 1, 0.5);
    
    console.log('Search results:', searchResults);
    
    // Clean up test data
    if ('removeStack' in vectorStore) {
      await (vectorStore as import('@/lib/qdrant-vector-store').AdvancedVectorStore).removeStack(testStackId);
      console.log('Test data cleaned up');
    }
    
    // Get collection info if available
    let collectionInfo = null;
    if ('getCollectionInfo' in vectorStore) {
      collectionInfo = await (vectorStore as import('@/lib/qdrant-vector-store').AdvancedVectorStore).getCollectionInfo();
    }

    return NextResponse.json({
      success: true,
      test: {
        vectorIds,
        searchResults: searchResults.length,
        embeddingDimensions: process.env.EMBEDDING_DIMENSIONS || 'not configured',
        collectionInfo: collectionInfo ? {
          vectorSize: (collectionInfo as CollectionInfo)?.config?.params?.vectors?.size,
          distance: (collectionInfo as CollectionInfo)?.config?.params?.vectors?.distance,
          pointsCount: (collectionInfo as CollectionInfo)?.points_count
        } : null
      }
    });
  } catch (error) {
    console.error('Embedding test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      embeddingDimensions: process.env.EMBEDDING_DIMENSIONS || 'not configured'
    }, { status: 500 });
  }
}
