// Search Engine Configuration
export const SEARCH_CONFIG = {
  // Search Settings
  MAX_SEARCH_QUERIES: 4,        // Maximum number of search queries to generate
  MAX_SOURCES_PER_SEARCH: 6,     // Maximum sources to return per search query
  MAX_SOURCES_TO_SCRAPE: 6,      // Maximum sources to scrape for additional content
  
  // Content Processing
  MIN_CONTENT_LENGTH: 100,       // Minimum content length to consider valid
  SUMMARY_CHAR_LIMIT: 100,       // Character limit for source summaries
  CONTEXT_PREVIEW_LENGTH: 500,   // Preview length for previous context
  ANSWER_CHECK_PREVIEW: 2500,    // Content preview length for answer checking
  MAX_SOURCES_TO_CHECK: 10,      // Maximum sources to check for answers
  
  // Retry Logic
  MAX_RETRIES: 2,                // Maximum retry attempts for failed operations
  MAX_SEARCH_ATTEMPTS: 3,        // Maximum attempts to find answers via search
  MIN_ANSWER_CONFIDENCE: 0.3,    // Minimum confidence (0-1) that a question was answered
  EARLY_TERMINATION_CONFIDENCE: 0.8, // Confidence level to skip additional searches
  
  // Timeouts
  SCRAPE_TIMEOUT: 15000,         // Timeout for scraping operations (ms)
  
  // Performance
  SOURCE_ANIMATION_DELAY: 50,    // Delay between source animations (ms) - reduced from 150
  PARALLEL_SUMMARY_GENERATION: true, // Generate summaries in parallel
} as const;

// You can also export individual configs for different components
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,       // Default animation duration (ms)
  SOURCE_FADE_DELAY: 50,         // Delay between source animations (ms)
  MESSAGE_CYCLE_DELAY: 2000,     // Delay for cycling through messages (ms)
} as const;

// Theme Configuration
export const THEME_CONFIG = {
  AUTO_DARK_START_HOUR: 18,      // Hour to switch to dark mode (6 PM)
  AUTO_DARK_END_HOUR: 6,         // Hour to switch to light mode (6 AM)
  THEME_CHECK_INTERVAL: 60000,   // Check theme every minute (ms)
  DEFAULT_THEME: 'auto',         // Default theme preference
  STORAGE_KEY: 'narada-theme',   // LocalStorage key for theme preference
} as const;

// Model Configuration
export const MODEL_CONFIG = {
  FAST_MODEL: "gpt-4o-mini",     // Fast model for quick operations
  QUALITY_MODEL: "gpt-4o",       // High-quality model for final synthesis
  TEMPERATURE: 0,                // Model temperature (0 = deterministic)
} as const;

// API Provider Configuration
export const API_PROVIDERS = {
  SEARCH: {
    FIRECRAWL: 'firecrawl',
    TAVILY: 'tavily',
    SERP: 'serp',
    DUCKDUCKGO: 'duckduckgo'
  },
  LLM: {
    OPENAI: 'openai',
    OLLAMA: 'ollama',
    OPENROUTER: 'openrouter'
  },
  EMBEDDING: {
    OPENAI: 'openai',
    OLLAMA: 'ollama',
    COHERE: 'cohere'
  },
  VECTOR_DB: {
    QDRANT: 'qdrant'
  }
} as const;

// Default Models
export const DEFAULT_MODELS = {
  OPENAI_EMBEDDING: 'text-embedding-3-small',
  OLLAMA_EMBEDDING: 'nomic-embed-text',
  COHERE_EMBEDDING: 'embed-english-v3.0',
  OPENAI_LLM: 'gpt-4o-mini',
  OLLAMA_LLM: 'llama3.2',
  OPENROUTER_LLM: 'openai/gpt-4o-mini',
} as const;

// Vector Database Configuration
export const VECTOR_DB_CONFIG = {
  QDRANT: {
    DEFAULT_COLLECTION_NAME: 'narada_vectors',
    DEFAULT_VECTOR_SIZE: 1536,        // Default for OpenAI text-embedding-3-small
    DEFAULT_DISTANCE_METRIC: 'cosine',
    DEFAULT_HOST: 'localhost',
    DEFAULT_PORT: 6333,
    DEFAULT_HTTPS: false,
    BATCH_SIZE: 100,                  // Number of vectors to upsert in one batch
    SEARCH_LIMIT: 10,                 // Default number of similar vectors to retrieve
    SEARCH_SCORE_THRESHOLD: 0.7,      // Minimum similarity score for search results
  }
} as const;

// Environment Variable Keys
export const ENV_KEYS = {
  // Search API
  SEARCH_API_PROVIDER: 'SEARCH_API_PROVIDER',
  FIRECRAWL_API_KEY: 'FIRECRAWL_API_KEY',
  TAVILY_API_KEY: 'TAVILY_API_KEY',
  SERP_API_KEY: 'SERP_API_KEY',
  
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
  OLLAMA_EMBEDDING_MODEL: 'OLLAMA_EMBEDDING_MODEL',
  OLLAMA_EMBEDDING_URL: 'OLLAMA_EMBEDDING_URL',
  COHERE_API_KEY: 'COHERE_API_KEY',
  COHERE_EMBEDDING_MODEL: 'COHERE_EMBEDDING_MODEL',
  EMBEDDING_DIMENSIONS: 'EMBEDDING_DIMENSIONS',
  
  // Vector Database Provider
  VECTOR_DB_PROVIDER: 'VECTOR_DB_PROVIDER',
  QDRANT_API_KEY: 'QDRANT_API_KEY',
  QDRANT_URL: 'QDRANT_URL',
  QDRANT_COLLECTION_NAME: 'QDRANT_COLLECTION_NAME',
} as const;