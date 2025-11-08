/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/community/llms/ollama";
import { getAppConfig } from './app-config';
import { API_PROVIDERS, MODEL_CONFIG } from './config';

export interface LLMProviderConfig {
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  model: string;
  temperature?: number;
  streaming?: boolean;
}

type LLMModel = ChatOpenAI | Ollama;

export class UnifiedLLMClient {
  private provider: string;
  private config: LLMProviderConfig;
  private fastModel: LLMModel | null = null;
  private qualityModel: LLMModel | null = null;
  private streamingModel: LLMModel | null = null;

  constructor(overrideConfig?: Partial<LLMProviderConfig>) {
    const appConfig = getAppConfig();
    
    this.provider = overrideConfig?.provider || appConfig.llmProvider;
    this.config = {
      provider: this.provider,
      apiKey: overrideConfig?.apiKey || appConfig.llmApiKey,
      apiUrl: overrideConfig?.apiUrl || appConfig.llmApiUrl,
      model: overrideConfig?.model || appConfig.llmModel,
      temperature: overrideConfig?.temperature || MODEL_CONFIG.TEMPERATURE,
      streaming: overrideConfig?.streaming || false,
    };

    // Initialize models based on provider
    this.initializeModels();
  }

  private initializeModels() {
    switch (this.provider) {
      case API_PROVIDERS.LLM.OPENAI:
        this.initializeOpenAI();
        break;
      case API_PROVIDERS.LLM.OLLAMA:
        this.initializeOllama();
        break;
      case API_PROVIDERS.LLM.OPENROUTER:
        this.initializeOpenRouter();
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  private initializeOpenAI() {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    // Fast model for quick operations
    this.fastModel = new ChatOpenAI({
      modelName: MODEL_CONFIG.FAST_MODEL,
      temperature: this.config.temperature,
      openAIApiKey: this.config.apiKey,
    });

    // Quality model for complex operations
    this.qualityModel = new ChatOpenAI({
      modelName: MODEL_CONFIG.QUALITY_MODEL,
      temperature: this.config.temperature,
      openAIApiKey: this.config.apiKey,
    });

    // Streaming model
    this.streamingModel = new ChatOpenAI({
      modelName: MODEL_CONFIG.QUALITY_MODEL,
      temperature: this.config.temperature,
      streaming: true,
      openAIApiKey: this.config.apiKey,
    });
  }

  private initializeOllama() {
    if (!this.config.apiUrl) {
      throw new Error('Ollama API URL is required');
    }

    // For Ollama, we use the same model for fast and quality operations
    // but can potentially use different models if configured
    const fastModel = process.env.OLLAMA_FAST_MODEL || this.config.model;
    const qualityModel = process.env.OLLAMA_QUALITY_MODEL || this.config.model;

    this.fastModel = new Ollama({
      baseUrl: this.config.apiUrl,
      model: fastModel,
      temperature: this.config.temperature,
    });

    this.qualityModel = new Ollama({
      baseUrl: this.config.apiUrl,
      model: qualityModel,
      temperature: this.config.temperature,
    });

    // For streaming, we'll use the same Ollama instance
    // Note: Ollama may not support streaming in the same way as OpenAI
    this.streamingModel = new Ollama({
      baseUrl: this.config.apiUrl,
      model: qualityModel,
      temperature: this.config.temperature,
    }) as any; // Type assertion since Ollama might not fully implement BaseChatModel
  }

  private initializeOpenRouter() {
    if (!this.config.apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    // OpenRouter uses OpenAI-compatible API
    this.fastModel = new ChatOpenAI({
      modelName: this.config.model,
      temperature: this.config.temperature,
      openAIApiKey: this.config.apiKey,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://narada-ai.com',
          'X-Title': 'Narada AI',
        },
      },
    });

    this.qualityModel = new ChatOpenAI({
      modelName: this.config.model,
      temperature: this.config.temperature,
      openAIApiKey: this.config.apiKey,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://narada-ai.com',
          'X-Title': 'Narada AI',
        },
      },
    });

    this.streamingModel = new ChatOpenAI({
      modelName: this.config.model,
      temperature: this.config.temperature,
      streaming: true,
      openAIApiKey: this.config.apiKey,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://narada-ai.com',
          'X-Title': 'Narada AI',
        },
      },
    });
  }

  // Getters for the models
  getFastModel(): any {
    if (!this.fastModel) {
      throw new Error(`Fast model not initialized for provider: ${this.provider}`);
    }
    return this.fastModel;
  }

  getQualityModel(): LLMModel {
    if (!this.qualityModel) {
      throw new Error(`Quality model not initialized for provider: ${this.provider}`);
    }
    return this.qualityModel;
  }

  getStreamingModel(): LLMModel {
    if (!this.streamingModel) {
      throw new Error(`Streaming model not initialized for provider: ${this.provider}`);
    }
    return this.streamingModel;
  }

  getProvider(): string {
    return this.provider;
  }

  getConfig(): LLMProviderConfig {
    return { ...this.config };
  }

  // Helper method to check if the provider is properly configured
  static isProviderConfigured(provider?: string): boolean {
    const appConfig = getAppConfig();
    const targetProvider = provider || appConfig.llmProvider;

    switch (targetProvider) {
      case API_PROVIDERS.LLM.OPENAI:
        return !!appConfig.llmApiKey;
      case API_PROVIDERS.LLM.OLLAMA:
        return !!appConfig.llmApiUrl;
      case API_PROVIDERS.LLM.OPENROUTER:
        return !!appConfig.llmApiKey;
      default:
        return false;
    }
  }
}
