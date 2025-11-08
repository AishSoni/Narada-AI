# 🚀 Deploying Narada AI to Vercel - Complete Guide

## 📚 Documentation Overview

This project includes comprehensive deployment documentation:

| Document | Purpose | Audience |
|----------|---------|----------|
| **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** | 10-minute quickstart guide | Everyone |
| **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** | Detailed deployment instructions | Developers |
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | Step-by-step checklist | Project managers |
| **[.env.vercel.template](./.env.vercel.template)** | Environment variable template | DevOps |

## ⚡ Quick Start (5 minutes)

### 1. Get API Keys (Required)

Sign up for these services and get your API keys:

- **Qdrant Cloud**: https://cloud.qdrant.io (Free 1GB tier)
- **OpenAI**: https://platform.openai.com ($5 free credits)
- **Tavily**: https://tavily.com (1,000 free requests/month)
- **Firecrawl**: https://firecrawl.dev (500 free credits/month)

### 2. Deploy to Vercel

1. Go to https://vercel.com/new
2. Import the `Narada-AI` repository
3. Add environment variables (see below)
4. Click Deploy

### 3. Essential Environment Variables

Add these in the Vercel dashboard during import:

```bash
# Vector Database (Qdrant Cloud)
QDRANT_URL=https://xyz.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION_NAME=narada_vectors

# AI Provider (OpenAI)
OPENAI_API_KEY=sk-proj-your_key_here

# Search Providers
TAVILY_API_KEY=tvly-your_key_here
FIRECRAWL_API_KEY=fc-your_key_here

# Provider Configuration
LLM_PROVIDER=openai
EMBEDDING_PROVIDER=openai
SEARCH_PROVIDER=tavily
VECTOR_DB_PROVIDER=qdrant
NODE_ENV=production
```

## 🎯 Key Considerations

### 1. **Multiple API Keys Required**

This project requires several API keys to function. Users have two options:

#### Option A: Pre-configured Deployment (Recommended for Public Apps)
- Set up all API keys in Vercel environment variables
- Users can use the app immediately without setup
- **Cost**: You bear all API usage costs
- **Best for**: Demo sites, internal tools, controlled user base

#### Option B: User-Provided Keys (Recommended for Public SaaS)
- Users provide their own API keys via the `/settings` page
- Each user bears their own API costs
- **Challenge**: Keys stored in browser localStorage only (not persistent across sessions/devices)
- **Solution**: Consider implementing a user authentication system with backend key storage
- **Best for**: Public applications, cost control

### 2. **Cloud Services Required**

Since Vercel is serverless, you cannot run local services:

| Local Service | Cloud Alternative | Cost |
|---------------|-------------------|------|
| Qdrant (local) | Qdrant Cloud | Free tier: 1GB |
| Ollama (local LLM) | OpenAI / OpenRouter | Pay-as-you-go |
| Redis (optional) | Upstash Redis | Free tier: 10K req/day |

### 3. **Function Timeout Configuration**

The `vercel.json` file already configures extended timeouts:

```json
{
  "functions": {
    "app/api/*/route.ts": {
      "maxDuration": 300
    }
  }
}
```

This allows up to 5 minutes for complex research queries. Note:
- **Hobby plan**: Max 10 seconds (upgrade needed)
- **Pro plan**: Max 60 seconds
- **Enterprise plan**: Max 900 seconds

## 🔧 Pre-Deployment Verification

Before deploying, verify your setup:

```powershell
# Install dependencies
pnpm install

# Run deployment readiness check
pnpm check:deployment

# Test build locally (optional but recommended)
pnpm build

# Test locally with your API keys
pnpm dev
```

## 📋 Deployment Options

### Option 1: Vercel Dashboard (Easiest)

1. **Fork/Clone Repository**
   ```powershell
   git clone https://github.com/AishSoni/Narada-AI.git
   cd Narada-AI
   ```

2. **Push to Your Git Repository**
   ```powershell
   git remote set-url origin https://github.com/your-username/Narada-AI.git
   git push origin main
   ```

3. **Import to Vercel**
   - Visit https://vercel.com/new
   - Import your repository
   - Add environment variables
   - Deploy

### Option 2: Vercel CLI

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd e:\Narada-AI
vercel

# Add environment variables
vercel env add OPENAI_API_KEY
vercel env add TAVILY_API_KEY
vercel env add FIRECRAWL_API_KEY
vercel env add QDRANT_URL
vercel env add QDRANT_API_KEY
# ... add all other required variables

