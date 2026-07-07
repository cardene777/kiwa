import { describe, expect, it } from 'vitest';
import {
  apiKeyEnvVar,
  buildRealDriverConfig,
  explicitEnvKey,
  isKiwaModeReal,
  resolveApiKey,
  resolveSearchEndpoint,
  skipUnlessReal,
  type SearchBackend,
} from '../src/index.js';

const backends: SearchBackend[] = ['meilisearch', 'typesense', 'algolia', 'opensearch-oss'];

describe('real-driver env-gate', () => {
  it('isKiwaModeReal returns false by default', () => {
    expect(isKiwaModeReal({} as NodeJS.ProcessEnv)).toBe(false);
  });

  it('isKiwaModeReal returns true when KIWA_MODE=real', () => {
    expect(isKiwaModeReal({ KIWA_MODE: 'real' } as unknown as NodeJS.ProcessEnv)).toBe(true);
  });

  it('resolveSearchEndpoint uses default host + port when env unset', () => {
    for (const backend of backends) {
      const url = resolveSearchEndpoint(backend, {} as NodeJS.ProcessEnv);
      expect(url).toMatch(/^https?:\/\/127\.0\.0\.1:\d+$/);
    }
  });

  it('resolveSearchEndpoint honors explicit env override', () => {
    const url = resolveSearchEndpoint(
      'meilisearch',
      { KIWA_MEILI_URL: 'https://mycluster.example.com:7700' } as unknown as NodeJS.ProcessEnv,
    );
    expect(url).toBe('https://mycluster.example.com:7700');
  });

  it('resolveSearchEndpoint honors KIWA_SEARCH_HOST', () => {
    const url = resolveSearchEndpoint(
      'meilisearch',
      { KIWA_SEARCH_HOST: 'search.internal' } as unknown as NodeJS.ProcessEnv,
    );
    expect(url).toBe('http://search.internal:7700');
  });

  it('algolia default uses https', () => {
    const url = resolveSearchEndpoint('algolia', {} as NodeJS.ProcessEnv);
    expect(url).toMatch(/^https:\/\//);
  });

  it('explicitEnvKey covers each backend', () => {
    const expected: Record<SearchBackend, string> = {
      meilisearch: 'KIWA_MEILI_URL',
      typesense: 'KIWA_TYPESENSE_URL',
      algolia: 'KIWA_ALGOLIA_URL',
      'opensearch-oss': 'KIWA_OPENSEARCH_URL',
    };
    for (const backend of backends) {
      expect(explicitEnvKey(backend)).toBe(expected[backend]);
    }
  });

  it('apiKeyEnvVar covers each backend', () => {
    const expected: Record<SearchBackend, string> = {
      meilisearch: 'MEILI_KEY',
      typesense: 'TYPESENSE_KEY',
      algolia: 'ALGOLIA_KEY',
      'opensearch-oss': 'OPENSEARCH_KEY',
    };
    for (const backend of backends) {
      expect(apiKeyEnvVar(backend)).toBe(expected[backend]);
    }
  });

  it('resolveApiKey returns null when env var unset', () => {
    for (const backend of backends) {
      expect(resolveApiKey(backend, {} as NodeJS.ProcessEnv)).toBeNull();
    }
  });

  it('resolveApiKey returns key when env var set', () => {
    for (const backend of backends) {
      const env = { [apiKeyEnvVar(backend)]: 'secret-abc' } as unknown as NodeJS.ProcessEnv;
      expect(resolveApiKey(backend, env)).toBe('secret-abc');
    }
  });

  it('buildRealDriverConfig fills defaults', () => {
    const cfg = buildRealDriverConfig('meilisearch', {}, {} as NodeJS.ProcessEnv);
    expect(cfg.backend).toBe('meilisearch');
    expect(cfg.endpoint).toBe('http://127.0.0.1:7700');
    expect(cfg.apiKey).toBeNull();
    expect(cfg.timeoutMs).toBe(5000);
  });

  it('buildRealDriverConfig honors overrides', () => {
    const cfg = buildRealDriverConfig(
      'typesense',
      { endpoint: 'http://ci-node:8108', apiKey: 'override-key', timeoutMs: 10_000 },
      {} as NodeJS.ProcessEnv,
    );
    expect(cfg.endpoint).toBe('http://ci-node:8108');
    expect(cfg.apiKey).toBe('override-key');
    expect(cfg.timeoutMs).toBe(10_000);
  });

  it('buildRealDriverConfig honors KIWA_SEARCH_TIMEOUT_MS', () => {
    const cfg = buildRealDriverConfig(
      'algolia',
      {},
      { KIWA_SEARCH_TIMEOUT_MS: '7500' } as unknown as NodeJS.ProcessEnv,
    );
    expect(cfg.timeoutMs).toBe(7500);
  });

  it('skipUnlessReal returns skip=true when KIWA_MODE unset', () => {
    const r = skipUnlessReal({} as NodeJS.ProcessEnv);
    expect(r.skip).toBe(true);
    expect(r.reason).toMatch(/KIWA_MODE!=real/);
  });

  it('skipUnlessReal returns skip=false when KIWA_MODE=real', () => {
    const r = skipUnlessReal({ KIWA_MODE: 'real' } as unknown as NodeJS.ProcessEnv);
    expect(r.skip).toBe(false);
    expect(r.reason).toMatch(/detected/);
  });
});
