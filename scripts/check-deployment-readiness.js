#!/usr/bin/env node

/**
 * Narada AI - Vercel Deployment Readiness Check
 * 
 * This script checks if your project is ready for Vercel deployment
 * by verifying required files, configuration, and environment variables.
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, required = true) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : required ? '❌' : '⚠️';
  const color = exists ? 'green' : required ? 'red' : 'yellow';
  log(`${status} ${filePath}`, color);
  return exists;
}

function checkEnvVariable(varName, isOptional = false) {
  const exists = process.env[varName] !== undefined && process.env[varName] !== '';
  const status = exists ? '✅' : isOptional ? '⚠️' : '❌';
  const color = exists ? 'green' : isOptional ? 'yellow' : 'red';
  const label = isOptional ? '(optional)' : '(required)';
  log(`${status} ${varName} ${label}`, color);
  return exists;
}

function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Narada AI - Vercel Deployment Readiness Check          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  let allRequiredPresent = true;
  let warnings = 0;

  // Check required files
  log('\n📁 Checking Required Files...', 'blue');
  allRequiredPresent &= checkFile('package.json');
  allRequiredPresent &= checkFile('next.config.ts') || checkFile('next.config.js');
  allRequiredPresent &= checkFile('vercel.json');
  checkFile('.gitignore');
  checkFile('tsconfig.json');

  // Check if .env files are NOT committed
  log('\n🔒 Checking Security (env files should NOT be committed)...', 'blue');
  const envNotCommitted = !checkFile('.env.local', false);
  const envProdNotCommitted = !checkFile('.env.production', false);
  
  if (envNotCommitted && envProdNotCommitted) {
    log('✅ No .env files found in repository (good!)', 'green');
  } else {
    log('⚠️  Warning: .env files detected - ensure they are in .gitignore', 'yellow');
    warnings++;
  }

  // Check environment variables (from .env.local if present)
  log('\n🔑 Checking Environment Variables...', 'blue');
  
  // Try to load .env.local for local testing
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    log('📄 Loading environment from .env.local for verification...', 'cyan');
    const envContent = fs.readFileSync(envLocalPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]+)=(.+)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
    });
  } else {
    log('ℹ️  No .env.local found - checking system environment only', 'yellow');
  }

  log('\n📍 Required for Basic Functionality:', 'blue');
  allRequiredPresent &= checkEnvVariable('OPENAI_API_KEY');
  allRequiredPresent &= checkEnvVariable('TAVILY_API_KEY');
  allRequiredPresent &= checkEnvVariable('FIRECRAWL_API_KEY');
  allRequiredPresent &= checkEnvVariable('QDRANT_URL');
  allRequiredPresent &= checkEnvVariable('QDRANT_API_KEY');

  log('\n📍 Optional but Recommended:', 'blue');
  checkEnvVariable('COHERE_API_KEY', true);
  checkEnvVariable('OPENROUTER_API_KEY', true);
  checkEnvVariable('UPSTASH_REDIS_REST_URL', true);
  checkEnvVariable('UPSTASH_REDIS_REST_TOKEN', true);

  // Check provider configuration
  log('\n⚙️  Provider Configuration:', 'blue');
  checkEnvVariable('LLM_PROVIDER', true);
  checkEnvVariable('EMBEDDING_PROVIDER', true);
  checkEnvVariable('SEARCH_PROVIDER', true);
  checkEnvVariable('VECTOR_DB_PROVIDER', true);

  // Check for Qdrant Cloud URL format
  if (process.env.QDRANT_URL) {
    const isCloudUrl = process.env.QDRANT_URL.includes('cloud.qdrant.io');
    if (isCloudUrl) {
      log('✅ Qdrant Cloud URL detected (recommended for Vercel)', 'green');
    } else if (process.env.QDRANT_URL.includes('localhost')) {
      log('⚠️  Warning: Localhost Qdrant URL detected - this won\'t work on Vercel!', 'yellow');
      log('   Use Qdrant Cloud URL instead: https://cloud.qdrant.io', 'yellow');
      warnings++;
    }
  }

  // Check for Ollama configuration (not supported on Vercel)
  if (process.env.LLM_PROVIDER === 'ollama' || process.env.EMBEDDING_PROVIDER === 'ollama') {
    log('⚠️  Warning: Ollama provider detected - not supported on Vercel!', 'yellow');
    log('   Use OpenAI, Cohere, or OpenRouter instead', 'yellow');
    warnings++;
  }

  // Summary
  log('\n' + '═'.repeat(60), 'cyan');
  
  if (allRequiredPresent && warnings === 0) {
    log('\n✅ SUCCESS! Your project is ready for Vercel deployment!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Push your code to GitHub/GitLab/Bitbucket', 'cyan');
    log('2. Go to https://vercel.com/new', 'cyan');
    log('3. Import your repository', 'cyan');
    log('4. Add environment variables in Vercel dashboard', 'cyan');
    log('5. Deploy!\n', 'cyan');
    process.exit(0);
  } else if (!allRequiredPresent) {
    log('\n❌ DEPLOYMENT NOT READY - Missing required configuration!', 'red');
    log('\nPlease fix the issues marked with ❌ above.', 'red');
    log('Refer to VERCEL_DEPLOYMENT.md for detailed instructions.\n', 'yellow');
    process.exit(1);
  } else {
    log('\n⚠️  DEPLOYMENT READY (with warnings)', 'yellow');
    log('\nYour project can be deployed, but there are warnings to address.', 'yellow');
    log('Refer to warnings marked with ⚠️  above.\n', 'yellow');
    process.exit(0);
  }
}

main();
