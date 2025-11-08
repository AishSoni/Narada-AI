# Deploying Narada AI to Vercel

This guide will walk you through deploying Narada AI Deep Research Agent to Vercel, including handling all required API keys and environment variables.

## 🚨 Important Notes

### Required Services for Vercel Deployment

Since this application uses **Qdrant vector database** and optionally **Ollama for local LLMs**, you'll need to consider cloud alternatives for Vercel deployment:

1. **Qdrant Vector Database**: 
   - Use **Qdrant Cloud** (free tier available): https://cloud.qdrant.io
   - Alternative: Deploy Qdrant on Railway, Render, or other cloud providers

2. **Ollama (Optional)**:
   - Ollama is for **local** LLM hosting and won't work on Vercel
   - Use cloud LLM providers instead: OpenAI, OpenRouter, or Cohere

### Required API Keys

**Minimum Required** (for basic functionality):
- ✅ `OPENAI_API_KEY` - For GPT models and embeddings
- ✅ `TAVILY_API_KEY` - For web search
- ✅ `FIRECRAWL_API_KEY` - For web scraping
- ✅ `QDRANT_URL` - Qdrant Cloud URL
- ✅ `QDRANT_API_KEY` - Qdrant Cloud API key

**Optional** (for extended functionality):
- `COHERE_API_KEY` - Alternative embedding provider
- `OPENROUTER_API_KEY` - Access to multiple LLM providers
- `SERP_API_KEY` - Alternative search provider
- `DUCKDUCKGO_API_KEY` - Private search (has rate limits)
- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` - For rate limiting

---

## 📋 Pre-Deployment Checklist

### 1. Set Up Qdrant Cloud

1. Sign up at https://cloud.qdrant.io
2. Create a new cluster (free tier available)
3. Note your:
   - Cluster URL (e.g., `https://xyz-example.gcp-us-central1.cloud.qdrant.io:6333`)
   - API Key

### 2. Obtain Required API Keys

| Service | Sign Up Link | Free Tier | Notes |
|---------|-------------|-----------|-------|
| OpenAI | https://platform.openai.com | $5 free credit | Required for GPT-4 and embeddings |
| Tavily | https://tavily.com | 1,000 requests/month | Required for web search |
| Firecrawl | https://firecrawl.dev | 500 credits/month | Required for web scraping |
| Cohere | https://cohere.com | Free tier available | Optional - alternative embeddings |
| OpenRouter | https://openrouter.ai | Pay-as-you-go | Optional - multiple LLM access |
| Upstash Redis | https://upstash.com | 10K requests/day | Optional - rate limiting |

### 3. Prepare Your Repository

Ensure these files exist in your repository:
- ✅ `package.json`
- ✅ `next.config.ts`
- ✅ `vercel.json` (already configured)
- ✅ `env.example` (for reference)

---

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Connect Repository to Vercel

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select your Git provider (GitHub, GitLab, Bitbucket)
4. Import the `Narada-AI` repository
5. Select the repository root

#### Step 2: Configure Build Settings

Vercel should auto-detect Next.js. Verify:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` or `pnpm build`
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` or `pnpm install`
- **Node Version**: 18.x or higher

#### Step 3: Configure Environment Variables

In the Vercel dashboard, add the following environment variables:

##### **Essential Variables**

```bash
# AI/LLM Provider (Required)
OPENAI_API_KEY=sk-proj-...your_key_here...

# Search Providers (Required)
TAVILY_API_KEY=tvly-...your_key_here...
FIRECRAWL_API_KEY=fc-...your_key_here...

# Vector Database (Required for Qdrant Cloud)
QDRANT_URL=https://xyz-example.gcp-us-central1.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_cloud_api_key
QDRANT_COLLECTION_NAME=narada_vectors

# Provider Configuration
LLM_PROVIDER=openai
EMBEDDING_PROVIDER=openai
SEARCH_PROVIDER=tavily
VECTOR_DB_PROVIDER=qdrant

# Default Models
OPENAI_LLM_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Next.js Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

##### **Optional Variables** (if using alternative providers)

```bash
# Cohere (Optional - for Cohere embeddings)
COHERE_API_KEY=your_cohere_key
COHERE_EMBEDDING_MODEL=embed-english-v3.0

