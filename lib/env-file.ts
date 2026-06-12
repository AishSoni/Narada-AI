import { readFileSync, existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export const ENV_FILE_PATH = join(process.cwd(), '.env.local');

let cachedEnv: Record<string, string> | null = null;

function parseEnvContent(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
  return env;
}

export function invalidateEnvCache(): void {
  cachedEnv = null;
}

export function readEnvFileSync(): Record<string, string> {
  if (cachedEnv) return { ...cachedEnv };
  try {
    if (!existsSync(ENV_FILE_PATH)) {
      cachedEnv = {};
      return {};
    }
    const content = readFileSync(ENV_FILE_PATH, 'utf-8');
    cachedEnv = parseEnvContent(content);
    return { ...cachedEnv };
  } catch {
    cachedEnv = {};
    return {};
  }
}

export async function readEnvFile(): Promise<Record<string, string>> {
  if (cachedEnv) return { ...cachedEnv };
  try {
    const content = await readFile(ENV_FILE_PATH, 'utf-8');
    cachedEnv = parseEnvContent(content);
    return { ...cachedEnv };
  } catch {
    cachedEnv = {};
    return {};
  }
}

export async function writeEnvFile(env: Record<string, string>): Promise<void> {
  const lines = Object.entries(env)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');
  await writeFile(ENV_FILE_PATH, lines + '\n', 'utf-8');
  invalidateEnvCache();
}
