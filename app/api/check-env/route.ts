import { NextResponse } from 'next/server';
import { getAppConfig } from '@/lib/app-config';
import { LangGraphLLMClient } from '@/lib/langgraph-llm-client';
import { requireLocal } from '@/lib/local-only';

export async function GET() {
  const blocked = requireLocal();
  if (blocked) return blocked;

  const appConfig = getAppConfig();

  return NextResponse.json({
    environmentStatus: {
      SEARCH_API_PROVIDER: appConfig.searchProvider,
      LLM_PROVIDER: appConfig.llmProvider,
      EMBEDDING_PROVIDER: appConfig.embeddingProvider,
      HAS_SEARCH_API_KEY: !!appConfig.searchApiKey,
      HAS_LLM_CONFIG: LangGraphLLMClient.isProviderConfigured(),
      SEARCH_PROVIDER_DETAILS: {
        provider: appConfig.searchProvider,
        hasKey: !!appConfig.searchApiKey,
      },
      LLM_PROVIDER_DETAILS: {
        provider: appConfig.llmProvider,
        hasConfig: LangGraphLLMClient.isProviderConfigured(),
        model: appConfig.llmModel,
      },
    },
  });
}
