# Quick Start: Deploying to Vercel

This guide gets Narada AI deployed to Vercel in under 10 minutes.

## Important Notes

- **Qdrant**: Use [Qdrant Cloud](https://cloud.qdrant.io) (free tier available). Localhost will not work on Vercel.
- **Ollama**: Local-only; use OpenAI, OpenRouter, or Cohere on Vercel instead.
- **Optional providers**: Cohere (embeddings), OpenRouter (LLMs), SERP/DuckDuckGo (search), Upstash Redis (rate limiting).

## Prerequisites (5 minutes)

### 1. Get API Keys

Sign up and get free API keys from:

| Service | Link | Free Tier | Required? |
|---------|------|-----------|-----------|
| Qdrant Cloud | https://cloud.qdrant.io | 1GB free | Yes |
| OpenAI | https://platform.openai.com | $5 credit | Yes |
| Tavily | https://tavily.com | 1K requests/month | Yes |
| Firecrawl | https://firecrawl.dev | 500 credits/month | Yes |

### 2. Save Your Keys

Keep these handy for deployment:

```
QDRANT_URL=https://xyz.cloud.qdrant.io:6333
QDRANT_API_KEY=...
OPENAI_API_KEY=sk-proj-...
TAVILY_API_KEY=tvly-...
FIRECRAWL_API_KEY=fc-...
```

## Deployment (5 minutes)

### Step 1: Import to Vercel

1. Go to https://vercel.com/new
2. Sign in with GitHub/GitLab/Bitbucket
3. Click "Import Project"
4. Select this repository: `Narada-AI`
5. Click "Import"

### Step 2: Add Environment Variables

In the Vercel import screen, add these environment variables:

**Required:**

```bash
# Vector Database
QDRANT_URL=https://xyz.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION_NAME=narada_vectors

# AI Provider
OPENAI_API_KEY=sk-proj-your_key_here

# Search Providers
TAVILY_API_KEY=tvly-your_key_here
FIRECRAWL_API_KEY=fc-your_key_here

# Provider Configuration
LLM_PROVIDER=openai
EMBEDDING_PROVIDER=openai
SEARCH_PROVIDER=tavily
VECTOR_DB_PROVIDER=qdrant

# Next.js
NODE_ENV=production
```

**Optional:**

```bash
COHERE_API_KEY=...
OPENROUTER_API_KEY=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### Step 3: Deploy

1. Click "Deploy"
2. Wait 2–5 minutes for the build to complete
3. You'll get a URL like: `https://narada-ai-xyz.vercel.app`

### Step 4: Test

1. Visit your URL
2. Try a search query
3. Visit `/settings` to verify configuration

## Verify Before Deployment

```bash
npm run check:deployment
# or
pnpm check:deployment
```

This checks required files, environment variables, and configuration.

## Common Issues

### "Module not found" during build

```bash
rm -rf node_modules .next
pnpm install
pnpm build
```

### "API key not found" errors

1. Double-check environment variable names (case-sensitive)
2. Verify no extra spaces in API keys
3. Test keys locally first

### Qdrant connection fails

Your `QDRANT_URL` must:

- Include `https://`
- Include port `:6333`
- Point to Qdrant Cloud, not localhost

Example: `https://xyz-example.gcp-us-central1.cloud.qdrant.io:6333`

## Post-Deployment

- Configure additional settings at `/settings`
- Add a custom domain in Vercel → Project → Settings → Domains

## Cost Estimate

**Free tier usage:** Vercel (hobby), OpenAI ($5 credits), Tavily (1K searches/month), Firecrawl (500 credits/month), Qdrant Cloud (1GB).

**Estimated monthly cost (moderate use):** $0–50/month

## Need Help?

- Check Vercel logs in the dashboard or via `vercel logs`
- [Report an issue](https://github.com/AishSoni/Narada-AI/issues)

---

**That's it! Your Narada AI instance should now be live.**
