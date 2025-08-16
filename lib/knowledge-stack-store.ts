// Simple in-memory data store for Knowledge Stacks
// In production, this would be replaced with a proper database

import { hybridSearch, SearchResult } from './search-engine';

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

class KnowledgeStackStore {
  private stacks: KnowledgeStack[] = [];
  private documents: Document[] = [];

  // Knowledge Stacks methods
  getAllStacks(): KnowledgeStack[] {
    return this.stacks;
  }

  getStackById(id: string): KnowledgeStack | undefined {
    return this.stacks.find(stack => stack.id === id);
  }

  addStack(stack: KnowledgeStack): void {
    this.stacks.push(stack);
  }

  updateStack(id: string, updates: Partial<KnowledgeStack>): boolean {
    const index = this.stacks.findIndex(stack => stack.id === id);
    if (index === -1) return false;
    
    this.stacks[index] = { ...this.stacks[index], ...updates };
    return true;
  }

  deleteStack(id: string): boolean {
    const index = this.stacks.findIndex(stack => stack.id === id);
    if (index === -1) return false;
    
    this.stacks.splice(index, 1);
    // Also remove all documents in this stack
    this.documents = this.documents.filter(doc => doc.stackId !== id);
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
    
    // Update stack info
    this.updateStackDocumentCount(document.stackId);
  }

  deleteDocument(stackId: string, documentId: string): boolean {
    const index = this.documents.findIndex(doc => doc.id === documentId && doc.stackId === stackId);
    if (index === -1) return false;
    
    this.documents.splice(index, 1);
    
    // Update stack info
    this.updateStackDocumentCount(stackId);
    return true;
  }

  // Search documents in a stack using improved search engine
  searchDocuments(stackId: string, query: string, limit = 5): SearchResult[] {
    const stackDocuments = this.documents.filter(
      doc => doc.stackId === stackId && doc.status === 'completed' && doc.content
    );

    if (stackDocuments.length === 0) {
      return [];
    }

    return hybridSearch(stackDocuments, query, limit);
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