# OpenRouter (Optional - for multiple LLM providers)
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_LLM_MODEL=anthropic/claude-3-sonnet

# Alternative Search Providers (Optional)
SERP_API_KEY=your_serp_key
DUCKDUCKGO_API_KEY=your_duckduckgo_key

# Rate Limiting (Optional - recommended for production)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Advanced Search Settings (Optional - use defaults if not specified)
MAX_SEARCH_QUERIES=3
MAX_SOURCES_PER_SEARCH=10
MAX_SOURCES_TO_SCRAPE=5
MIN_CONTENT_LENGTH=200
SUMMARY_CHAR_LIMIT=1000
```

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (typically 2-5 minutes)
3. Once deployed, you'll receive a URL like: `https://narada-ai.vercel.app`

#### Step 5: Verify Deployment

1. Visit your deployment URL
2. Check that the settings page loads: `https://your-app.vercel.app/settings`
3. Verify environment variables are accessible through the settings UI
4. Test a simple search query

---

### Option 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```powershell
npm install -g vercel
```

#### Step 2: Login to Vercel

```powershell
vercel login
```

#### Step 3: Create `.env.production` (Local Testing Only)

**⚠️ DO NOT COMMIT THIS FILE**

```powershell
# Copy from env.example
Copy-Item env.example .env.production

# Edit with your actual API keys
notepad .env.production
```

#### Step 4: Deploy

```powershell
# Navigate to your project directory
cd e:\Narada-AI

# Deploy to preview
vercel

# Or deploy to production
vercel --prod
```

#### Step 5: Add Environment Variables via CLI

```powershell
# Add environment variables one by one
vercel env add OPENAI_API_KEY
vercel env add TAVILY_API_KEY
vercel env add FIRECRAWL_API_KEY
vercel env add QDRANT_URL
vercel env add QDRANT_API_KEY

# Specify environment: production, preview, or development
# When prompted, select: production
```

---

## 🔧 Post-Deployment Configuration

### 1. In-App Settings Configuration

Users can configure additional settings through the web UI:

1. Navigate to: `https://your-app.vercel.app/settings`
2. Configure:
   - Search providers and API keys
   - LLM providers and models
   - Embedding providers
   - Vector database settings
   - Advanced search parameters

**Note**: The settings page saves to `.env.local`, which won't persist across Vercel deployments. For production, users should:
- Use environment variables in Vercel dashboard
- Or use a cloud configuration service (future enhancement)

### 2. Set Up Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

---

## ⚙️ Configuration Options

### Environment Variable Priority

The app checks for configuration in this order:
1. Environment variables from Vercel dashboard
2. Settings saved via the UI (`.env.local` - not available on Vercel)
3. Default values from code

### Provider Options

#### LLM Providers
- `openai` - OpenAI GPT models (recommended for Vercel)
- `openrouter` - Multiple LLM providers through OpenRouter
- `ollama` - ⚠️ Not supported on Vercel (local only)

#### Embedding Providers
- `openai` - OpenAI embeddings (recommended)
- `cohere` - Cohere embeddings
- `ollama` - ⚠️ Not supported on Vercel (local only)

#### Search Providers
- `tavily` - AI search API (recommended)
- `firecrawl` - Web scraping API
- `serp` - SERP API
- `duckduckgo` - DuckDuckGo search

#### Vector Database
- `qdrant` - Qdrant vector database (use Qdrant Cloud for Vercel)

---

## 🐛 Troubleshooting

### Build Fails

**Error**: `Module not found` or dependency issues

```powershell
# Clear cache and reinstall dependencies locally
Remove-Item -Recurse -Force node_modules, .next
pnpm install
pnpm build

# If successful, commit and push changes
git add .
git commit -m "Fix dependencies"
git push
```

### Environment Variables Not Working

1. Verify variables are added in Vercel dashboard
2. Check variable names match exactly (case-sensitive)
3. Redeploy to pick up new environment variables
4. Check the Vercel deployment logs for errors

