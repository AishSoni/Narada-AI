import { NextResponse } from 'next/server';
import { getAppConfig } from '@/lib/app-config';

export async function GET() {
  const appConfig = getAppConfig();
  
  const environmentStatus = {
    // Search API Keys
    FIRECRAWL_API_KEY: !!process.env.FIRECRAWL_API_KEY,
    TAVILY_API_KEY: !!process.env.TAVILY_API_KEY,
    SERP_API_KEY: !!process.env.SERP_API_KEY,
    
    // LLM API Keys
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    
    // Configuration
    SEARCH_API_PROVIDER: appConfig.searchProvider,
    LLM_PROVIDER: appConfig.llmProvider,
    EMBEDDING_PROVIDER: appConfig.embeddingProvider,
    
    // URLs
    OLLAMA_API_URL: process.env.OLLAMA_API_URL || 'http://localhost:11434',
    OLLAMA_EMBEDDING_URL: process.env.OLLAMA_EMBEDDING_URL || 'http://localhost:11434',
    
    // Current search provider has valid API key
    HAS_SEARCH_API_KEY: !!appConfig.searchApiKey,
    
    // Provider-specific key status for detailed feedback
    SEARCH_PROVIDER_DETAILS: {
      provider: appConfig.searchProvider,
      hasKey: !!appConfig.searchApiKey,
      keyRequired: true // All search providers currently require keys
    }
  };

  return NextResponse.json({ environmentStatus });
} 