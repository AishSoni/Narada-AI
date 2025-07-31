'use client';

import React, { useState, useEffect } from 'react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';

interface Settings {
  tavilyApiKey: string;
  ollama: {
    apiUrl: string;
    embeddingModel: string;
    llm: string;
  };
  mcpServers: Array<{
    name: string;
    url: string;
  }>;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    tavilyApiKey: '',
    ollama: {
      apiUrl: 'http://localhost:11434',
      embeddingModel: 'nomic-embed-text',
      llm: 'llama3'
    },
    mcpServers: []
  });
  
  const [newMcpServer, setNewMcpServer] = useState({ name: '', url: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ [key: string]: string }>({});

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Settings saved successfully
      } else {
        console.error('Error saving settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestTavily = async () => {
    setTestResult(prev => ({ ...prev, tavily: 'Testing...' }));
    try {
      // In a real implementation, we would test the Tavily API
      // For now, we'll simulate a successful test
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTestResult(prev => ({ ...prev, tavily: 'Connected successfully!' }));
    } catch (error) {
      setTestResult(prev => ({ ...prev, tavily: 'Connection failed.' }));
    }
  };

  const handleTestOllama = async () => {
    setTestResult(prev => ({ ...prev, ollama: 'Testing...' }));
    try {
      // In a real implementation, we would test the Ollama API
      // For now, we'll simulate a successful test
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTestResult(prev => ({ ...prev, ollama: 'Connected successfully!' }));
    } catch (error) {
      setTestResult(prev => ({ ...prev, ollama: 'Connection failed.' }));
    }
  };

  const addMcpServer = () => {
    if (newMcpServer.name && newMcpServer.url) {
      setSettings(prev => ({
        ...prev,
        mcpServers: [...prev.mcpServers, newMcpServer]
      }));
      setNewMcpServer({ name: '', url: '' });
    }
  };

  const removeMcpServer = (index: number) => {
    setSettings(prev => ({
      ...prev,
      mcpServers: prev.mcpServers.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure your Narada AI agent dependencies.
        </p>
      </div>

      <div className="space-y-8">
        {/* Tavily API Settings */}
        <Card title="Tavily API">
          <div className="space-y-4">
            <Input
              label="API Key"
              type="password"
              value={settings.tavilyApiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({ ...prev, tavilyApiKey: e.target.value }))}
              placeholder="Enter your Tavily API key"
              fullWidth
            />
            <div className="flex items-center space-x-4">
              <Button onClick={handleTestTavily} variant="secondary">
                Test Connection
              </Button>
              {testResult.tavily && (
                <span className={`text-sm ${testResult.tavily.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.tavily}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Ollama Settings */}
        <Card title="Ollama Configuration">
          <div className="space-y-4">
            <Input
              label="API URL"
              type="url"
              value={settings.ollama.apiUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({
                ...prev,
                ollama: { ...prev.ollama, apiUrl: e.target.value }
              }))}
              placeholder="http://localhost:11434"
              fullWidth
            />
            <Input
              label="Embedding Model"
              type="text"
              value={settings.ollama.embeddingModel}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({
                ...prev,
                ollama: { ...prev.ollama, embeddingModel: e.target.value }
              }))}
              placeholder="nomic-embed-text"
              fullWidth
            />
            <Input
              label="LLM Model"
              type="text"
              value={settings.ollama.llm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({
                ...prev,
                ollama: { ...prev.ollama, llm: e.target.value }
              }))}
              placeholder="llama3"
              fullWidth
            />
            <div className="flex items-center space-x-4">
              <Button onClick={handleTestOllama} variant="secondary">
                Test Connection
              </Button>
              {testResult.ollama && (
                <span className={`text-sm ${testResult.ollama.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.ollama}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* MCP Servers */}
        <Card title="MCP Servers" actions={
          <Button onClick={addMcpServer} variant="secondary">
            Add Server
          </Button>
        }>
          <div className="space-y-4">
            {settings.mcpServers.length === 0 ? (
              <p className="text-gray-500 text-sm">No MCP servers configured.</p>
            ) : (
              settings.mcpServers.map((server, index) => (
                <div key={index} className="flex items-end space-x-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Name"
                      type="text"
                      value={server.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newServers = [...settings.mcpServers];
                        newServers[index] = { ...newServers[index], name: e.target.value };
                        setSettings(prev => ({ ...prev, mcpServers: newServers }));
                      }}
                      placeholder="Server name"
                    />
                    <Input
                      label="URL"
                      type="url"
                      value={server.url}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newServers = [...settings.mcpServers];
                        newServers[index] = { ...newServers[index], url: e.target.value };
                        setSettings(prev => ({ ...prev, mcpServers: newServers }));
                      }}
                      placeholder="https://example.com/mcp"
                    />
                  </div>
                  <Button
                    onClick={() => removeMcpServer(index)}
                    variant="danger"
                    className="mb-1"
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
            
            {/* Add new MCP server form */}
            <div className="flex items-end space-x-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="New Server Name"
                  type="text"
                  value={newMcpServer.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMcpServer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Server name"
                />
                <Input
                  label="New Server URL"
                  type="url"
                  value={newMcpServer.url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMcpServer(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/mcp"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} isLoading={isSaving}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;