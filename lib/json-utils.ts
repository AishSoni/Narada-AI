/**
 * Parse JSON from LLM output, stripping markdown code fences when present.
 */
export function safeParseJson<T>(raw: string): T {
  let content = raw.trim();
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(content) as T;
}
