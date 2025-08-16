import { getAppConfig } from './app-config';
import { API_PROVIDERS } from './config';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMConfig {
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
}

export class LangGraphLLMClient {
  private config: LLMConfig;

  constructor(overrideConfig?: Partial<LLMConfig>) {
    const appConfig = getAppConfig();
    
    this.config = {
      provider: overrideConfig?.provider || appConfig.llmProvider,
      apiKey: overrideConfig?.apiKey || appConfig.llmApiKey,
      apiUrl: overrideConfig?.apiUrl || appConfig.llmApiUrl,
      model: overrideConfig?.model || appConfig.llmModel,
      temperature: overrideConfig?.temperature ?? 0,
      maxTokens: overrideConfig?.maxTokens ?? 4000,
      streaming: overrideConfig?.streaming ?? false,
    };

    this.validateConfig();
  }

  private validateConfig() {
    switch (this.config.provider) {
      case API_PROVIDERS.LLM.OPENAI:
        if (!this.config.apiKey) {
          throw new Error('OpenAI API key is required');
        }
        break;
      case API_PROVIDERS.LLM.OLLAMA:
        if (!this.config.apiUrl) {
          throw new Error('Ollama API URL is required');
        }
        break;
      case API_PROVIDERS.LLM.OPENROUTER:
        if (!this.config.apiKey) {
          throw new Error('OpenRouter API key is required');
        }
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
    }
  }

  async invoke(messages: LLMMessage[]): Promise<LLMResponse> {
    switch (this.config.provider) {
      case API_PROVIDERS.LLM.OPENAI:
        return this.invokeOpenAI(messages);
      case API_PROVIDERS.LLM.OLLAMA:
        return this.invokeOllama(messages);
      case API_PROVIDERS.LLM.OPENROUTER:
        return this.invokeOpenRouter(messages);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async invokeOpenAI(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: this.config.streaming,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
    };
  }

  private async invokeOllama(messages: LLMMessage[]): Promise<LLMResponse> {
    // Convert messages to Ollama format
    const prompt = messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return `System: ${msg.content}`;
        case 'user':
          return `Human: ${msg.content}`;
        case 'assistant':
          return `Assistant: ${msg.content}`;
        default:
          return msg.content;
      }
    }).join('\n\n');

    const response = await fetch(`${this.config.apiUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        prompt: prompt + '\n\nAssistant:',
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.response || '',
    };
  }

  private async invokeOpenRouter(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://narada-ai.com',
        'X-Title': 'Narada AI',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: this.config.streaming,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
    };
  }

  async stream(messages: LLMMessage[], onChunk: (chunk: string) => void): Promise<void> {
    if (!this.config.streaming) {
      // Fallback to non-streaming
      const response = await this.invoke(messages);
      onChunk(response.content);
      return;
    }

    switch (this.config.provider) {
      case API_PROVIDERS.LLM.OPENAI:
        return this.streamOpenAI(messages, onChunk);
      case API_PROVIDERS.LLM.OPENROUTER:
        return this.streamOpenRouter(messages, onChunk);
      default:
        // Ollama streaming is more complex, fallback to regular invoke
        const response = await this.invoke(messages);
        onChunk(response.content);
    }
  }

  private async streamOpenAI(messages: LLMMessage[], onChunk: (chunk: string) => void): Promise<void> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  private async streamOpenRouter(messages: LLMMessage[], onChunk: (chunk: string) => void): Promise<void> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://narada-ai.com',
        'X-Title': 'Narada AI',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }

  getProvider(): string {
    return this.config.provider;
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
