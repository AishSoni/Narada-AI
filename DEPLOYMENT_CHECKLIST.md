# Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## ✅ Pre-Deployment

### 1. Cloud Services Setup

- [ ] **Qdrant Cloud**
  - [ ] Created account at https://cloud.qdrant.io
  - [ ] Created new cluster
  - [ ] Copied cluster URL (includes `:6333` port)
  - [ ] Copied API key
  - [ ] Verified connection from local machine (optional)

- [ ] **OpenAI**
  - [ ] Created account at https://platform.openai.com
  - [ ] Added payment method (after free credits)
  - [ ] Generated API key
  - [ ] Tested API key locally (optional)

- [ ] **Tavily**
  - [ ] Created account at https://tavily.com
  - [ ] Generated API key
  - [ ] Noted free tier limits (1,000 requests/month)

- [ ] **Firecrawl**
  - [ ] Created account at https://firecrawl.dev
  - [ ] Generated API key
  - [ ] Noted free tier limits (500 credits/month)

### 2. Optional Services

- [ ] **Upstash Redis** (for rate limiting)
  - [ ] Created account at https://upstash.com
  - [ ] Created Redis database
  - [ ] Copied REST URL
  - [ ] Copied REST token

- [ ] **Cohere** (for alternative embeddings)
  - [ ] Created account at https://cohere.com
  - [ ] Generated API key

- [ ] **OpenRouter** (for multiple LLM providers)
  - [ ] Created account at https://openrouter.ai
  - [ ] Generated API key

### 3. Repository Preparation

- [ ] Code is committed to Git repository
- [ ] `.gitignore` includes `.env*` files
- [ ] No `.env.local` or `.env.production` files in repository
- [ ] `package.json` has correct dependencies
- [ ] `vercel.json` exists with function timeout configuration
- [ ] `next.config.ts` is properly configured

### 4. Local Testing (Optional but Recommended)

- [ ] Installed dependencies: `pnpm install`
- [ ] Created `.env.local` with all API keys
- [ ] Ran build locally: `pnpm build`
- [ ] Tested app locally: `pnpm dev`
- [ ] Verified all features work
- [ ] Ran deployment check: `pnpm check:deployment`

## 🚀 Vercel Deployment

### 1. Import Project

- [ ] Visited https://vercel.com/new
- [ ] Connected Git provider (GitHub/GitLab/Bitbucket)
- [ ] Selected `Narada-AI` repository
- [ ] Confirmed framework detected as Next.js

### 2. Environment Variables

#### Required Variables (Copy exact values)

- [ ] `QDRANT_URL` = `https://xyz.cloud.qdrant.io:6333`
- [ ] `QDRANT_API_KEY` = `your_qdrant_api_key`
- [ ] `QDRANT_COLLECTION_NAME` = `narada_vectors`
- [ ] `OPENAI_API_KEY` = `sk-proj-...`
- [ ] `TAVILY_API_KEY` = `tvly-...`
- [ ] `FIRECRAWL_API_KEY` = `fc-...`
- [ ] `LLM_PROVIDER` = `openai`
- [ ] `EMBEDDING_PROVIDER` = `openai`
- [ ] `SEARCH_PROVIDER` = `tavily`
- [ ] `VECTOR_DB_PROVIDER` = `qdrant`
- [ ] `NODE_ENV` = `production`

#### Optional Variables

- [ ] `OPENAI_LLM_MODEL` (default: `gpt-4o`)
- [ ] `OPENAI_EMBEDDING_MODEL` (default: `text-embedding-3-small`)
- [ ] `COHERE_API_KEY` (if using Cohere)
- [ ] `OPENROUTER_API_KEY` (if using OpenRouter)
- [ ] `UPSTASH_REDIS_REST_URL` (for rate limiting)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (for rate limiting)
- [ ] `NEXT_TELEMETRY_DISABLED` = `1` (optional)

### 3. Deploy

- [ ] Clicked "Deploy" button
- [ ] Monitored build logs for errors
- [ ] Build completed successfully
- [ ] Received deployment URL

## ✅ Post-Deployment

### 1. Initial Verification

- [ ] Visited deployment URL
- [ ] Homepage loads without errors
- [ ] No console errors in browser
- [ ] Search interface is visible

