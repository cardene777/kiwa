/**
 * Real driver env-gate for search v0.3.
 *
 * Provides KIWA_MODE=real-based helpers for testing against actual search
 * backends (Meilisearch + Typesense + Algolia + OpenSearch OSS). Consumers
 * gate a describe block on `isKiwaModeReal()`, and use `resolveSearchEndpoint()`
 * to fetch backend URLs. When KIWA_MODE != 'real', tests should skip.
 */

export type SearchBackend = 'meilisearch' | 'typesense' | 'algolia' | 'opensearch-oss';

const DEFAULT_PORTS: Record<SearchBackend, number> = {
  meilisearch: 7700,
  typesense: 8108,
  algolia: 443,
  'opensearch-oss': 9200,
};

export function isKiwaModeReal(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.KIWA_MODE === 'real';
}

export function resolveSearchEndpoint(
  backend: SearchBackend,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const explicit = env[explicitEnvKey(backend)];
  if (explicit && explicit.length > 0) {
    return explicit;
  }
  const host = env.KIWA_SEARCH_HOST ?? '127.0.0.1';
  const protocol = backend === 'algolia' ? 'https' : 'http';
  return `${protocol}://${host}:${DEFAULT_PORTS[backend]}`;
}

export function explicitEnvKey(backend: SearchBackend): string {
  switch (backend) {
    case 'meilisearch':
      return 'KIWA_MEILI_URL';
    case 'typesense':
      return 'KIWA_TYPESENSE_URL';
    case 'algolia':
      return 'KIWA_ALGOLIA_URL';
    case 'opensearch-oss':
      return 'KIWA_OPENSEARCH_URL';
  }
}

export function apiKeyEnvVar(backend: SearchBackend): string {
  switch (backend) {
    case 'meilisearch':
      return 'MEILI_KEY';
    case 'typesense':
      return 'TYPESENSE_KEY';
    case 'algolia':
      return 'ALGOLIA_KEY';
    case 'opensearch-oss':
      return 'OPENSEARCH_KEY';
  }
}

export function resolveApiKey(
  backend: SearchBackend,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const key = env[apiKeyEnvVar(backend)];
  return key && key.length > 0 ? key : null;
}

export interface RealDriverConfig {
  backend: SearchBackend;
  endpoint: string;
  apiKey: string | null;
  timeoutMs: number;
}

export function buildRealDriverConfig(
  backend: SearchBackend,
  overrides: Partial<Omit<RealDriverConfig, 'backend'>> = {},
  env: NodeJS.ProcessEnv = process.env,
): RealDriverConfig {
  return {
    backend,
    endpoint: overrides.endpoint ?? resolveSearchEndpoint(backend, env),
    apiKey: overrides.apiKey !== undefined ? overrides.apiKey : resolveApiKey(backend, env),
    timeoutMs: overrides.timeoutMs ?? Number(env.KIWA_SEARCH_TIMEOUT_MS ?? 5000),
  };
}

export function skipUnlessReal(env: NodeJS.ProcessEnv = process.env): {
  skip: boolean;
  reason: string;
} {
  if (isKiwaModeReal(env)) {
    return { skip: false, reason: 'KIWA_MODE=real detected' };
  }
  return {
    skip: true,
    reason: 'KIWA_MODE!=real — skip real-driver tests (mock semantics apply)',
  };
}
