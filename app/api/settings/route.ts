import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const ENV_FILE_PATH = join(process.cwd(), '.env.local');

// Environment variable mappings
const ENV_MAPPINGS = {
  // Search API Provider
  SEARCH_API_PROVIDER: 'SEARCH_API_PROVIDER',
  FIRECRAWL_API_KEY: 'FIRECRAWL_API_KEY',
  TAVILY_API_KEY: 'TAVILY_API_KEY',
  SERP_API_KEY: 'SERP_API_KEY',
  
  // LLM Provider
  LLM_PROVIDER: 'LLM_PROVIDER',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  OLLAMA_API_URL: 'OLLAMA_API_URL',
  OPENROUTER_API_KEY: 'OPENROUTER_API_KEY',
  
  // Embedding Provider
  EMBEDDING_PROVIDER: 'EMBEDDING_PROVIDER',
  OPENAI_EMBEDDING_MODEL: 'OPENAI_EMBEDDING_MODEL',
  OLLAMA_EMBEDDING_MODEL: 'OLLAMA_EMBEDDING_MODEL',
  OLLAMA_EMBEDDING_URL: 'OLLAMA_EMBEDDING_URL',
};

async function readEnvFile(): Promise<Record<string, string>> {
  try {
    const content = await readFile(ENV_FILE_PATH, 'utf-8');
    const env: Record<string, string> = {};
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return env;
  } catch (error) {
    // If file doesn't exist, return empty object
    return {};
  }
}

async function writeEnvFile(env: Record<string, string>): Promise<void> {
  const lines = Object.entries(env)
    .filter(([_, value]) => value !== '') // Only write non-empty values
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');
  
  await writeFile(ENV_FILE_PATH, lines + '\n', 'utf-8');
}

export async function GET() {
  try {
    const envData = await readEnvFile();
    
    // Return current configuration, masking sensitive values
    const config: Record<string, string> = {};
    
    Object.entries(ENV_MAPPINGS).forEach(([configKey, envKey]) => {
      const value = envData[envKey] || '';
      
      // Mask API keys for security
      if (configKey.includes('API_KEY') && value) {
        config[configKey] = value.slice(0, 6) + '•••••••••••••••';
      } else {
        config[configKey] = value;
      }
    });
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to read settings:', error);
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    const envData = await readEnvFile();
    
    // Update environment variables
    Object.entries(ENV_MAPPINGS).forEach(([configKey, envKey]) => {
      const value = config[configKey];
      if (value !== undefined) {
        // Don't update masked values (they contain •••)
        if (typeof value === 'string' && !value.includes('•••')) {
          if (value.trim()) {
            envData[envKey] = value.trim();
          } else {
            delete envData[envKey]; // Remove empty values
          }
        }
      }
    });
    
    await writeEnvFile(envData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
