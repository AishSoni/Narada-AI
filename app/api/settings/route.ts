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
  DUCKDUCKGO_API_KEY: 'DUCKDUCKGO_API_KEY',
  
  // LLM Provider
  LLM_PROVIDER: 'LLM_PROVIDER',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  OPENAI_LLM_MODEL: 'OPENAI_LLM_MODEL',
  OLLAMA_API_URL: 'OLLAMA_API_URL',
  OLLAMA_LLM_MODEL: 'OLLAMA_LLM_MODEL',
  OPENROUTER_API_KEY: 'OPENROUTER_API_KEY',
  OPENROUTER_LLM_MODEL: 'OPENROUTER_LLM_MODEL',
  
  // Embedding Provider
  EMBEDDING_PROVIDER: 'EMBEDDING_PROVIDER',
  OPENAI_EMBEDDING_MODEL: 'OPENAI_EMBEDDING_MODEL',
  COHERE_API_KEY: 'COHERE_API_KEY',
  COHERE_EMBEDDING_MODEL: 'COHERE_EMBEDDING_MODEL',
  OLLAMA_EMBEDDING_MODEL: 'OLLAMA_EMBEDDING_MODEL',
  OLLAMA_EMBEDDING_URL: 'OLLAMA_EMBEDDING_URL',
  EMBEDDING_DIMENSIONS: 'EMBEDDING_DIMENSIONS',
  
  // Vector Database Provider
  VECTOR_DB_PROVIDER: 'VECTOR_DB_PROVIDER',
  QDRANT_API_KEY: 'QDRANT_API_KEY',
  QDRANT_URL: 'QDRANT_URL',
  QDRANT_COLLECTION_NAME: 'QDRANT_COLLECTION_NAME',
  
  // Advanced Search Settings
  MAX_SEARCH_QUERIES: 'MAX_SEARCH_QUERIES',
  MAX_SOURCES_PER_SEARCH: 'MAX_SOURCES_PER_SEARCH',
  MAX_SOURCES_TO_SCRAPE: 'MAX_SOURCES_TO_SCRAPE',
  MIN_CONTENT_LENGTH: 'MIN_CONTENT_LENGTH',
  SUMMARY_CHAR_LIMIT: 'SUMMARY_CHAR_LIMIT',
  CONTEXT_PREVIEW_LENGTH: 'CONTEXT_PREVIEW_LENGTH',
  ANSWER_CHECK_PREVIEW: 'ANSWER_CHECK_PREVIEW',
  MAX_SOURCES_TO_CHECK: 'MAX_SOURCES_TO_CHECK',
  MAX_RETRIES: 'MAX_RETRIES',
  MAX_SEARCH_ATTEMPTS: 'MAX_SEARCH_ATTEMPTS',
  MIN_ANSWER_CONFIDENCE: 'MIN_ANSWER_CONFIDENCE',
  EARLY_TERMINATION_CONFIDENCE: 'EARLY_TERMINATION_CONFIDENCE',
  SCRAPE_TIMEOUT: 'SCRAPE_TIMEOUT',
  SOURCE_ANIMATION_DELAY: 'SOURCE_ANIMATION_DELAY',
  PARALLEL_SUMMARY_GENERATION: 'PARALLEL_SUMMARY_GENERATION',
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
  } catch {
    // If file doesn't exist, return empty object
    return {};
  }
}

async function writeEnvFile(env: Record<string, string>): Promise<void> {
  const lines = Object.entries(env)
    .filter(([, value]) => value !== '') // Only write non-empty values
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
