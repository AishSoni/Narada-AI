# Cohere Embeddings Integration

This document describes how to use Cohere as an embedding provider in Narada AI.

## Overview

Cohere provides high-quality multilingual embeddings through their API. This integration allows you to use Cohere embeddings alongside OpenAI and Ollama for text vectorization in search and retrieval tasks.

## Configuration

### Environment Variables

Add the following to your `.env.local`:

```bash
# Set Cohere as your embedding provider
EMBEDDING_PROVIDER=cohere

# Your Cohere API key
COHERE_API_KEY=your-cohere-api-key-here

# Optional: Specify the embedding model (defaults to embed-english-v3.0)
COHERE_EMBEDDING_MODEL=embed-english-v3.0
```

### Available Models

| Model | Dimensions | Description |
|-------|------------|-------------|
| `embed-english-v3.0` | 1024 | Best performance for English text |
| `embed-english-light-v3.0` | 384 | Fast and efficient for English text |
| `embed-multilingual-v3.0` | 1024 | Supports 100+ languages |
| `embed-english-v2.0` | 4096 | Previous generation English model |

## Usage

### Programmatic Usage

```typescript
import { UnifiedEmbeddingClient } from '@/lib/unified-embedding-client';

// Initialize with Cohere
const embeddingClient = new UnifiedEmbeddingClient({
  provider: 'cohere',
  apiKey: 'your-cohere-api-key',
  model: 'embed-english-v3.0'
});

// Generate embedding for single text
const embedding = await embeddingClient.embedText('Hello world');
console.log('Embedding dimensions:', embedding.length); // 1024

// Generate embeddings for multiple texts
const embeddings = await embeddingClient.embedTexts([
  'First document',
  'Second document'
]);

// Get embedding dimensions for the current model
const dimensions = embeddingClient.getEmbeddingDimensions(); // 1024
```

### Testing via API

You can test Cohere embeddings using the test endpoint:

```bash
curl -X POST http://localhost:3000/api/test-embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "provider": "cohere",
    "apiKey": "your-cohere-api-key",
    "model": "embed-english-v3.0"
  }'
```

Response:
```json
{
  "text": "Hello world",
  "provider": "cohere",
  "model": "embed-english-v3.0",
  "embedding": [0.1, -0.2, 0.3, ...],
  "dimensions": 1024,
  "embeddingLength": 1024
}
```

## Settings Page Configuration

1. Open the Settings page in the Narada AI interface
2. In the "Embedding Provider" section, select "Cohere"
3. Enter your Cohere API key
4. Select your preferred model from the dropdown
5. Click "Test Configuration" to verify the connection
6. Save your settings

## Benefits of Cohere Embeddings

- **Multilingual Support**: Excellent performance across 100+ languages
- **High Quality**: State-of-the-art embeddings for semantic search
- **Flexible Dimensions**: Choose between 384, 1024, or 4096 dimensions based on your needs
- **Cost Effective**: Competitive pricing for embedding generation

## Troubleshooting

### Authentication Issues

If you see authentication errors:
1. Verify your API key is correct
2. Check that you have sufficient credits in your Cohere account
3. Ensure your API key has embedding permissions

### Model Selection

- Use `embed-english-v3.0` for best English performance
- Use `embed-multilingual-v3.0` for non-English content
- Use `embed-english-light-v3.0` for faster processing with slightly lower quality

### Error Messages

- "Invalid API key format": Check your Cohere API key
- "Authentication failed": Verify your API key is active and has permissions
- "Unsupported provider": Ensure you're using `provider: 'cohere'`
