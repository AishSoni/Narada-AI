import { Redis } from '@upstash/redis';
import * as fs from 'fs';
import * as path from 'path';
import { hybridSearch, SearchResult } from './search-engine';
import { vectorStore } from './vector-store';
import { chunkText } from './text-extraction';
import { ResolvedConfig } from './resolved-config';
import { toEmbeddingConfig } from './resolved-config';
import { UnifiedEmbeddingClient } from './unified-embedding-client';
import type { Document, KnowledgeStack, StackStore } from './stack-store';

interface StoreData {
  stacks: KnowledgeStack[];
  documents: Document[];
  lastSaved: string;
}

const HOSTED_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export class HostedStore implements StackStore {
  private stacks: KnowledgeStack[] = [];
  private documents: Document[] = [];
  private loaded = false;
  private redis: Redis | null = null;
  private readonly storageKey: string;
  private readonly tmpPath: string;

  constructor(sessionId: string) {
    this.storageKey = `narada:hosted:${sessionId}`;
    this.tmpPath = path.join('/tmp', `narada-stacks-${sessionId}.json`);
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = Redis.fromEnv();
    }
  }

  async ready(): Promise<void> {
    if (this.loaded) return;
    try {
      if (this.redis) {
        const data = await this.redis.get<StoreData>(this.storageKey);
        if (data) {
          this.stacks = data.stacks || [];
          this.documents = data.documents || [];
        }
      } else if (fs.existsSync(this.tmpPath)) {
        const parsed: StoreData = JSON.parse(fs.readFileSync(this.tmpPath, 'utf-8'));
        this.stacks = parsed.stacks || [];
        this.documents = parsed.documents || [];
      }
    } catch (error) {
      console.warn('Failed to load hosted store:', error);
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    const data: StoreData = {
      stacks: this.stacks,
      documents: this.documents,
      lastSaved: new Date().toISOString(),
    };
    try {
      if (this.redis) {
        await this.redis.set(this.storageKey, data, { ex: HOSTED_TTL_SECONDS });
      } else {
        fs.writeFileSync(this.tmpPath, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Failed to persist hosted store:', error);
    }
  }

  getAllStacks(): KnowledgeStack[] {
    return this.stacks;
  }

  getStackById(id: string): KnowledgeStack | undefined {
    return this.stacks.find((stack) => stack.id === id);
  }

  addStack(stack: KnowledgeStack): void {
    this.stacks.push(stack);
    void this.persist();
  }

  updateStack(id: string, updates: Partial<KnowledgeStack>): boolean {
    const index = this.stacks.findIndex((stack) => stack.id === id);
    if (index === -1) return false;
    this.stacks[index] = { ...this.stacks[index], ...updates };
    void this.persist();
    return true;
  }

  deleteStack(id: string): boolean {
    const index = this.stacks.findIndex((stack) => stack.id === id);
    if (index === -1) return false;
    this.stacks.splice(index, 1);
    this.documents = this.documents.filter((doc) => doc.stackId !== id);
    if ('removeStack' in vectorStore) {
      void (vectorStore as import('./qdrant-vector-store').AdvancedVectorStore).removeStack(id);
    }
    void this.persist();
    return true;
  }

  getDocumentsByStackId(stackId: string): Document[] {
    return this.documents.filter((doc) => doc.stackId === stackId);
  }

  getDocumentById(stackId: string, documentId: string): Document | undefined {
    return this.documents.find((doc) => doc.id === documentId && doc.stackId === stackId);
  }

  addDocument(document: Document, config?: ResolvedConfig): void {
    this.documents.push(document);
    if (document.content && document.status === 'completed') {
      void this.generateDocumentEmbeddings(document, config);
    }
    this.updateStackDocumentCount(document.stackId);
    void this.persist();
  }

  private async generateDocumentEmbeddings(document: Document, config?: ResolvedConfig): Promise<void> {
    if (!document.content) return;
    try {
      const embeddingClient = config ? new UnifiedEmbeddingClient(toEmbeddingConfig(config)) : undefined;
      const chunks = chunkText(document.content, 1000, 200);
      await vectorStore.addDocument(
        document.stackId,
        document.id,
        chunks,
        {
          name: document.name,
          type: document.type,
          size: document.size,
          uploadedAt: document.uploadedAt,
          ...document.metadata,
        },
        embeddingClient
      );
    } catch (error) {
      console.error(`Failed to generate embeddings for document ${document.name}:`, error);
    }
  }

  deleteDocument(stackId: string, documentId: string): boolean {
    const index = this.documents.findIndex((doc) => doc.id === documentId && doc.stackId === stackId);
    if (index === -1) return false;
    this.documents.splice(index, 1);
    vectorStore.removeDocument(documentId);
    this.updateStackDocumentCount(stackId);
    void this.persist();
    return true;
  }

  async searchDocuments(
    stackId: string,
    query: string,
    limit = 5,
    config?: ResolvedConfig
  ): Promise<SearchResult[]> {
    const stackDocuments = this.documents.filter(
      (doc) => doc.stackId === stackId && doc.status === 'completed' && doc.content
    );
    if (stackDocuments.length === 0) return [];

    const embeddingClient = config ? new UnifiedEmbeddingClient(toEmbeddingConfig(config)) : undefined;

    if ('isEmbeddingAvailable' in vectorStore) {
      try {
        const vectorResults = await vectorStore.searchSimilar(
          stackId,
          query,
          limit * 2,
          0.7,
          embeddingClient
        );
        if (vectorResults.length > 0) {
          return vectorResults
            .map((vr) => {
              const doc = this.documents.find((d) => d.id === vr.documentId);
              return {
                id: vr.documentId,
                name: (vr.metadata.name as string) || doc?.name || 'Unknown Document',
                score: vr.score,
                content: doc?.content || '',
                snippet: this.extractSnippet(vr.content, query),
                metadata: vr.metadata,
              };
            })
            .slice(0, limit);
        }
      } catch (error) {
        console.error('Vector search failed, falling back to keyword search:', error);
      }
    }

    return hybridSearch(stackDocuments, query, limit);
  }

  private extractSnippet(content: string, query: string, maxLength = 200): string {
    const queryWords = query.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
    let bestPosition = 0;
    let bestScore = 0;
    for (let i = 0; i < content.length - maxLength; i += 50) {
      const snippet = content.substring(i, i + maxLength).toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (snippet.includes(word)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestPosition = i;
      }
    }
    let snippet = content.substring(bestPosition, bestPosition + maxLength);
    const firstSpace = snippet.indexOf(' ');
    if (firstSpace > 0 && firstSpace < 50) snippet = snippet.substring(firstSpace + 1);
    const lastSpace = snippet.lastIndexOf(' ');
    if (lastSpace > maxLength - 50) snippet = snippet.substring(0, lastSpace);
    return snippet.trim() + (bestPosition + maxLength < content.length ? '...' : '');
  }

  private updateStackDocumentCount(stackId: string): void {
    const stackDocuments = this.getDocumentsByStackId(stackId);
    const totalSize = stackDocuments.reduce((sum, doc) => sum + (doc.content?.length || 0), 0);
    this.updateStack(stackId, {
      documentsCount: stackDocuments.length,
      lastUpdated: new Date().toISOString(),
      size: this.formatFileSize(totalSize),
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
