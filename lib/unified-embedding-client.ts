/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { CohereEmbeddings } from "@langchain/cohere";
import { getAppConfig } from './app-config';
import { API_PROVIDERS } from './config';

export interface EmbeddingProviderConfig {
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  model: string;
}

export class UnifiedEmbeddingClient {
  private provider: string;
  private config: EmbeddingProviderConfig;
  private embeddingModel: any = null;

  constructor(overrideConfig?: Partial<EmbeddingProviderConfig>) {
    const appConfig = getAppConfig();
    
    this.provider = overrideConfig?.provider || appConfig.embeddingProvider;
    this.config = {
      provider: this.provider,
      apiKey: overrideConfig?.apiKey || appConfig.embeddingApiKey,
      apiUrl: overrideConfig?.apiUrl || appConfig.embeddingApiUrl,
      model: overrideConfig?.model || appConfig.embeddingModel,
    };

    // Initialize the embedding model based on provider
    this.initializeEmbeddingModel();
  }

  private initializeEmbeddingModel() {
    switch (this.provider) {
      case API_PROVIDERS.EMBEDDING.OPENAI:
        this.initializeOpenAI();
        break;
      case API_PROVIDERS.EMBEDDING.OLLAMA:
        this.initializeOllama();
        break;
      case API_PROVIDERS.EMBEDDING.COHERE:
        this.initializeCohere();
        break;
      default:
        throw new Error(`Unsupported embedding provider: ${this.provider}`);
    }
  }

  private initializeOpenAI() {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.embeddingModel = new OpenAIEmbeddings({
      modelName: this.config.model,
      openAIApiKey: this.config.apiKey,
    });
  }

  private initializeOllama() {
    if (!this.config.apiUrl) {
      throw new Error('Ollama API URL is required');
    }

    this.embeddingModel = new OllamaEmbeddings({
      baseUrl: this.config.apiUrl,
      model: this.config.model,
    });
  }

  private initializeCohere() {
    if (!this.config.apiKey) {
      throw new Error('Cohere API key is required');
    }

    this.embeddingModel = new CohereEmbeddings({
      apiKey: this.config.apiKey,
      model: this.config.model,
    });
  }

  // Generate embeddings for a single text
  async embedText(text: string): Promise<number[]> {
    if (!this.embeddingModel) {
      throw new Error(`Embedding model not initialized for provider: ${this.provider}`);
    }

    try {
      return await this.embeddingModel.embedQuery(text);
    } catch (error) {
      throw new Error(`Failed to generate embedding with ${this.provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate embeddings for multiple texts
  async embedTexts(texts: string[]): Promise<number[][]> {
    if (!this.embeddingModel) {
      throw new Error(`Embedding model not initialized for provider: ${this.provider}`);
    }

    try {
      return await this.embeddingModel.embedDocuments(texts);
    } catch (error) {
      throw new Error(`Failed to generate embeddings with ${this.provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get the embedding model instance
  getEmbeddingModel(): any {
    if (!this.embeddingModel) {
      throw new Error(`Embedding model not initialized for provider: ${this.provider}`);
    }
    return this.embeddingModel;
  }

  getProvider(): string {
    return this.provider;
  }

  getConfig(): EmbeddingProviderConfig {
    return { ...this.config };
  }

  // Helper method to check if the provider is properly configured
  static isProviderConfigured(provider?: string): boolean {
    const appConfig = getAppConfig();
    const embeddingProvider = provider || appConfig.embeddingProvider;

    switch (embeddingProvider) {
      case API_PROVIDERS.EMBEDDING.OPENAI:
        return !!appConfig.embeddingApiKey && !!appConfig.embeddingModel;
      case API_PROVIDERS.EMBEDDING.OLLAMA:
        return !!appConfig.embeddingApiUrl && !!appConfig.embeddingModel;
      case API_PROVIDERS.EMBEDDING.COHERE:
        return !!appConfig.embeddingApiKey && !!appConfig.embeddingModel;
      default:
        return false;
    }
  }

  // Helper method to get embedding dimensions based on the model
  getEmbeddingDimensions(): number | undefined {
    switch (this.provider) {
      case API_PROVIDERS.EMBEDDING.OPENAI:
        // OpenAI embedding dimensions
        if (this.config.model.includes('text-embedding-3-small')) return 1536;
        if (this.config.model.includes('text-embedding-3-large')) return 3072;
        if (this.config.model.includes('ada-002')) return 1536;
        return 1536; // Default for OpenAI
      case API_PROVIDERS.EMBEDDING.COHERE:
        // Cohere embedding dimensions
        if (this.config.model.includes('embed-english-v3.0')) return 1024;
        if (this.config.model.includes('embed-english-light-v3.0')) return 384;
        if (this.config.model.includes('embed-multilingual-v3.0')) return 1024;
        if (this.config.model.includes('embed-english-v2.0')) return 4096;
        return 1024; // Default for Cohere v3
      case API_PROVIDERS.EMBEDDING.OLLAMA:
        // Ollama dimensions vary by model - would need to be configured or detected
        return undefined;
      default:
        return undefined;
    }
  }
}
