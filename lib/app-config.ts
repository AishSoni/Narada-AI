import { API_PROVIDERS, DEFAULT_MODELS } from './config';

export interface AppConfig {
  // Search Configuration
  searchProvider: string;
  searchApiKey: string;
  
  // LLM Configuration
  llmProvider: string;
  llmApiKey: string;
  llmApiUrl?: string;
  llmModel: string;
  
  // Embedding Configuration
  embeddingProvider: string;
  embeddingApiKey: string;
  embeddingModel: string;
  embeddingApiUrl?: string;
}

/**
 * Get the current application configuration from environment variables
 */
export function getAppConfig(): AppConfig {
  const searchProvider = process.env.SEARCH_API_PROVIDER || API_PROVIDERS.SEARCH.FIRECRAWL;
  const llmProvider = process.env.LLM_PROVIDER || API_PROVIDERS.LLM.OPENAI;
  const embeddingProvider = process.env.EMBEDDING_PROVIDER || API_PROVIDERS.EMBEDDING.OPENAI;
  
  // Determine search API key based on provider
  let searchApiKey = '';
  switch (searchProvider) {
    case API_PROVIDERS.SEARCH.FIRECRAWL:
      searchApiKey = process.env.FIRECRAWL_API_KEY || '';
      break;
    case API_PROVIDERS.SEARCH.TAVILY:
      searchApiKey = process.env.TAVILY_API_KEY || '';
      break;
    case API_PROVIDERS.SEARCH.SERP:
      searchApiKey = process.env.SERP_API_KEY || '';
      break;
    case API_PROVIDERS.SEARCH.DUCKDUCKGO:
      searchApiKey = process.env.DUCKDUCKGO_API_KEY || '';
      break;
  }
  
  // Determine LLM configuration based on provider
  let llmApiKey = '';
  let llmApiUrl = '';
  let llmModel = '';
  switch (llmProvider) {
    case API_PROVIDERS.LLM.OPENAI:
      llmApiKey = process.env.OPENAI_API_KEY || '';
      llmModel = process.env.OPENAI_LLM_MODEL || DEFAULT_MODELS.OPENAI_LLM;
      break;
    case API_PROVIDERS.LLM.OLLAMA:
      llmApiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
      llmModel = process.env.OLLAMA_LLM_MODEL || DEFAULT_MODELS.OLLAMA_LLM;
      break;
    case API_PROVIDERS.LLM.OPENROUTER:
      llmApiKey = process.env.OPENROUTER_API_KEY || '';
      llmModel = process.env.OPENROUTER_LLM_MODEL || DEFAULT_MODELS.OPENROUTER_LLM;
      break;
  }
  
  // Determine embedding configuration based on provider
  let embeddingApiKey = '';
  let embeddingModel = '';
  let embeddingApiUrl = '';
  switch (embeddingProvider) {
    case API_PROVIDERS.EMBEDDING.OPENAI:
      embeddingApiKey = process.env.OPENAI_API_KEY || '';
      embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || DEFAULT_MODELS.OPENAI_EMBEDDING;
      break;
    case API_PROVIDERS.EMBEDDING.OLLAMA:
      embeddingApiUrl = process.env.OLLAMA_EMBEDDING_URL || 'http://localhost:11434';
      embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || DEFAULT_MODELS.OLLAMA_EMBEDDING;
      break;
    case API_PROVIDERS.EMBEDDING.COHERE:
      embeddingApiKey = process.env.COHERE_API_KEY || '';
      embeddingModel = process.env.COHERE_EMBEDDING_MODEL || DEFAULT_MODELS.COHERE_EMBEDDING;
      break;
  }
  
  return {
    searchProvider,
    searchApiKey,
    llmProvider,
    llmApiKey,
    llmApiUrl,
    llmModel,
    embeddingProvider,
    embeddingApiKey,
    embeddingModel,
    embeddingApiUrl,
  };
}

/**
 * Check if the current configuration is valid (has required API keys)
 */
export function isConfigValid(config?: AppConfig): boolean {
  const appConfig = config || getAppConfig();
  
  // Check search provider
  if (!appConfig.searchApiKey) {
    return false;
  }
  
  // Check LLM provider
  if (appConfig.llmProvider !== API_PROVIDERS.LLM.OLLAMA && !appConfig.llmApiKey) {
    return false;
  }
  
  // Check embedding provider
  if (appConfig.embeddingProvider !== API_PROVIDERS.EMBEDDING.OLLAMA && !appConfig.embeddingApiKey) {
    return false;
  }
  
  return true;
}

/**
 * Get user-friendly provider names
 */
export function getProviderDisplayName(provider: string, type: 'search' | 'llm' | 'embedding'): string {
  switch (type) {
    case 'search':
      switch (provider) {
        case API_PROVIDERS.SEARCH.FIRECRAWL: return 'FireCrawl';
        case API_PROVIDERS.SEARCH.TAVILY: return 'Tavily';
        case API_PROVIDERS.SEARCH.SERP: return 'SERP API';
        case API_PROVIDERS.SEARCH.DUCKDUCKGO: return 'DuckDuckGo';
        default: return provider;
      }
    case 'llm':
      switch (provider) {
        case API_PROVIDERS.LLM.OPENAI: return 'OpenAI';
        case API_PROVIDERS.LLM.OLLAMA: return 'Ollama';
        case API_PROVIDERS.LLM.OPENROUTER: return 'OpenRouter';
        default: return provider;
      }
    case 'embedding':
      switch (provider) {
        case API_PROVIDERS.EMBEDDING.OPENAI: return 'OpenAI';
        case API_PROVIDERS.EMBEDDING.OLLAMA: return 'Ollama';
        default: return provider;
      }
    default:
      return provider;
  }
}
