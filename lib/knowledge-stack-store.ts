// Simple in-memory data store for Knowledge Stacks
// In production, this would be replaced with a proper database

import { hybridSearch, SearchResult } from './search-engine';
import { vectorStore } from './vector-store';
import { chunkText } from './text-extraction';
import * as fs from 'fs';
import * as path from 'path';

export interface KnowledgeStack {
  id: string;
  name: string;
  description: string;
  documentsCount: number;
  lastUpdated: string;
  size: string;
  createdAt: string;
}

export interface Document {
  [key: string]: unknown;
  id: string;
  stackId: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'failed';
  content?: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    fileType?: string;
  };
}

interface StoreData {
  stacks: KnowledgeStack[];
  documents: Document[];
  lastSaved: string;
}

class KnowledgeStackStore {
  private stacks: KnowledgeStack[] = [];
  private documents: Document[] = [];
  private persistenceFile: string;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.persistenceFile = path.join(process.cwd(), '.narada-stacks.json');
    this.loadFromDisk();
  }

  // Load data from disk if available
  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.persistenceFile)) {
        const data = fs.readFileSync(this.persistenceFile, 'utf-8');
        const parsed: StoreData = JSON.parse(data);
        this.stacks = parsed.stacks || [];
        this.documents = parsed.documents || [];
        console.log(`[DEBUG] Loaded ${this.stacks.length} stacks and ${this.documents.length} documents from disk`);
        console.log(`[DEBUG] Loaded stacks:`, this.stacks.map(s => ({ id: s.id, name: s.name })));
      } else {
        console.log(`[DEBUG] No persistence file found at ${this.persistenceFile}`);
      }
    } catch (error) {
      console.warn('Failed to load knowledge stack data from disk:', error);
    }
  }

  // Save data to disk (debounced)
  private saveToDisk(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    
    this.saveDebounceTimer = setTimeout(() => {
      try {
        const data: StoreData = {
          stacks: this.stacks,
          documents: this.documents,
          lastSaved: new Date().toISOString()
        };
        fs.writeFileSync(this.persistenceFile, JSON.stringify(data, null, 2));
        console.log('Knowledge stack data saved to disk');
      } catch (error) {
        console.error('Failed to save knowledge stack data to disk:', error);
      }
    }, 1000); // Save after 1 second of inactivity
  }

  // Knowledge Stacks methods
  getAllStacks(): KnowledgeStack[] {
    return this.stacks;
  }

  getStackById(id: string): KnowledgeStack | undefined {
    return this.stacks.find(stack => stack.id === id);
  }

  addStack(stack: KnowledgeStack): void {
    this.stacks.push(stack);
    this.saveToDisk();
  }

  updateStack(id: string, updates: Partial<KnowledgeStack>): boolean {
    const index = this.stacks.findIndex(stack => stack.id === id);
    if (index === -1) return false;
    
    this.stacks[index] = { ...this.stacks[index], ...updates };
    this.saveToDisk();
    return true;
  }

  deleteStack(id: string): boolean {
    const index = this.stacks.findIndex(stack => stack.id === id);
    if (index === -1) return false;
    
    this.stacks.splice(index, 1);
    // Also remove all documents in this stack
    this.documents = this.documents.filter(doc => doc.stackId !== id);
    
    // Remove all vectors for this stack
    if ('removeStack' in vectorStore) {
      (vectorStore as import('./qdrant-vector-store').AdvancedVectorStore).removeStack(id);
    }
    
    this.saveToDisk();
    return true;
  }

  // Documents methods
  getDocumentsByStackId(stackId: string): Document[] {
    return this.documents.filter(doc => doc.stackId === stackId);
  }

  getDocumentById(stackId: string, documentId: string): Document | undefined {
    return this.documents.find(doc => doc.id === documentId && doc.stackId === stackId);
  }

  addDocument(document: Document): void {
    this.documents.push(document);
    
    // Generate vector embeddings for the document if it has content
    if (document.content && document.status === 'completed') {
      this.generateDocumentEmbeddings(document).catch(error => {
        console.error(`Failed to generate embeddings for document ${document.id}:`, error);
      });
    }
    
    // Update stack info
    this.updateStackDocumentCount(document.stackId);
    this.saveToDisk();
  }

  private async generateDocumentEmbeddings(document: Document): Promise<void> {
    if (!document.content || !('isEmbeddingAvailable' in vectorStore) || !(vectorStore as import('./qdrant-vector-store').AdvancedVectorStore).isEmbeddingAvailable()) {
      console.log('Skipping embedding generation - no content or embedding service unavailable');
      return;
    }

    try {
      // Chunk the document content for better embeddings
      const chunks = chunkText(document.content, 1000, 200);
      console.log(`Creating ${chunks.length} chunks for document ${document.name}`);
      
      // Add to vector store
      await vectorStore.addDocument(
        document.stackId,
        document.id,
        chunks,
        {
          name: document.name,
          type: document.type,
          size: document.size,
          uploadedAt: document.uploadedAt,
          ...document.metadata
        }
      );
      
      console.log(`Generated embeddings for document ${document.name}`);
    } catch (error) {
      console.error(`Failed to generate embeddings for document ${document.name}:`, error);
      
      // If it's a model not found error, log a helpful message
      if (error instanceof Error && error.message.includes('not found')) {
        console.warn('Embedding model not available - document will be searchable using keyword search only');
      }
      
      // Don't throw - allow the document to be stored without embeddings
      // It will still be searchable using keyword/TF-IDF search
    }
  }

  deleteDocument(stackId: string, documentId: string): boolean {
    const index = this.documents.findIndex(doc => doc.id === documentId && doc.stackId === stackId);
    if (index === -1) return false;
    
    this.documents.splice(index, 1);
    
    // Remove vectors for this document
    vectorStore.removeDocument(documentId);
    
    // Update stack info
    this.updateStackDocumentCount(stackId);
    return true;
  }

  // Search documents in a stack using vector search and keyword fallback
  async searchDocuments(stackId: string, query: string, limit = 5): Promise<SearchResult[]> {
    const stackDocuments = this.documents.filter(
      doc => doc.stackId === stackId && doc.status === 'completed' && doc.content
    );

    if (stackDocuments.length === 0) {
      return [];
    }

    let results: SearchResult[] = [];

    // Try vector search first if embeddings are available
    if ('isEmbeddingAvailable' in vectorStore && (vectorStore as import('./qdrant-vector-store').AdvancedVectorStore).isEmbeddingAvailable()) {
      try {
        console.log(`Performing vector search for query: "${query}"`);
        const vectorResults = await vectorStore.searchSimilar(stackId, query, limit * 2, 0.7);
        
        if (vectorResults.length > 0) {
          // Convert vector results to SearchResult format
          results = vectorResults.map(vr => {
            const doc = this.documents.find(d => d.id === vr.documentId);
            return {
              id: vr.documentId,
              name: (vr.metadata.name as string) || doc?.name || 'Unknown Document',
              score: vr.score,
              content: doc?.content || '',
              snippet: this.extractSnippet(vr.content, query),
              metadata: vr.metadata
            };
          }).slice(0, limit);
          
          console.log(`Vector search found ${results.length} results`);
          return results;
        }
      } catch (error) {
        console.error('Vector search failed, falling back to keyword search:', error);
      }
    }

    // Fallback to keyword search if vector search is unavailable or found no results
    console.log('Using keyword search fallback');
    return hybridSearch(stackDocuments, query, limit);
  }

  // Extract a relevant snippet from content
  private extractSnippet(content: string, query: string, maxLength = 200): string {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    // Find the best position to extract snippet from
    let bestPosition = 0;
    let bestScore = 0;
    
    for (let i = 0; i < content.length - maxLength; i += 50) {
      const snippet = content.substring(i, i + maxLength).toLowerCase();
      let score = 0;
      
      for (const word of queryWords) {
        if (snippet.includes(word)) {
          score += 1;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestPosition = i;
      }
    }
    
    let snippet = content.substring(bestPosition, bestPosition + maxLength);
    
    // Try to start at a word boundary
    const firstSpace = snippet.indexOf(' ');
    if (firstSpace > 0 && firstSpace < 50) {
      snippet = snippet.substring(firstSpace + 1);
    }
    
    // Try to end at a word boundary
    const lastSpace = snippet.lastIndexOf(' ');
    if (lastSpace > maxLength - 50) {
      snippet = snippet.substring(0, lastSpace);
    }
    
    return snippet.trim() + (bestPosition + maxLength < content.length ? '...' : '');
  }

  private updateStackDocumentCount(stackId: string): void {
    const stackDocuments = this.getDocumentsByStackId(stackId);
    const totalSize = stackDocuments.reduce((sum, doc) => {
      return sum + (doc.content?.length || 0);
    }, 0);
    
    this.updateStack(stackId, {
      documentsCount: stackDocuments.length,
      lastUpdated: new Date().toISOString(),
      size: this.formatFileSize(totalSize)
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

// Export a singleton instance
export const knowledgeStackStore = new KnowledgeStackStore();
