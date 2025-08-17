'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Eye, EyeOff, Key, Settings as SettingsIcon, ChevronDown, ChevronRight, Database } from "lucide-react";
import Link from "next/link";
import { SEARCH_CONFIG } from "@/lib/config";
import { ThemeSettings } from "@/components/theme-settings";

interface EnvironmentConfig {
  // Search API Provider
  SEARCH_API_PROVIDER: string;
  FIRECRAWL_API_KEY: string;
  TAVILY_API_KEY: string;
  SERP_API_KEY: string;
  DUCKDUCKGO_API_KEY: string;
  
  // LLM Provider
  LLM_PROVIDER: string;
  OPENAI_API_KEY: string;
  OPENAI_LLM_MODEL: string;
  OLLAMA_API_URL: string;
  OLLAMA_LLM_MODEL: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_LLM_MODEL: string;
  
  // Embedding Provider
  EMBEDDING_PROVIDER: string;
  OPENAI_EMBEDDING_MODEL: string;
  COHERE_API_KEY: string;
  COHERE_EMBEDDING_MODEL: string;
  OLLAMA_EMBEDDING_MODEL: string;
  OLLAMA_EMBEDDING_URL: string;
  EMBEDDING_DIMENSIONS: number;
  
  // Vector Database Provider
  VECTOR_DB_PROVIDER: string;
  QDRANT_API_KEY: string;
  QDRANT_URL: string;
  QDRANT_COLLECTION_NAME: string;
  
  // Advanced Search Settings
  MAX_SEARCH_QUERIES: number;
  MAX_SOURCES_PER_SEARCH: number;
  MAX_SOURCES_TO_SCRAPE: number;
  MIN_CONTENT_LENGTH: number;
  SUMMARY_CHAR_LIMIT: number;
  CONTEXT_PREVIEW_LENGTH: number;
  ANSWER_CHECK_PREVIEW: number;
  MAX_SOURCES_TO_CHECK: number;
  MAX_RETRIES: number;
  MAX_SEARCH_ATTEMPTS: number;
  MIN_ANSWER_CONFIDENCE: number;
  EARLY_TERMINATION_CONFIDENCE: number;
  SCRAPE_TIMEOUT: number;
  SOURCE_ANIMATION_DELAY: number;
  PARALLEL_SUMMARY_GENERATION: boolean;
}

const SEARCH_PROVIDERS = [
  { value: 'firecrawl', label: 'FireCrawl', description: 'Web scraping and crawling API' },
  { value: 'tavily', label: 'Tavily', description: 'AI search API for research' },
  { value: 'serp', label: 'SERP API', description: 'Google search results API' },
  { value: 'duckduckgo', label: 'DuckDuckGo', description: 'Offers private searches but has very restricting rate limits.' }
];

const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', description: 'GPT models (gpt-4o, gpt-4o-mini)' },
  { value: 'ollama', label: 'Ollama', description: 'Local LLM hosting' },
  { value: 'openrouter', label: 'OpenRouter', description: 'Multiple model providers' }
];

const EMBEDDING_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', description: 'text-embedding-3-small/large' },
  { value: 'cohere', label: 'Cohere', description: 'embed-english-v3.0/multilingual-v3.0' },
  { value: 'ollama', label: 'Ollama', description: 'Local embedding models' }
];

