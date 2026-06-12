import { NextRequest, NextResponse } from 'next/server';
import { readEnvFile } from '@/lib/env-file';
import { requireLocal } from '@/lib/local-only';

const ENV_MAPPINGS = {
  FIRECRAWL_API_KEY: 'FIRECRAWL_API_KEY',
  TAVILY_API_KEY: 'TAVILY_API_KEY',
  SERP_API_KEY: 'SERP_API_KEY',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  OPENROUTER_API_KEY: 'OPENROUTER_API_KEY',
  QDRANT_API_KEY: 'QDRANT_API_KEY',
} as const;

export async function POST(request: NextRequest) {
  const blocked = requireLocal();
  if (blocked) return blocked;

  try {
    const { key } = await request.json();

    if (!key || !key.includes('API_KEY')) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

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
