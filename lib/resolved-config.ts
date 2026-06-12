import { AppConfig, getAppConfig } from './app-config';
import { isHosted } from './runtime';

export type ResolvedConfig = AppConfig;

export interface BYOKCredentials {
  searchApiKey?: string;
  searchApiUrl?: string;
  llmApiKey?: string;
  embeddingApiKey?: string;
  searchProvider?: string;
  llmProvider?: string;
  llmApiUrl?: string;
  llmModel?: string;
  embeddingProvider?: string;
  embeddingModel?: string;
  embeddingApiUrl?: string;
}

export function resolveConfig(byok?: BYOKCredentials): ResolvedConfig {
  const base = getAppConfig();

  if (!isHosted() || !byok) {
    return base;
  }

  return {
    searchProvider: byok.searchProvider || base.searchProvider,
    searchApiKey: byok.searchApiKey || base.searchApiKey,
    searchApiUrl: byok.searchApiUrl || base.searchApiUrl,
    llmProvider: byok.llmProvider || base.llmProvider,
    llmApiKey: byok.llmApiKey || base.llmApiKey,
    llmApiUrl: byok.llmApiUrl || base.llmApiUrl,
    llmModel: byok.llmModel || base.llmModel,
    embeddingProvider: byok.embeddingProvider || base.embeddingProvider,
    embeddingApiKey: byok.embeddingApiKey || base.embeddingApiKey,
    embeddingModel: byok.embeddingModel || base.embeddingModel,
    embeddingApiUrl: byok.embeddingApiUrl || base.embeddingApiUrl,
  };
}

export function toLLMConfig(config: ResolvedConfig) {
  return {
    provider: config.llmProvider,
    apiKey: config.llmApiKey,
    apiUrl: config.llmApiUrl,
    model: config.llmModel,
  };
}

export function toEmbeddingConfig(config: ResolvedConfig) {
  return {
    provider: config.embeddingProvider,
    apiKey: config.embeddingApiKey,
    apiUrl: config.embeddingApiUrl,
    model: config.embeddingModel,
  };
}