const VECTOR_DB_PROVIDERS = [
  { value: 'qdrant', label: 'Qdrant', description: 'High-performance vector database' }
];

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<EnvironmentConfig>({
    SEARCH_API_PROVIDER: 'firecrawl',
    FIRECRAWL_API_KEY: '',
    TAVILY_API_KEY: '',
    SERP_API_KEY: '',
    DUCKDUCKGO_API_KEY: '',
    LLM_PROVIDER: 'openai',
    OPENAI_API_KEY: '',
    OPENAI_LLM_MODEL: 'gpt-4o-mini',
    OLLAMA_API_URL: 'http://localhost:11434',
    OLLAMA_LLM_MODEL: 'llama3.2',
    OPENROUTER_API_KEY: '',
    OPENROUTER_LLM_MODEL: 'openai/gpt-4o-mini',
    EMBEDDING_PROVIDER: 'openai',
    OPENAI_EMBEDDING_MODEL: 'text-embedding-3-small',
    COHERE_API_KEY: '',
    COHERE_EMBEDDING_MODEL: 'embed-english-v3.0',
    OLLAMA_EMBEDDING_MODEL: 'nomic-embed-text',
    OLLAMA_EMBEDDING_URL: 'http://localhost:11434',
    EMBEDDING_DIMENSIONS: 1536,
    VECTOR_DB_PROVIDER: 'qdrant',
    QDRANT_API_KEY: '',
    QDRANT_URL: 'http://localhost:6333',
    QDRANT_COLLECTION_NAME: 'narada_vectors',
    // Advanced Search Settings with defaults from SEARCH_CONFIG
    MAX_SEARCH_QUERIES: SEARCH_CONFIG.MAX_SEARCH_QUERIES,
    MAX_SOURCES_PER_SEARCH: SEARCH_CONFIG.MAX_SOURCES_PER_SEARCH,
    MAX_SOURCES_TO_SCRAPE: SEARCH_CONFIG.MAX_SOURCES_TO_SCRAPE,
    MIN_CONTENT_LENGTH: SEARCH_CONFIG.MIN_CONTENT_LENGTH,
    SUMMARY_CHAR_LIMIT: SEARCH_CONFIG.SUMMARY_CHAR_LIMIT,
    CONTEXT_PREVIEW_LENGTH: SEARCH_CONFIG.CONTEXT_PREVIEW_LENGTH,
    ANSWER_CHECK_PREVIEW: SEARCH_CONFIG.ANSWER_CHECK_PREVIEW,
    MAX_SOURCES_TO_CHECK: SEARCH_CONFIG.MAX_SOURCES_TO_CHECK,
    MAX_RETRIES: SEARCH_CONFIG.MAX_RETRIES,
    MAX_SEARCH_ATTEMPTS: SEARCH_CONFIG.MAX_SEARCH_ATTEMPTS,
    MIN_ANSWER_CONFIDENCE: SEARCH_CONFIG.MIN_ANSWER_CONFIDENCE,
    EARLY_TERMINATION_CONFIDENCE: SEARCH_CONFIG.EARLY_TERMINATION_CONFIDENCE,
    SCRAPE_TIMEOUT: SEARCH_CONFIG.SCRAPE_TIMEOUT,
    SOURCE_ANIMATION_DELAY: SEARCH_CONFIG.SOURCE_ANIMATION_DELAY,
    PARALLEL_SUMMARY_GENERATION: SEARCH_CONFIG.PARALLEL_SUMMARY_GENERATION,
  });

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [maskedKeys, setMaskedKeys] = useState<Record<string, boolean>>({});
  const [revealingKeys, setRevealingKeys] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Dynamic model states
  const [llmModels, setLlmModels] = useState<ModelInfo[]>([]);
  const [embeddingModels, setEmbeddingModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Load current configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  // Fetch models when provider changes
  useEffect(() => {
    if (config.LLM_PROVIDER) {
      // Debounce the fetch to avoid excessive calls while typing URLs
      const timeoutId = setTimeout(() => {
        fetchLLMModels();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [config.LLM_PROVIDER, config.OPENAI_API_KEY, config.OLLAMA_API_URL, config.OPENROUTER_API_KEY]);

  useEffect(() => {
    if (config.EMBEDDING_PROVIDER) {
      // Debounce the fetch to avoid excessive calls while typing URLs
      const timeoutId = setTimeout(() => {
        fetchEmbeddingModels();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [config.EMBEDDING_PROVIDER, config.OPENAI_API_KEY, config.COHERE_API_KEY, config.OLLAMA_EMBEDDING_URL]);

  const fetchLLMModels = async () => {
    // Don't fetch if no provider is selected or if required credentials are missing
    if (!config.LLM_PROVIDER) return;
    
    // For OpenAI, don't fetch without API key
    if (config.LLM_PROVIDER === 'openai' && 
        (!config.OPENAI_API_KEY || config.OPENAI_API_KEY.includes('•••'))) {
      setLlmModels([]);
      return;
    }

    // For OpenRouter, don't fetch without API key
    if (config.LLM_PROVIDER === 'openrouter' && 
        (!config.OPENROUTER_API_KEY || config.OPENROUTER_API_KEY.includes('•••'))) {
      setLlmModels([]);
      return;
    }

    // For Ollama, don't fetch with invalid URLs
    if (config.LLM_PROVIDER === 'ollama' && config.OLLAMA_API_URL) {
      try {
        new URL(config.OLLAMA_API_URL); // Validate URL format
      } catch {
        setLlmModels([]);
        return;
      }
    }

    setIsLoadingModels(true);
    try {
      const params = new URLSearchParams({
        provider: config.LLM_PROVIDER,
      });

      if (config.LLM_PROVIDER === 'openai' && config.OPENAI_API_KEY && !config.OPENAI_API_KEY.includes('•••')) {
        params.append('apiKey', config.OPENAI_API_KEY);
      } else if (config.LLM_PROVIDER === 'ollama' && config.OLLAMA_API_URL) {
        params.append('apiUrl', config.OLLAMA_API_URL);
      } else if (config.LLM_PROVIDER === 'openrouter' && config.OPENROUTER_API_KEY && !config.OPENROUTER_API_KEY.includes('•••')) {
        params.append('apiKey', config.OPENROUTER_API_KEY);
      }

      const response = await fetch(`/api/models?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLlmModels(data.models || []);
      } else {
        // Don't log errors for expected failures (missing API keys, etc.)
        setLlmModels([]);
      }
    } catch (error) {
      // Only log unexpected errors
      if (!(error instanceof TypeError) || !error.message.includes('fetch')) {
        console.error('Error fetching LLM models:', error);
      }
      setLlmModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const fetchEmbeddingModels = async () => {
    // Don't fetch if no provider is selected
    if (!config.EMBEDDING_PROVIDER) return;

    // For OpenAI, don't fetch without API key
    if (config.EMBEDDING_PROVIDER === 'openai' && 
        (!config.OPENAI_API_KEY || config.OPENAI_API_KEY.includes('•••'))) {
      setEmbeddingModels([]);
      return;
    }

    // For Cohere, don't fetch without API key
    if (config.EMBEDDING_PROVIDER === 'cohere' && 
        (!config.COHERE_API_KEY || config.COHERE_API_KEY.includes('•••'))) {
      setEmbeddingModels([]);
      return;
    }

    // For Ollama, don't fetch with invalid URLs (but allow empty URL for default localhost)
    if (config.EMBEDDING_PROVIDER === 'ollama' && config.OLLAMA_EMBEDDING_URL) {
      try {
        new URL(config.OLLAMA_EMBEDDING_URL); // Validate URL format
      } catch {
        setEmbeddingModels([]);
        return;
      }
    }

    setIsLoadingModels(true);
    try {
      const params = new URLSearchParams({
        provider: config.EMBEDDING_PROVIDER,
      });

      if (config.EMBEDDING_PROVIDER === 'openai' && config.OPENAI_API_KEY && !config.OPENAI_API_KEY.includes('•••')) {
        params.append('apiKey', config.OPENAI_API_KEY);
      } else if (config.EMBEDDING_PROVIDER === 'cohere' && config.COHERE_API_KEY && !config.COHERE_API_KEY.includes('•••')) {
        params.append('apiKey', config.COHERE_API_KEY);
      } else if (config.EMBEDDING_PROVIDER === 'ollama') {
        // Send the URL if provided, otherwise the API will use default localhost:11434
        if (config.OLLAMA_EMBEDDING_URL) {
          params.append('apiUrl', config.OLLAMA_EMBEDDING_URL);
        }
      }

      const response = await fetch(`/api/models/embeddings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEmbeddingModels(data.models || []);
      } else {
        // Don't log errors for expected failures (missing API keys, etc.)
        setEmbeddingModels([]);
      }
    } catch (error) {
      // Only log unexpected errors
      if (!(error instanceof TypeError) || !error.message.includes('fetch')) {
        console.error('Error fetching embedding models:', error);
      }
      setEmbeddingModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, ...data }));
        
        // Track which keys are masked (contain •••)
        const masked: Record<string, boolean> = {};
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === 'string' && value.includes('•••')) {
            masked[key] = true;
          }
        });
        setMaskedKeys(masked);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        const error = await response.text();
        toast.error(`Failed to save settings: ${error}`);
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const testConfiguration = async () => {
    setShowTestDialog(true);
    setTestResults({});
    
    try {
      const response = await fetch('/api/settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const results = await response.json();
        setTestResults(results);
      } else {
        toast.error('Failed to test configuration');
      }
    } catch (error) {
      console.error('Failed to test configuration:', error);
      toast.error('Failed to test configuration');
    }
  };

  const toggleShowKey = async (key: string) => {
    // If the key is currently masked and we're trying to show it, fetch the real value
    if (maskedKeys[key] && !showKeys[key]) {
      setRevealingKeys(prev => ({ ...prev, [key]: true }));
      try {
        const response = await fetch('/api/settings/reveal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key }),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Update config with the real value and mark as unmasked
          setConfig(prev => ({ ...prev, [key]: data.value }));
          setMaskedKeys(prev => ({ ...prev, [key]: false }));
        } else {
          toast.error('Failed to reveal API key');
          return;
        }
      } catch (error) {
        console.error('Failed to reveal key:', error);
        toast.error('Failed to reveal API key');
        return;
      } finally {
        setRevealingKeys(prev => ({ ...prev, [key]: false }));
      }
    }
    
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateConfig = (key: keyof EnvironmentConfig, value: string | number | boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    
    // If user is updating an API key, clear the masked flag
    if (typeof value === 'string' && key.toString().includes('API_KEY')) {
      setMaskedKeys(prev => ({ ...prev, [key]: false }));
    }
  };

  const renderApiKeyInput = (
    key: keyof EnvironmentConfig,
    label: string,
    placeholder: string
  ) => {
    const isMasked = maskedKeys[key];
    const isRevealing = revealingKeys[key];
    const currentValue = typeof config[key] === "boolean" ? (config[key] ? "true" : "false") : config[key] as string | number;
    
    return (
      <div className="space-y-2">
        <Label htmlFor={key}>{label}</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id={key}
              type={showKeys[key] ? "text" : "password"}
              placeholder={placeholder}
              value={currentValue}
              onChange={(e) => updateConfig(key, e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => toggleShowKey(key)}
              disabled={isRevealing}
              title={
                isRevealing 
                  ? "Revealing key..." 
                  : isMasked 
                    ? "Click to reveal stored API key" 
                    : showKeys[key] 
                      ? "Hide key" 
                      : "Show key"
              }
            >
              {isRevealing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              ) : showKeys[key] ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {isMasked && !isRevealing && (
          <p className="text-xs text-muted-foreground">
            This API key is masked for security. Click the eye icon to reveal the stored value, or enter a new value.
          </p>
        )}
        {isRevealing && (
          <p className="text-xs text-muted-foreground">
            Revealing stored API key...
          </p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <SettingsIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chat
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Configure your API providers and models</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/knowledge-stacks">
              <Button variant="outline" className="gap-2">
                <Database className="h-4 w-4" />
                Knowledge Stacks
              </Button>
            </Link>
            <Button onClick={testConfiguration} variant="outline">
              Test Configuration
            </Button>
            <Button onClick={saveConfiguration} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Theme Settings Section */}
          <ThemeSettings />
          
          {/* Search API Provider Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Search API Provider
              </CardTitle>
              <CardDescription>
                Configure your preferred search and web scraping service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={config.SEARCH_API_PROVIDER}
                  onValueChange={(value: string) => updateConfig('SEARCH_API_PROVIDER', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEARCH_PROVIDERS.map(provider => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div>
                          <div className="font-medium">{provider.label}</div>
                          <div className="text-sm text-muted-foreground">{provider.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {config.SEARCH_API_PROVIDER === 'firecrawl' && 
                renderApiKeyInput('FIRECRAWL_API_KEY', 'FireCrawl API Key', 'fc-...')
              }
              {config.SEARCH_API_PROVIDER === 'tavily' && 
                renderApiKeyInput('TAVILY_API_KEY', 'Tavily API Key', 'tvly-...')
              }
              {config.SEARCH_API_PROVIDER === 'serp' && 
                renderApiKeyInput('SERP_API_KEY', 'SERP API Key', 'sk-...')
              }
              {config.SEARCH_API_PROVIDER === 'duckduckgo' && 
                renderApiKeyInput('DUCKDUCKGO_API_KEY', 'DuckDuckGo API Key', 'ddg-...')
              }
            </CardContent>
          </Card>

          {/* LLM Provider Section */}
          <Card>
            <CardHeader>
              <CardTitle>Language Model Provider</CardTitle>
              <CardDescription>
                Configure your preferred language model service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={config.LLM_PROVIDER}
                  onValueChange={(value: string) => updateConfig('LLM_PROVIDER', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LLM_PROVIDERS.map(provider => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div>
                          <div className="font-medium">{provider.label}</div>
                          <div className="text-sm text-muted-foreground">{provider.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {config.LLM_PROVIDER === 'openai' && (
                <>
                  {renderApiKeyInput('OPENAI_API_KEY', 'OpenAI API Key', 'sk-...')}
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={config.OPENAI_LLM_MODEL}
                      onValueChange={(value: string) => updateConfig('OPENAI_LLM_MODEL', value)}
                      disabled={isLoadingModels || llmModels.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select a model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {llmModels.map((model: ModelInfo) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div>
                              <div className="font-medium">{model.name}</div>
                              {model.description && (
                                <div className="text-xs text-muted-foreground">{model.description}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {llmModels.length === 0 && !isLoadingModels && (
                      <p className="text-sm text-muted-foreground">
                        Enter your API key above to load available models
                      </p>
                    )}
                  </div>
                </>
              )}
              
              {config.LLM_PROVIDER === 'ollama' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="OLLAMA_API_URL">Ollama API URL</Label>
                    <Input
                      id="OLLAMA_API_URL"
                      placeholder="http://localhost:11434"
                      value={config.OLLAMA_API_URL}
                      onChange={(e) => updateConfig('OLLAMA_API_URL', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={config.OLLAMA_LLM_MODEL}
                      onValueChange={(value: string) => updateConfig('OLLAMA_LLM_MODEL', value)}
                      disabled={isLoadingModels}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select a model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {llmModels.map((model: ModelInfo) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div>
                              <div className="font-medium">{model.name}</div>
                              {model.description && (
                                <div className="text-xs text-muted-foreground">{model.description}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {llmModels.length === 0 && !isLoadingModels && (
                      <p className="text-sm text-muted-foreground">
                        Check your Ollama API URL and ensure Ollama is running
                      </p>
                    )}
                  </div>
                </>
              )}
              
              {config.LLM_PROVIDER === 'openrouter' && (
                <>
                  {renderApiKeyInput('OPENROUTER_API_KEY', 'OpenRouter API Key', 'sk-or-...')}
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={config.OPENROUTER_LLM_MODEL}
                      onValueChange={(value: string) => updateConfig('OPENROUTER_LLM_MODEL', value)}
                      disabled={isLoadingModels || llmModels.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select a model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {llmModels.map((model: ModelInfo) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div>
                              <div className="font-medium">{model.name.split('/')[1] || model.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {model.name.split('/')[0]} • {model.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {llmModels.length === 0 && !isLoadingModels && (
                      <p className="text-sm text-muted-foreground">
                        Enter your API key above to load available models
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Embedding Provider Section */}
          <Card>
            <CardHeader>
              <CardTitle>Embedding Model Provider</CardTitle>
              <CardDescription>
                Configure your preferred embedding service for vector search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={config.EMBEDDING_PROVIDER}
                  onValueChange={(value: string) => updateConfig('EMBEDDING_PROVIDER', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMBEDDING_PROVIDERS.map(provider => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div>
                          <div className="font-medium">{provider.label}</div>
                          <div className="text-sm text-muted-foreground">{provider.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {config.EMBEDDING_PROVIDER === 'openai' && (
                <>
                  {renderApiKeyInput('OPENAI_API_KEY', 'OpenAI API Key', 'sk-...')}
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={config.OPENAI_EMBEDDING_MODEL}
                      onValueChange={(value: string) => updateConfig('OPENAI_EMBEDDING_MODEL', value)}
                      disabled={isLoadingModels || embeddingModels.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select a model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {embeddingModels.map((model: ModelInfo) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div>
                              <div className="font-medium">{model.name}</div>
                              {model.description && (
                                <div className="text-xs text-muted-foreground">{model.description}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {embeddingModels.length === 0 && !isLoadingModels && (
                      <p className="text-sm text-muted-foreground">
                        Enter your API key above to load available models
                      </p>
                    )}
                  </div>
                </>
              )}

              {config.EMBEDDING_PROVIDER === 'cohere' && (
                <>
                  {renderApiKeyInput('COHERE_API_KEY', 'Cohere API Key', 'your-api-key')}
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={config.COHERE_EMBEDDING_MODEL}
                      onValueChange={(value: string) => updateConfig('COHERE_EMBEDDING_MODEL', value)}
                      disabled={isLoadingModels || embeddingModels.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select a model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {embeddingModels.map((model: ModelInfo) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div>
                              <div className="font-medium">{model.name}</div>
                              {model.description && (
                                <div className="text-xs text-muted-foreground">{model.description}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {embeddingModels.length === 0 && !isLoadingModels && (
                      <p className="text-sm text-muted-foreground">
                        Enter your API key above to load available models
                      </p>
                    )}
                  </div>
                </>
              )}

              {config.EMBEDDING_PROVIDER === 'ollama' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="OLLAMA_EMBEDDING_URL">Ollama API URL</Label>
                    <Input
                      id="OLLAMA_EMBEDDING_URL"
                      placeholder="http://localhost:11434"
                      value={config.OLLAMA_EMBEDDING_URL}
                      onChange={(e) => updateConfig('OLLAMA_EMBEDDING_URL', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select
                      value={config.OLLAMA_EMBEDDING_MODEL}
                      onValueChange={(value: string) => updateConfig('OLLAMA_EMBEDDING_MODEL', value)}
                      disabled={isLoadingModels}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select a model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {embeddingModels.map((model: ModelInfo) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div>
                              <div className="font-medium">{model.name}</div>
                              {model.description && (
                                <div className="text-xs text-muted-foreground">{model.description}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {embeddingModels.length === 0 && !isLoadingModels && (
                      <p className="text-sm text-muted-foreground">
                        Check your Ollama API URL and ensure Ollama is running with embedding models
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Embedding Dimensions - Show for all providers */}
              <div className="space-y-2">
                <Label htmlFor="EMBEDDING_DIMENSIONS">Embedding Dimensions</Label>
                <Input
                  id="EMBEDDING_DIMENSIONS"
                  type="number"
                  min="1"
                  max="4096"
                  value={config.EMBEDDING_DIMENSIONS}
                  onChange={(e) => updateConfig('EMBEDDING_DIMENSIONS', parseInt(e.target.value) || 1536)}
                />
                <p className="text-xs text-muted-foreground">
                  Vector dimension for embeddings. Common values: OpenAI text-embedding-3-small (1536), text-embedding-3-large (3072), Cohere embed-english-v3.0 (1024), snowflake-arctic-embed (1024 or 768)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Vector Database Provider Section */}
          <Card>
            <CardHeader>
              <CardTitle>Vector Database Provider</CardTitle>
              <CardDescription>
                Configure your vector database for storing and searching embeddings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={config.VECTOR_DB_PROVIDER}
                  onValueChange={(value: string) => updateConfig('VECTOR_DB_PROVIDER', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VECTOR_DB_PROVIDERS.map(provider => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div>
                          <div className="font-medium">{provider.label}</div>
                          <div className="text-sm text-muted-foreground">{provider.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {config.VECTOR_DB_PROVIDER === 'qdrant' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="QDRANT_URL">Qdrant URL</Label>
                    <Input
                      id="QDRANT_URL"
                      placeholder="http://localhost:6333"
                      value={config.QDRANT_URL}
                      onChange={(e) => updateConfig('QDRANT_URL', e.target.value)}
                    />
                  </div>
                  {renderApiKeyInput('QDRANT_API_KEY', 'Qdrant API Key (optional for local)', 'qdr_...')}
                  <div className="space-y-2">
                    <Label htmlFor="QDRANT_COLLECTION_NAME">Collection Name</Label>
                    <Input
                      id="QDRANT_COLLECTION_NAME"
                      placeholder="narada_vectors"
                      value={config.QDRANT_COLLECTION_NAME}
                      onChange={(e) => updateConfig('QDRANT_COLLECTION_NAME', e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Advanced Settings Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  <CardTitle>Advanced Settings</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-advanced"
                    checked={showAdvancedSettings}
                    onCheckedChange={(checked) => setShowAdvancedSettings(checked as boolean)}
                  />
                  <Label htmlFor="show-advanced" className="text-sm cursor-pointer">
                    Show Advanced Settings
                  </Label>
                  {showAdvancedSettings ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              <CardDescription>
                Fine-tune search engine performance and behavior
              </CardDescription>
            </CardHeader>
            {showAdvancedSettings && (
              <CardContent className="space-y-6">
                {/* Search Query Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-foreground border-b pb-2">Search Query Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="MAX_SEARCH_QUERIES">Max Search Queries</Label>
                      <Input
                        id="MAX_SEARCH_QUERIES"
                        type="number"
                        min="1"
                        max="10"
                        value={config.MAX_SEARCH_QUERIES}
                        onChange={(e) => updateConfig('MAX_SEARCH_QUERIES', parseInt(e.target.value) || 4)}
                      />
                      <p className="text-xs text-muted-foreground">Maximum number of search queries to generate (1-10)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="MAX_SOURCES_PER_SEARCH">Max Sources Per Search</Label>
                      <Input
                        id="MAX_SOURCES_PER_SEARCH"
                        type="number"
                        min="1"
                        max="20"
                        value={config.MAX_SOURCES_PER_SEARCH}
                        onChange={(e) => updateConfig('MAX_SOURCES_PER_SEARCH', parseInt(e.target.value) || 6)}
                      />
                      <p className="text-xs text-muted-foreground">Maximum sources to return per search query (1-20)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="MAX_SOURCES_TO_SCRAPE">Max Sources to Scrape</Label>
                      <Input
                        id="MAX_SOURCES_TO_SCRAPE"
                        type="number"
                        min="1"
                        max="20"
                        value={config.MAX_SOURCES_TO_SCRAPE}
                        onChange={(e) => updateConfig('MAX_SOURCES_TO_SCRAPE', parseInt(e.target.value) || 6)}
                      />
                      <p className="text-xs text-muted-foreground">Maximum sources to scrape for additional content (1-20)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="MAX_SOURCES_TO_CHECK">Max Sources to Check</Label>
                      <Input
                        id="MAX_SOURCES_TO_CHECK"
                        type="number"
                        min="1"
                        max="50"
                        value={config.MAX_SOURCES_TO_CHECK}
                        onChange={(e) => updateConfig('MAX_SOURCES_TO_CHECK', parseInt(e.target.value) || 10)}
                      />
                      <p className="text-xs text-muted-foreground">Maximum sources to check for answers (1-50)</p>
                    </div>
                  </div>
                </div>

                {/* Content Processing Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-foreground border-b pb-2">Content Processing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="MIN_CONTENT_LENGTH">Min Content Length</Label>
                      <Input
                        id="MIN_CONTENT_LENGTH"
                        type="number"
                        min="50"
                        max="1000"
                        value={config.MIN_CONTENT_LENGTH}
                        onChange={(e) => updateConfig('MIN_CONTENT_LENGTH', parseInt(e.target.value) || 100)}
                      />
                      <p className="text-xs text-muted-foreground">Minimum content length to consider valid (50-1000 chars)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="SUMMARY_CHAR_LIMIT">Summary Character Limit</Label>
                      <Input
                        id="SUMMARY_CHAR_LIMIT"
                        type="number"
                        min="50"
                        max="500"
                        value={config.SUMMARY_CHAR_LIMIT}
                        onChange={(e) => updateConfig('SUMMARY_CHAR_LIMIT', parseInt(e.target.value) || 100)}
                      />
                      <p className="text-xs text-muted-foreground">Character limit for source summaries (50-500 chars)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="CONTEXT_PREVIEW_LENGTH">Context Preview Length</Label>
                      <Input
                        id="CONTEXT_PREVIEW_LENGTH"
                        type="number"
                        min="100"
                        max="2000"
                        value={config.CONTEXT_PREVIEW_LENGTH}
                        onChange={(e) => updateConfig('CONTEXT_PREVIEW_LENGTH', parseInt(e.target.value) || 500)}
                      />
                      <p className="text-xs text-muted-foreground">Preview length for previous context (100-2000 chars)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ANSWER_CHECK_PREVIEW">Answer Check Preview</Label>
                      <Input
                        id="ANSWER_CHECK_PREVIEW"
                        type="number"
                        min="500"
                        max="5000"
                        value={config.ANSWER_CHECK_PREVIEW}
                        onChange={(e) => updateConfig('ANSWER_CHECK_PREVIEW', parseInt(e.target.value) || 2500)}
                      />
                      <p className="text-xs text-muted-foreground">Content preview length for answer checking (500-5000 chars)</p>
                    </div>
                  </div>
                </div>

                {/* Retry and Confidence Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-foreground border-b pb-2">Retry Logic & Confidence</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="MAX_RETRIES">Max Retries</Label>
                      <Input
                        id="MAX_RETRIES"
                        type="number"
                        min="0"
                        max="10"
                        value={config.MAX_RETRIES}
                        onChange={(e) => updateConfig('MAX_RETRIES', parseInt(e.target.value) || 2)}
                      />
                      <p className="text-xs text-muted-foreground">Maximum retry attempts for failed operations (0-10)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="MAX_SEARCH_ATTEMPTS">Max Search Attempts</Label>
                      <Input
                        id="MAX_SEARCH_ATTEMPTS"
                        type="number"
                        min="1"
                        max="10"
                        value={config.MAX_SEARCH_ATTEMPTS}
                        onChange={(e) => updateConfig('MAX_SEARCH_ATTEMPTS', parseInt(e.target.value) || 3)}
                      />
                      <p className="text-xs text-muted-foreground">Maximum attempts to find answers via search (1-10)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="MIN_ANSWER_CONFIDENCE">Min Answer Confidence</Label>
                      <Input
                        id="MIN_ANSWER_CONFIDENCE"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.MIN_ANSWER_CONFIDENCE}
                        onChange={(e) => updateConfig('MIN_ANSWER_CONFIDENCE', parseFloat(e.target.value) || 0.3)}
                      />
                      <p className="text-xs text-muted-foreground">Minimum confidence (0-1) that a question was answered</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="EARLY_TERMINATION_CONFIDENCE">Early Termination Confidence</Label>
                      <Input
                        id="EARLY_TERMINATION_CONFIDENCE"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.EARLY_TERMINATION_CONFIDENCE}
                        onChange={(e) => updateConfig('EARLY_TERMINATION_CONFIDENCE', parseFloat(e.target.value) || 0.8)}
                      />
                      <p className="text-xs text-muted-foreground">Confidence level to skip additional searches (0-1)</p>
                    </div>
                  </div>
                </div>

                {/* Performance Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-foreground border-b pb-2">Performance & Timing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="SCRAPE_TIMEOUT">Scrape Timeout (ms)</Label>
                      <Input
                        id="SCRAPE_TIMEOUT"
                        type="number"
                        min="5000"
                        max="60000"
                        step="1000"
                        value={config.SCRAPE_TIMEOUT}
                        onChange={(e) => updateConfig('SCRAPE_TIMEOUT', parseInt(e.target.value) || 15000)}
                      />
                      <p className="text-xs text-muted-foreground">Timeout for scraping operations (5000-60000 ms)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="SOURCE_ANIMATION_DELAY">Source Animation Delay (ms)</Label>
                      <Input
                        id="SOURCE_ANIMATION_DELAY"
                        type="number"
                        min="0"
                        max="500"
                        step="10"
                        value={config.SOURCE_ANIMATION_DELAY}
                        onChange={(e) => updateConfig('SOURCE_ANIMATION_DELAY', parseInt(e.target.value) || 50)}
                      />
                      <p className="text-xs text-muted-foreground">Delay between source animations (0-500 ms)</p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="PARALLEL_SUMMARY_GENERATION"
                          checked={config.PARALLEL_SUMMARY_GENERATION}
                          onCheckedChange={(checked) => updateConfig('PARALLEL_SUMMARY_GENERATION', checked as boolean)}
                        />
                        <Label htmlFor="PARALLEL_SUMMARY_GENERATION" className="cursor-pointer">
                          Enable Parallel Summary Generation
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">Generate summaries in parallel for better performance</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Test Results Dialog */}
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configuration Test Results</DialogTitle>
              <DialogDescription>
                Testing your API configurations...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {Object.entries(testResults).map(([key, success]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{key}</span>
                  <div className={`h-2 w-2 rounded-full ${success ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              ))}
              {Object.keys(testResults).length === 0 && (
                <div className="text-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Testing configurations...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
