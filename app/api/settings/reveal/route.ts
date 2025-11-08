import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const ENV_FILE_PATH = join(process.cwd(), '.env.local');

// Environment variable mappings
const ENV_MAPPINGS = {
  FIRECRAWL_API_KEY: 'FIRECRAWL_API_KEY',
  TAVILY_API_KEY: 'TAVILY_API_KEY',
  SERP_API_KEY: 'SERP_API_KEY',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  OPENROUTER_API_KEY: 'OPENROUTER_API_KEY',
  QDRANT_API_KEY: 'QDRANT_API_KEY',
} as const;

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

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();
    
    if (!key || !key.includes('API_KEY')) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }
    
    // Only allow revealing API keys that are in our mapping
    if (!(key in ENV_MAPPINGS)) {
      return NextResponse.json({ error: 'Key not allowed' }, { status: 403 });
    }
    
    const envData = await readEnvFile();
    const envKey = ENV_MAPPINGS[key as keyof typeof ENV_MAPPINGS];
    const value = envData[envKey] || '';
    
    return NextResponse.json({ value });
  } catch (error) {
    console.error('Error revealing key:', error);
    return NextResponse.json({ error: 'Failed to reveal key' }, { status: 500 });
  }
}
