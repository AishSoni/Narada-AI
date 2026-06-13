import { SearchResult } from './search-engine';
import { ResolvedConfig } from './resolved-config';
import { isHosted } from './runtime';

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

export interface StackStore {
  ready(): Promise<void>;
  getAllStacks(): KnowledgeStack[];
  getStackById(id: string): KnowledgeStack | undefined;
  addStack(stack: KnowledgeStack): void;
  updateStack(id: string, updates: Partial<KnowledgeStack>): boolean;
  deleteStack(id: string): boolean;
  getDocumentsByStackId(stackId: string): Document[];
  getDocumentById(stackId: string, documentId: string): Document | undefined;
  addDocument(document: Document, config?: ResolvedConfig): void;
  deleteDocument(stackId: string, documentId: string): boolean;
  searchDocuments(
    stackId: string,
    query: string,
    limit?: number,
    config?: ResolvedConfig
  ): Promise<SearchResult[]>;
}

let localStoreInstance: StackStore | null = null;
const hostedStoreCache = new Map<string, StackStore>();

export async function getStackStore(sessionId?: string): Promise<StackStore> {
  if (isHosted()) {
    const id = sessionId || 'default';
    let store = hostedStoreCache.get(id);
    if (!store) {
      const { HostedStore } = await import('./hosted-store');
      store = new HostedStore(id);
      hostedStoreCache.set(id, store);
    }
    await store.ready();
    return store;
  }

  if (!localStoreInstance) {
    const { LocalFileStore } = await import('./knowledge-stack-store');
    localStoreInstance = new LocalFileStore();
  }
  await localStoreInstance.ready();
  return localStoreInstance;
}

/** @deprecated Use getStackStore() for profile-aware access */
export function getDefaultStackStore(): StackStore {
  if (!localStoreInstance) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LocalFileStore } = require('./knowledge-stack-store') as typeof import('./knowledge-stack-store');
    localStoreInstance = new LocalFileStore();
  }
  return localStoreInstance;
}
