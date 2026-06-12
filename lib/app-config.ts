import { API_PROVIDERS, DEFAULT_MODELS } from './config';
import { readEnvFileSync } from './env-file';
import { isLocal } from './runtime';

export interface AppConfig {
  searchProvider: string;
  searchApiKey: string;
  llmProvider: string;
  llmApiKey: string;
  llmApiUrl?: string;
  llmModel: string;
  embeddingProvider: string;
  embeddingApiKey: string;
  embeddingModel: string;
  embeddingApiUrl?: string;
}

function getEnvSource(): Record<string, string | undefined> {
  if (isLocal()) {
    const fileEnv = readEnvFileSync();
    return { ...process.env, ...fileEnv };
  }
  return process.env;
}

/**
 * Get the current application configuration.
 * In local profile, merges .env.local (file wins) so settings apply without restart.
 */
export function getAppConfig(): AppConfig {
  const env = getEnvSource();
  const searchProvider = env.SEARCH_API_PROVIDER || API_PROVIDERS.SEARCH.FIRECRAWL;
  const llmProvider = env.LLM_PROVIDER || API_PROVIDERS.LLM.OPENAI;
  const embeddingProvider = env.EMBEDDING_PROVIDER || API_PROVIDERS.EMBEDDING.OPENAI;

  let searchApiKey = '';
  switch (searchProvider) {
    case API_PROVIDERS.SEARCH.FIRECRAWL:
      searchApiKey = env.FIRECRAWL_API_KEY || '';
      break;
    case API_PROVIDERS.SEARCH.TAVILY:
      searchApiKey = env.TAVILY_API_KEY || '';
      break;
    case API_PROVIDERS.SEARCH.SERP:
      searchApiKey = env.SERP_API_KEY || '';
      break;
    case API_PROVIDERS.SEARCH.DUCKDUCKGO:
      searchApiKey = env.DUCKDUCKGO_API_KEY || '';
      break;
  }

  let llmApiKey = '';
  let llmApiUrl = '';
  let llmModel = '';
  switch (llmProvider) {
    case API_PROVIDERS.LLM.OPENAI:
      llmApiKey = env.OPENAI_API_KEY || '';
      llmModel = env.OPENAI_LLM_MODEL || DEFAULT_MODELS.OPENAI_LLM;
      break;
    case API_PROVIDERS.LLM.OLLAMA:
      llmApiUrl = env.OLLAMA_API_URL || 'http://localhost:11434';
      llmModel = env.OLLAMA_LLM_MODEL || DEFAULT_MODELS.OLLAMA_LLM;
      break;
    case API_PROVIDERS.LLM.OPENROUTER:
      llmApiKey = env.OPENROUTER_API_KEY || '';
      llmModel = env.OPENROUTER_LLM_MODEL || DEFAULT_MODELS.OPENROUTER_LLM;
      break;
  }

  let embeddingApiKey = '';
  let embeddingModel = '';
  let embeddingApiUrl = '';
  switch (embeddingProvider) {
    case API_PROVIDERS.EMBEDDING.OPENAI:
      embeddingApiKey = env.OPENAI_API_KEY || '';
      embeddingModel = env.OPENAI_EMBEDDING_MODEL || DEFAULT_MODELS.OPENAI_EMBEDDING;
      break;
    case API_PROVIDERS.EMBEDDING.OLLAMA:
      embeddingApiUrl = env.OLLAMA_EMBEDDING_URL || 'http://localhost:11434';
      embeddingModel = env.OLLAMA_EMBEDDING_MODEL || DEFAULT_MODELS.OLLAMA_EMBEDDING;
      break;
    case API_PROVIDERS.EMBEDDING.COHERE:
      embeddingApiKey = env.COHERE_API_KEY || '';
      embeddingModel = env.COHERE_EMBEDDING_MODEL || DEFAULT_MODELS.COHERE_EMBEDDING;
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

export function isConfigValid(config?: AppConfig): boolean {
  const appConfig = config || getAppConfig();

  if (!appConfig.searchApiKey) return false;
  if (appConfig.llmProvider !== API_PROVIDERS.LLM.OLLAMA && !appConfig.llmApiKey) return false;
  if (appConfig.embeddingProvider !== API_PROVIDERS.EMBEDDING.OLLAMA && !appConfig.embeddingApiKey) {
    return false;
  }
  return true;
}

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