### 2. Feature Testing

- [ ] Tested basic search query
- [ ] Search returns results
- [ ] Citations are visible
- [ ] Sources load correctly
- [ ] No API key errors in logs

### 3. Settings Page

- [ ] Visited `/settings` page
- [ ] Settings page loads
- [ ] API keys are masked (show as `xxx•••••`)
- [ ] Provider configuration is visible

### 4. Knowledge Stack (if applicable)

- [ ] Visited `/knowledge-stacks` page
- [ ] Can create new knowledge stack
- [ ] Can upload documents
- [ ] Documents are indexed in Qdrant
- [ ] Can search within knowledge stack

### 5. Performance

- [ ] Page load time is acceptable
- [ ] Search completes within reasonable time
- [ ] No function timeout errors
- [ ] Vercel Analytics shows no errors

## 🔧 Configuration

### 1. Custom Domain (Optional)

- [ ] Added custom domain in Vercel settings
- [ ] Updated DNS records
- [ ] Verified domain is working
- [ ] SSL certificate is active

### 2. Monitoring

- [ ] Enabled Vercel Analytics
- [ ] Set up error tracking (optional)
- [ ] Bookmarked Vercel dashboard
- [ ] Set up API usage monitoring:
  - [ ] OpenAI usage dashboard
  - [ ] Tavily dashboard
  - [ ] Firecrawl dashboard
  - [ ] Qdrant Cloud dashboard

### 3. Rate Limiting (Recommended)

- [ ] Set up Upstash Redis
- [ ] Added Redis environment variables
- [ ] Tested rate limiting is working

## 🔒 Security

- [ ] Verified `.env` files are not in repository
- [ ] All API keys are in Vercel environment variables (not in code)
- [ ] API keys are masked in settings UI
- [ ] No sensitive data in logs
- [ ] Git history doesn't contain API keys

## 📊 Cost Management

- [ ] Noted free tier limits for all services
- [ ] Set up billing alerts on OpenAI
- [ ] Configured spending limits where available
- [ ] Documented expected monthly costs
- [ ] Set up budget monitoring

## 📝 Documentation

- [ ] Documented deployment process for team
- [ ] Saved all API keys in secure password manager
- [ ] Documented custom domain setup (if applicable)
- [ ] Created internal runbook (if needed)
- [ ] Shared deployment URL with team

## 🆘 Troubleshooting Reference

### If Build Fails

- [ ] Check Vercel build logs
- [ ] Verify all dependencies are in `package.json`
- [ ] Test build locally: `pnpm build`
- [ ] Check for TypeScript errors
- [ ] Clear Vercel cache and retry

### If Runtime Errors Occur

- [ ] Check Vercel function logs
- [ ] Verify all environment variables are set
- [ ] Check variable names are exact (case-sensitive)
- [ ] Test API keys are valid
- [ ] Check Qdrant Cloud is accessible

### If API Errors Occur

- [ ] Verify API keys are correct
- [ ] Check API quotas haven't been exceeded
- [ ] Test API keys with curl or Postman
- [ ] Check service status pages
- [ ] Review API usage dashboards

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Application loads without errors
- ✅ Search functionality works end-to-end
- ✅ Sources are retrieved and displayed
- ✅ Citations are properly linked
- ✅ Settings page is accessible
- ✅ No console errors or warnings
- ✅ API usage is within expected limits
- ✅ Performance meets expectations

---

## 📅 Maintenance Tasks

### Weekly

- [ ] Check API usage and costs
- [ ] Review Vercel function logs for errors
- [ ] Monitor performance metrics

### Monthly

- [ ] Review and optimize API costs
- [ ] Check for dependency updates
- [ ] Review error logs and fix issues
- [ ] Update documentation as needed

### Quarterly

- [ ] Rotate API keys
- [ ] Review and update rate limits
- [ ] Audit security settings
- [ ] Update dependencies

---

**Need help?** Refer to:
- [Quick Deploy Guide](./QUICK_DEPLOY.md)
- [Full Deployment Guide](./VERCEL_DEPLOYMENT.md)
- [Vercel Documentation](https://vercel.com/docs)
