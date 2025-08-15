import { NextResponse } from 'next/server';

export async function GET() {
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
    SEARCH_API_PROVIDER: process.env.SEARCH_API_PROVIDER || 'firecrawl',
    LLM_PROVIDER: process.env.LLM_PROVIDER || 'openai',
    EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || 'openai',
    
    // URLs
    OLLAMA_API_URL: process.env.OLLAMA_API_URL || 'http://localhost:11434',
    OLLAMA_EMBEDDING_URL: process.env.OLLAMA_EMBEDDING_URL || 'http://localhost:11434',
  };

  return NextResponse.json({ environmentStatus });
} 