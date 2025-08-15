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
import { ArrowLeft, Save, Eye, EyeOff, Key, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";

interface EnvironmentConfig {
  // Search API Provider
  SEARCH_API_PROVIDER: string;
  FIRECRAWL_API_KEY: string;
  TAVILY_API_KEY: string;
  SERP_API_KEY: string;
  
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
  OLLAMA_EMBEDDING_MODEL: string;
  OLLAMA_EMBEDDING_URL: string;
}

const SEARCH_PROVIDERS = [
  { value: 'firecrawl', label: 'FireCrawl', description: 'Web scraping and crawling API' },
  { value: 'tavily', label: 'Tavily', description: 'AI search API for research' },
  { value: 'serp', label: 'SERP API', description: 'Google search results API' }
];

const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', description: 'GPT models (gpt-4o, gpt-4o-mini)' },
  { value: 'ollama', label: 'Ollama', description: 'Local LLM hosting' },
  { value: 'openrouter', label: 'OpenRouter', description: 'Multiple model providers' }
];

const EMBEDDING_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', description: 'text-embedding-3-small/large' },
  { value: 'ollama', label: 'Ollama', description: 'Local embedding models' }
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
    LLM_PROVIDER: 'openai',
    OPENAI_API_KEY: '',
    OPENAI_LLM_MODEL: 'gpt-4o-mini',
    OLLAMA_API_URL: 'http://localhost:11434',
    OLLAMA_LLM_MODEL: 'llama3.2',
    OPENROUTER_API_KEY: '',
    OPENROUTER_LLM_MODEL: 'openai/gpt-4o-mini',
    EMBEDDING_PROVIDER: 'openai',
    OPENAI_EMBEDDING_MODEL: 'text-embedding-3-small',
    OLLAMA_EMBEDDING_MODEL: 'nomic-embed-text',
    OLLAMA_EMBEDDING_URL: 'http://localhost:11434'
  });

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  
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
  }, [config.EMBEDDING_PROVIDER, config.OPENAI_API_KEY, config.OLLAMA_EMBEDDING_URL]);

  const fetchLLMModels = async () => {
    // Don't fetch if no provider is selected or if required credentials are missing
    if (!config.LLM_PROVIDER) return;
    
    // For OpenAI and OpenRouter, don't fetch without API key
    if ((config.LLM_PROVIDER === 'openai' || config.LLM_PROVIDER === 'openrouter') && 
        (!config.OPENAI_API_KEY || config.OPENAI_API_KEY.includes('•••') || 
         !config.OPENROUTER_API_KEY || config.OPENROUTER_API_KEY.includes('•••'))) {
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

    // For Ollama, don't fetch with invalid URLs
    if (config.EMBEDDING_PROVIDER === 'ollama' && config.OLLAMA_EMBEDDING_URL) {
      try {
        new URL(config.OLLAMA_EMBEDDING_URL); // Validate URL format
      } catch {
        setEmbeddingModels([]);
        return;
      }
    }

    try {
      const params = new URLSearchParams({
        provider: config.EMBEDDING_PROVIDER,
      });

      if (config.EMBEDDING_PROVIDER === 'openai' && config.OPENAI_API_KEY && !config.OPENAI_API_KEY.includes('•••')) {
        params.append('apiKey', config.OPENAI_API_KEY);
      } else if (config.EMBEDDING_PROVIDER === 'ollama' && config.OLLAMA_EMBEDDING_URL) {
        params.append('apiUrl', config.OLLAMA_EMBEDDING_URL);
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
    }
  };

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, ...data }));
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

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateConfig = (key: keyof EnvironmentConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const renderApiKeyInput = (
    key: keyof EnvironmentConfig,
    label: string,
    placeholder: string
  ) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={key}
            type={showKeys[key] ? "text" : "password"}
            placeholder={placeholder}
            value={config[key]}
            onChange={(e) => updateConfig(key, e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => toggleShowKey(key)}
          >
            {showKeys[key] ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

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
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Configure your API providers and models</p>
            </div>
          </div>
          <div className="flex gap-2">
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
                      disabled={embeddingModels.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
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
                    {embeddingModels.length === 0 && (
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
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
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
                    {embeddingModels.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Check your Ollama API URL and ensure Ollama is running with embedding models
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
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
