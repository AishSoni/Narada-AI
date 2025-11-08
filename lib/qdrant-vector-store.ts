// Qdrant Vector Store implementation for Knowledge Stack embeddings
import { QdrantClient } from '@qdrant/js-client-rest';
import { UnifiedEmbeddingClient } from './unified-embedding-client';

export interface VectorDocument {
  id: string;
  stackId: string;
  documentId: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

export interface VectorSearchResult {
  id: string;
  documentId: string;
  score: number;
  content: string;
  metadata: Record<string, unknown>;
}

// Interface for advanced vector store features
export interface AdvancedVectorStore {
  healthCheck(): Promise<boolean>;
  getCollectionInfo(): Promise<unknown>;
  removeStack(stackId: string): Promise<void>;
  isEmbeddingAvailable(): boolean;
}

export class QdrantVectorStore implements AdvancedVectorStore {
  private client: QdrantClient;
  private embeddingClient: UnifiedEmbeddingClient | null = null;
  private collectionName: string;
  private isInitialized: boolean = false;

  constructor() {
    const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    const qdrantApiKey = process.env.QDRANT_API_KEY;
    this.collectionName = process.env.QDRANT_COLLECTION_NAME || 'narada_vectors';

    // Initialize Qdrant client
    this.client = new QdrantClient({
      url: qdrantUrl,
      apiKey: qdrantApiKey || undefined,
    });

    this.initializeEmbeddingClient();
    this.initializeCollection();
  }

  // Generate a numeric ID from a string (simple hash)
  private generateNumericId(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private initializeEmbeddingClient(): void {
    try {
      this.embeddingClient = new UnifiedEmbeddingClient();
      console.log('Qdrant vector store initialized with embedding client');
    } catch (error) {
      console.warn('Failed to initialize embedding client:', error);
      this.embeddingClient = null;
    }
  }

  private async initializeCollection(): Promise<void> {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const collectionExists = collections.collections.some(
        (col) => col.name === this.collectionName
      );

      if (!collectionExists) {
        console.log(`Creating Qdrant collection: ${this.collectionName}`);
        
        // Get embedding dimension from environment or test embedding
        let vectorSize = parseInt(process.env.EMBEDDING_DIMENSIONS || '1536');
        
        // If no dimension configured, try to get it from embedding client
        if (!process.env.EMBEDDING_DIMENSIONS && this.embeddingClient) {
          try {
            const testEmbedding = await this.embeddingClient.embedText('test');
            vectorSize = testEmbedding.length;
            console.log(`Auto-detected embedding dimension: ${vectorSize}`);
          } catch {
            console.warn('Failed to auto-detect embedding dimension, using default:', vectorSize);
          }
        } else {
          console.log(`Using configured embedding dimension: ${vectorSize}`);
        }

        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: vectorSize,
            distance: 'Cosine',
          },
        });
        
        console.log(`Created Qdrant collection "${this.collectionName}" with vector size ${vectorSize}`);
      } else {
        console.log(`Qdrant collection "${this.collectionName}" already exists`);
        
        // Verify the collection has the correct dimensions
        const collectionInfo = await this.client.getCollection(this.collectionName);
        const existingSize = collectionInfo.config?.params?.vectors?.size;
        const configuredSize = parseInt(process.env.EMBEDDING_DIMENSIONS || '1536');
        
        if (existingSize && existingSize !== configuredSize) {
          console.warn(`Warning: Existing collection has vector size ${existingSize}, but configured dimension is ${configuredSize}. This may cause errors. Consider recreating the collection.`);
        }
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Qdrant collection:', error);
      this.isInitialized = false;
    }
  }

  // Add a document with embeddings to the vector store
  async addDocument(stackId: string, documentId: string, chunks: string[], metadata: Record<string, unknown>): Promise<string[]> {
    if (!this.embeddingClient) {
      throw new Error('Embedding client not available. Please configure embedding provider.');
    }

    if (!this.isInitialized) {
      await this.initializeCollection();
    }

    try {
      console.log(`Generating embeddings for ${chunks.length} chunks of document ${documentId}`);
      const embeddings = await this.embeddingClient.embedTexts(chunks);
      
      const vectorIds: string[] = [];
      const points = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const vectorId = `${documentId}_chunk_${i}`;
        // Generate a hash-based numeric ID since Qdrant requires integer or UUID
        const numericId = this.generateNumericId(vectorId);
        
        const point = {
          id: numericId,
          vector: embeddings[i],
          payload: {
            stackId,
            documentId,
            content: chunks[i],
            chunkIndex: i,
            totalChunks: chunks.length,
            vectorId, // Store the original string ID in payload
            ...metadata,
          },
        };
        
        points.push(point);
        vectorIds.push(vectorId);
      }
      
      // Upsert points to Qdrant using the correct REST API format
      await this.client.upsert(this.collectionName, {
        wait: true,
        points,
      });
      
      console.log(`Added ${chunks.length} vector embeddings to Qdrant for document ${documentId}`);
      return vectorIds;
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      
      // Log detailed error information for debugging
      if (error && typeof error === 'object' && 'data' in error) {
        console.error('Qdrant error details:', error.data);
      }
      
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

    if (!this.isInitialized) {
      await this.initializeCollection();
    }

    try {
      console.log(`Searching Qdrant vectors for query: "${query}" in stack ${stackId}`);
      
      // Get query embedding
      const queryEmbedding = await this.embeddingClient.embedText(query);
      
      // Search in Qdrant
      const searchResult = await this.client.search(this.collectionName, {
        vector: queryEmbedding,
        filter: {
          must: [
            {
              key: 'stackId',
              match: { value: stackId },
            },
          ],
        },
        limit,
        score_threshold: threshold,
        with_payload: true,
      });
      
      // Convert Qdrant results to our format
      const results: VectorSearchResult[] = searchResult.map((hit) => ({
        id: hit.payload?.vectorId as string || hit.id.toString(),
        documentId: hit.payload?.documentId as string,
        score: hit.score,
        content: hit.payload?.content as string,
        metadata: {
          chunkIndex: hit.payload?.chunkIndex,
          totalChunks: hit.payload?.totalChunks,
          ...hit.payload,
        },
      }));
      
      console.log(`Found ${results.length} similar vectors in Qdrant`);
      return results;
    } catch (error) {
      console.error('Vector search failed:', error);
      return [];
    }
  }

  // Remove all vectors for a specific document
  async removeDocument(documentId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeCollection();
    }

    try {
      await this.client.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: 'documentId',
              match: { value: documentId },
            },
          ],
        },
        wait: true,
      });
      
      console.log(`Removed all vectors for document ${documentId} from Qdrant`);
    } catch (error) {
      console.error('Failed to remove document vectors:', error);
      throw error;
    }
  }

  // Remove all vectors for a specific stack
  async removeStack(stackId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeCollection();
    }

    try {
      await this.client.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: 'stackId',
              match: { value: stackId },
            },
          ],
        },
        wait: true,
      });
      
      console.log(`Removed all vectors for stack ${stackId} from Qdrant`);
    } catch (error) {
      console.error('Failed to remove stack vectors:', error);
      throw error;
    }
  }

  // Get collection info
  async getCollectionInfo(): Promise<unknown> {
    try {
      return await this.client.getCollection(this.collectionName);
    } catch (error) {
      console.error('Failed to get collection info:', error);
      return null;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch (error) {
      console.error('Qdrant health check failed:', error);
      return false;
    }
  }

  // Check if embedding is available
  isEmbeddingAvailable(): boolean {
    return this.embeddingClient !== null;
  }
}
