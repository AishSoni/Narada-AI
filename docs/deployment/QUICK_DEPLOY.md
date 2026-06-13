# Quick Start: Hosted Demo on Vercel (BYOK)

This guide deploys Narada AI as a **constrained BYOK demo** on Vercel. Visitors supply their own API keys per session; the server never persists secrets.

## Important Notes

- Set `RUNTIME_PROFILE=hosted` — this disables local-only routes (settings, debug, check-env).
- **Qdrant**: Use [Qdrant Cloud](https://cloud.qdrant.io). Localhost will not work on Vercel.
- **Ollama / OCR**: Not available on Vercel. Use OpenAI/OpenRouter for LLM and OpenAI/Cohere for embeddings.
- **Upstash Redis**: Recommended for rate limiting in hosted mode.
- **Vector IDs**: If upgrading from an older deployment, recreate the Qdrant collection and re-upload documents.

## Server Environment Variables

```bash
RUNTIME_PROFILE=hosted

# Vector Database (required)
QDRANT_URL=https://xyz.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION_NAME=narada_vectors
VECTOR_DB_PROVIDER=qdrant

# Rate limiting (recommended)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Provider defaults (overridden per-request by BYOK credentials)
LLM_PROVIDER=openai
EMBEDDING_PROVIDER=openai
SEARCH_API_PROVIDER=tavily
```

Do **not** set visitor API keys (`OPENAI_API_KEY`, etc.) in Vercel env — visitors provide them per session.

## BYOK Client Contract

Search requests must include credentials:

```json
POST /api/search-with-knowledge
Headers: x-narada-session: <uuid>
Body: {
  "query": "What is X?",
  "knowledgeStackId": "...",
  "credentials": {
    "searchApiKey": "tvly-...",
    "llmApiKey": "sk-...",
    "embeddingApiKey": "sk-..."
  }
}
```

Knowledge stack routes use the same `x-narada-session` header for ephemeral per-visitor storage.

## Deployment Steps

1. Go to https://vercel.com/new and import this repository.
2. Add the server environment variables above.
3. Deploy.
4. Test with BYOK credentials in the request body.

## Local Self-Host (Docker)

For full local functionality (settings UI, OCR, persistent stacks), use Docker Compose with `RUNTIME_PROFILE=local`:

```bash
cp env.example .env.local
# edit .env.local with your keys
docker compose up --build
```

See the main [README](../../README.md) for the local quick start.
