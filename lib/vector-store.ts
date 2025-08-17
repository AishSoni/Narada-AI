// Vector Store implementation for Knowledge Stack embeddings
// This provides vector similarity search capabilities using cosine similarity

import { UnifiedEmbeddingClient } from './unified-embedding-client';
import { QdrantVectorStore } from './qdrant-vector-store';

export interface VectorDocument {
  id: string;
  stackId: string;
  documentId: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export interface VectorSearchResult {
  id: string;
  documentId: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

// In-memory vector store implementation (fallback)
class InMemoryVectorStore {
  private vectors: VectorDocument[] = [];
  private embeddingClient: UnifiedEmbeddingClient | null = null;

  constructor() {
    this.initializeEmbeddingClient();
  }

  private initializeEmbeddingClient(): void {
    try {
      this.embeddingClient = new UnifiedEmbeddingClient();
      console.log('In-memory vector store initialized with embedding client');
    } catch (error) {
      console.warn('Failed to initialize embedding client:', error);
      this.embeddingClient = null;
    }
  }

  // Add a document with embeddings to the vector store
  async addDocument(stackId: string, documentId: string, chunks: string[], metadata: Record<string, any>): Promise<string[]> {
    if (!this.embeddingClient) {
      throw new Error('Embedding client not available. Please configure embedding provider.');
    }

    try {
      console.log(`Generating embeddings for ${chunks.length} chunks of document ${documentId}`);
      const embeddings = await this.embeddingClient.embedTexts(chunks);
      
      const vectorIds: string[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const vectorId = `${documentId}_chunk_${i}`;
        const vectorDoc: VectorDocument = {
          id: vectorId,
          stackId,
          documentId,
          content: chunks[i],
          embedding: embeddings[i],
          metadata: {
            ...metadata,
            chunkIndex: i,
            totalChunks: chunks.length
          }
        };
        
        this.vectors.push(vectorDoc);
        vectorIds.push(vectorId);
      }
      
      console.log(`Added ${chunks.length} vector embeddings for document ${documentId}`);
      return vectorIds;
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      
      // Don't throw immediately - allow graceful degradation
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('Embedding model not found - vector search will be disabled for this session');
        this.embeddingClient = null; // Disable embedding client to prevent further 404s
      }
      
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Search for similar documents using vector similarity
  async searchSimilar(stackId: string, query: string, limit: number = 5, threshold: number = 0.7): Promise<VectorSearchResult[]> {
    if (!this.embeddingClient) {
      console.warn('Embedding client not available - cannot perform vector search');
      return [];
    }

    try {
      console.log(`Searching vectors for query: "${query}" in stack ${stackId}`);
      
      // Get query embedding
      const queryEmbedding = await this.embeddingClient.embedText(query);
      
      // Filter vectors for the specific stack
      const stackVectors = this.vectors.filter(v => v.stackId === stackId);
      
      if (stackVectors.length === 0) {
        console.log(`No vectors found for stack ${stackId}`);
        return [];
      }
      
      // Calculate cosine similarity for each vector
      const similarities = stackVectors.map(vector => ({
        vector,
        score: this.cosineSimilarity(queryEmbedding, vector.embedding)
      }));
      
      // Filter by threshold, sort by similarity, and limit results
      const results = similarities
        .filter(item => item.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => ({
          id: item.vector.id,
          documentId: item.vector.documentId,
          score: item.score,
          content: item.vector.content,
          metadata: item.vector.metadata
        }));
      
      console.log(`Found ${results.length} similar vectors with scores:`, results.map(r => r.score.toFixed(3)));
      return results;
    } catch (error) {
      console.error('Vector search failed:', error);
      
      // If it's a 404 error, disable embedding client to prevent further retries
      if (error instanceof Error && error.message.includes('404')) {
        console.warn('Embedding model not found - disabling vector search for this session');
        this.embeddingClient = null;
      }
      
      // Return empty array instead of throwing to allow fallback to keyword search
      return [];
    }
  }

  // Remove all vectors for a document
  removeDocument(documentId: string): number {
    const initialLength = this.vectors.length;
    this.vectors = this.vectors.filter(v => v.documentId !== documentId);
    const removed = initialLength - this.vectors.length;
    console.log(`Removed ${removed} vectors for document ${documentId}`);
    return removed;
  }

  // Remove all vectors for a stack
  removeStack(stackId: string): number {
    const initialLength = this.vectors.length;
    this.vectors = this.vectors.filter(v => v.stackId !== stackId);
    const removed = initialLength - this.vectors.length;
    console.log(`Removed ${removed} vectors for stack ${stackId}`);
    return removed;
  }

  // Calculate cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  // Check if embedding functionality is available
  isEmbeddingAvailable(): boolean {
    return this.embeddingClient !== null;
  }

  // Get embedding client status with details
  getEmbeddingStatus(): { available: boolean; provider?: string; error?: string } {
    if (!this.embeddingClient) {
      return { 
        available: false, 
        error: 'Embedding client not available - possibly due to configuration or model issues' 
      };
    }
    
    try {
      return { 
        available: true, 
        provider: this.embeddingClient.getProvider() 
      };
    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get statistics about the vector store
  getStats(): { totalVectors: number; stacks: string[]; documents: string[] } {
    const stacks = [...new Set(this.vectors.map(v => v.stackId))];
    const documents = [...new Set(this.vectors.map(v => v.documentId))];
    
    return {
      totalVectors: this.vectors.length,
      stacks,
      documents
    };
  }
}

// Factory function to create the appropriate vector store
function createVectorStore() {
  const vectorDbProvider = process.env.VECTOR_DB_PROVIDER;
  
  console.log(`Initializing vector store with provider: ${vectorDbProvider}`);
  
  if (vectorDbProvider === 'qdrant') {
    try {
      return new QdrantVectorStore();
    } catch (error) {
      console.warn('Failed to initialize Qdrant vector store, falling back to in-memory store:', error);
      return new InMemoryVectorStore();
    }
  }
  
  // Default to in-memory store
  return new InMemoryVectorStore();
}

// Export the vector store instance
export const vectorStore = createVectorStore();