### API Key Issues

**Error**: `API key not found` or `Unauthorized`

1. Verify API keys are valid
2. Check that keys aren't expired
3. Ensure no extra spaces or quotes in environment variables
4. Test keys locally first with `.env.local`

### Qdrant Connection Issues

**Error**: `Failed to connect to Qdrant`

1. Verify `QDRANT_URL` includes the protocol (`https://`)
2. Check that `QDRANT_API_KEY` is correct
3. Ensure Qdrant Cloud cluster is running
4. Test connection using Qdrant's dashboard

### Function Timeout Errors

**Error**: `Function execution timeout`

The `vercel.json` already configures 300s timeout for API routes. If you still see timeouts:

1. Reduce `MAX_SOURCES_TO_SCRAPE` in settings
2. Reduce `MAX_SEARCH_QUERIES` in settings
3. Consider upgrading Vercel plan for longer timeout limits

---

## 🔒 Security Best Practices

### 1. Never Commit API Keys

Add to `.gitignore`:
```
.env
.env.local
.env.production
.env.development
```

### 2. Use Environment Variables

Always use Vercel's environment variable system for sensitive data.

### 3. Rotate API Keys Regularly

Update API keys periodically in the Vercel dashboard.

### 4. Enable Rate Limiting

Set up Upstash Redis for rate limiting in production:

```bash
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 5. Monitor API Usage

- Check OpenAI usage: https://platform.openai.com/usage
- Monitor Tavily credits: https://tavily.com/dashboard
- Track Firecrawl usage: https://firecrawl.dev/dashboard

---

## 📊 Monitoring & Analytics

### Vercel Analytics

1. Go to your project dashboard
2. Click "Analytics"
3. Enable Vercel Analytics for performance monitoring

### Function Logs

View real-time logs:
```powershell
vercel logs
```

Or in the Vercel dashboard under "Functions" → "Logs"

---

## 💰 Cost Considerations

### Free Tier Limits

- **Vercel**: 100GB bandwidth/month, 100 function executions/day (Hobby plan)
- **OpenAI**: Pay-as-you-go after initial credits
- **Tavily**: 1,000 API calls/month (free tier)
- **Firecrawl**: 500 credits/month (free tier)
- **Qdrant Cloud**: 1GB storage (free tier)

### Estimated Monthly Costs (with moderate use)

- OpenAI API: $20-50/month (varies by usage)
- Tavily: $0 (within free tier) or $49/month (Pro)
- Firecrawl: $0 (within free tier) or $29/month (Standard)
- Qdrant Cloud: $0 (free tier) or $25/month (Standard)
- **Total**: $0-104/month depending on usage and tiers

---

## 🔄 Updating Your Deployment

### Automatic Deployments

Vercel automatically deploys when you push to your main branch:

```powershell
git add .
git commit -m "Update feature"
git push origin main
```

### Manual Redeployment

In Vercel dashboard:
1. Go to "Deployments"
2. Find a previous deployment
3. Click "..." → "Redeploy"

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Qdrant Cloud Guide](https://qdrant.tech/documentation/cloud/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Tavily API Documentation](https://docs.tavily.com)

---

## 🆘 Need Help?

- Check [Vercel Support](https://vercel.com/support)
- Review [GitHub Issues](https://github.com/AishSoni/Narada-AI/issues)
- Check Vercel deployment logs for detailed error messages

---

## ✅ Deployment Checklist

- [ ] Set up Qdrant Cloud account and get API credentials
- [ ] Obtain all required API keys (OpenAI, Tavily, Firecrawl)
- [ ] Push code to Git repository (GitHub, GitLab, or Bitbucket)
- [ ] Import repository in Vercel dashboard
- [ ] Add all environment variables in Vercel dashboard
- [ ] Deploy and verify build succeeds
- [ ] Test the deployed application
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring and analytics
- [ ] Document API key locations for team members
- [ ] Set up rate limiting with Upstash (optional but recommended)

---

**Happy Deploying! 🚀**

If you encounter any issues, check the troubleshooting section or review the Vercel deployment logs for detailed error messages.
