# Quick Start: Deploying to Vercel

This is a streamlined guide to get Narada AI deployed to Vercel in under 10 minutes. For detailed instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

## Prerequisites (5 minutes)

### 1. Get API Keys

Sign up and get free API keys from:

| Service | Link | Free Tier | Required? |
|---------|------|-----------|-----------|
| Qdrant Cloud | https://cloud.qdrant.io | 1GB free | ✅ Yes |
| OpenAI | https://platform.openai.com | $5 credit | ✅ Yes |
| Tavily | https://tavily.com | 1K requests/month | ✅ Yes |
| Firecrawl | https://firecrawl.dev | 500 credits/month | ✅ Yes |

### 2. Save Your Keys

Keep these handy - you'll need them in step 2 of deployment:

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

**Required Variables:**

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

### Step 3: Deploy

1. Click "Deploy"
2. Wait 2-5 minutes for build to complete
3. You'll get a URL like: `https://narada-ai-xyz.vercel.app`

### Step 4: Test

1. Visit your URL
2. Try a search query
3. Visit `/settings` to verify configuration

## Verify Before Deployment

Before deploying, you can check if everything is configured correctly:

```powershell
# Check deployment readiness
npm run check:deployment

# Or with pnpm
pnpm check:deployment
```

This will verify:
- ✅ Required files exist
- ✅ Environment variables are set
- ✅ Configuration is valid
- ⚠️  Warnings for potential issues

## Common Issues

### "Module not found" during build

Your dependencies might be out of sync:

```powershell
rm -rf node_modules .next
pnpm install
pnpm build
```

### "API key not found" errors

1. Double-check environment variable names (case-sensitive)
2. Verify no extra spaces in API keys
3. Ensure keys are valid by testing them locally first

### Qdrant connection fails

Make sure your `QDRANT_URL`:
- Includes `https://` protocol
- Includes the port `:6333`
- Is from Qdrant Cloud (not localhost)

Example: `https://xyz-example.gcp-us-central1.cloud.qdrant.io:6333`

## Post-Deployment

### Configure Additional Settings

Users can configure more settings via the UI:
1. Visit: `https://your-app.vercel.app/settings`
2. Adjust search parameters
3. Add optional API keys for alternative providers

### Set Custom Domain

1. Go to Vercel dashboard → Your Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed

## Cost Estimate

**Free Tier Usage:**
- Vercel: Free for hobby projects
- OpenAI: $5 free credits (then pay-as-you-go)
- Tavily: 1,000 searches/month free
- Firecrawl: 500 credits/month free
- Qdrant Cloud: 1GB storage free

**Estimated Monthly Cost (moderate use):** $0-50/month

## Need Help?

- 📖 Full deployment guide: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- 🐛 Check Vercel logs: `vercel logs` or in dashboard
- 💬 GitHub Issues: [Report an issue](https://github.com/AishSoni/Narada-AI/issues)

---

**That's it! Your Narada AI instance should now be live! 🚀**
