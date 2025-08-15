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
  OLLAMA_API_URL: string;
  OPENROUTER_API_KEY: string;
  
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

const OPENAI_EMBEDDING_MODELS = [
  'text-embedding-3-small',
  'text-embedding-3-large',
  'text-embedding-ada-002'
];

const OLLAMA_EMBEDDING_MODELS = [
  'nomic-embed-text',
  'mxbai-embed-large',
  'all-minilm',
  'snowflake-arctic-embed'
];

export default function SettingsPage() {
  const [config, setConfig] = useState<EnvironmentConfig>({
    SEARCH_API_PROVIDER: 'firecrawl',
    FIRECRAWL_API_KEY: '',
    TAVILY_API_KEY: '',
    SERP_API_KEY: '',
    LLM_PROVIDER: 'openai',
    OPENAI_API_KEY: '',
    OLLAMA_API_URL: 'http://localhost:11434',
    OPENROUTER_API_KEY: '',
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

  // Load current configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

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

              {config.LLM_PROVIDER === 'openai' && 
                renderApiKeyInput('OPENAI_API_KEY', 'OpenAI API Key', 'sk-...')
              }
              
              {config.LLM_PROVIDER === 'ollama' && (
                <div className="space-y-2">
                  <Label htmlFor="OLLAMA_API_URL">Ollama API URL</Label>
                  <Input
                    id="OLLAMA_API_URL"
                    placeholder="http://localhost:11434"
                    value={config.OLLAMA_API_URL}
                    onChange={(e) => updateConfig('OLLAMA_API_URL', e.target.value)}
                  />
                </div>
              )}
              
              {config.LLM_PROVIDER === 'openrouter' && 
                renderApiKeyInput('OPENROUTER_API_KEY', 'OpenRouter API Key', 'sk-or-...')
              }
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
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPENAI_EMBEDDING_MODELS.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OLLAMA_EMBEDDING_MODELS.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