# Deploy to production
vercel --prod
```

## 🔐 API Key Management Strategy

### For Demonstration/Internal Use

**Set all keys in Vercel environment variables:**

✅ Simple setup - works immediately
✅ No user configuration needed
✅ Centralized key management
❌ You pay for all API usage
❌ No user-level rate limiting

### For Public/SaaS Application

**Consider implementing user authentication:**

```typescript
// Future enhancement: Store user keys in database
interface UserConfig {
  userId: string;
  encryptedKeys: {
    openai?: string;
    tavily?: string;
    firecrawl?: string;
    qdrant?: string;
  };
  usage: {
    searches: number;
    apiCalls: number;
  };
}
```

**Benefits:**
- ✅ Users bring their own keys
- ✅ Per-user rate limiting
- ✅ Usage tracking
- ✅ Cost control
- ❌ Requires authentication system
- ❌ More complex setup

## 💰 Cost Estimation

### Minimal Configuration (Using all free tiers)

| Service | Free Tier | Estimated Monthly Cost |
|---------|-----------|------------------------|
| Vercel | 100 GB bandwidth | $0 |
| OpenAI | $5 free credits | $0-20 (after credits) |
| Tavily | 1,000 requests | $0 |
| Firecrawl | 500 credits | $0 |
| Qdrant Cloud | 1GB storage | $0 |
| **Total** | | **$0-20/month** |

### Production Configuration

| Service | Plan | Estimated Monthly Cost |
|---------|------|------------------------|
| Vercel | Pro ($20/user/month) | $20 |
| OpenAI | Pay-as-you-go | $30-100 |
| Tavily | Pro (10K requests) | $49 |
| Firecrawl | Standard (5K credits) | $29 |
| Qdrant Cloud | Standard (4GB) | $25 |
| Upstash Redis | Pro | $10 |
| **Total** | | **$163-243/month** |

## 🚨 Important Notes

### 1. **Settings Page Limitation**

The current `/settings` page saves configuration to `.env.local`, which:
- ❌ Does NOT work on Vercel (serverless environment)
- ❌ Cannot write files in production
- ✅ Works for local development only

**For Vercel deployment:**
- Set all configuration via Vercel dashboard environment variables
- Or implement a cloud-based configuration system (future enhancement)

### 2. **Qdrant Vector Database**

**Local Qdrant won't work on Vercel.** You MUST use:
- Qdrant Cloud (recommended): https://cloud.qdrant.io
- Self-hosted Qdrant on another cloud provider (Railway, Render, etc.)

### 3. **Ollama LLM Support**

Ollama is for **local LLM hosting only**. On Vercel, use:
- OpenAI (recommended)
- OpenRouter (access to multiple models)
- Cohere (for embeddings)

## ✅ Success Checklist

- [ ] All required API keys obtained
- [ ] Qdrant Cloud cluster created and accessible
- [ ] Code pushed to Git repository
- [ ] Environment variables added to Vercel
- [ ] Deployed to Vercel successfully
- [ ] Homepage loads without errors
- [ ] Search functionality works
- [ ] Citations display correctly
- [ ] Settings page accessible (even if not fully functional on Vercel)
- [ ] No console errors
- [ ] Performance is acceptable

## 🆘 Need Help?

### Documentation
- 📖 [Full Deployment Guide](./VERCEL_DEPLOYMENT.md) - Comprehensive instructions
- ✅ [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Step-by-step tasks
- ⚡ [Quick Deploy](./QUICK_DEPLOY.md) - 10-minute guide

### Common Issues
- **Build fails**: Check `vercel build` logs, verify dependencies
- **API errors**: Verify environment variable names (case-sensitive)
- **Qdrant errors**: Ensure using cloud URL with `:6333` port
- **Function timeout**: Verify `vercel.json` configuration, check Vercel plan limits

### Resources
- Vercel Documentation: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- GitHub Issues: https://github.com/AishSoni/Narada-AI/issues

## 🎉 You're Ready!

Your Narada AI Deep Research Agent is ready for deployment. Choose your path:

1. **Quick & Simple**: Follow [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
2. **Detailed Setup**: Follow [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
3. **Checklist Approach**: Use [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

**Deploy now**: https://vercel.com/new

---

**Questions?** Open an issue at https://github.com/AishSoni/Narada-AI/issues
