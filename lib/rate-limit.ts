import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';
import { isHosted } from './runtime';

export const getRateLimiter = (endpoint: string) => {
  const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  if (!hasUpstash && !isHosted()) {
    if (process.env.NODE_ENV !== 'production') return null;
  }

  if (!hasUpstash) return null;

  const redis = Redis.fromEnv();

  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(50, '1 d'),
    analytics: true,
    prefix: `ratelimit:${endpoint}`,
  });
};

/** Trust only platform-set client IP headers, not spoofable x-forwarded-for. */
export const getIP = (request: NextRequest): string => {
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0].trim();

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return '127.0.0.1';
};

export const isRateLimited = async (request: NextRequest, endpoint: string) => {
  const limiter = getRateLimiter(endpoint);

  if (!limiter) {
    return { success: true, limit: 50, remaining: 50 };
  }

  const ip = getIP(request);
  const result = await limiter.limit(ip);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
  };
};
