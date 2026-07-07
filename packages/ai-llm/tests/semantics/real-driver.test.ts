import { describe, expect, it } from 'vitest';
import {
  apiKeyEnvVar,
  buildRealDriverConfig,
  chargeBudget,
  endpointEnvKey,
  isKiwaModeReal,
  resolveApiKey,
  resolveBudgetGuard,
  resolveLlmEndpoint,
  skipUnlessReal,
  type LlmBackend,
} from '../../src/semantics/index.js';

const ALL_BACKENDS: LlmBackend[] = ['anthropic', 'openai', 'vercel-ai', 'langchain'];

describe('isKiwaModeReal', () => {
  it('true when KIWA_MODE=real', () => {
    expect(isKiwaModeReal({ KIWA_MODE: 'real' })).toBe(true);
  });

  it('false when KIWA_MODE not set', () => {
    expect(isKiwaModeReal({})).toBe(false);
  });

  it.each(['mock', 'stub', 'dev', ''] as const)('false for KIWA_MODE=%s', (v) => {
    expect(isKiwaModeReal({ KIWA_MODE: v })).toBe(false);
  });
});

describe('resolveLlmEndpoint', () => {
  it.each(ALL_BACKENDS)('%s falls back to default HTTPS host', (backend) => {
    const url = resolveLlmEndpoint(backend, {});
    expect(url.startsWith('https://')).toBe(true);
  });

  it('anthropic explicit env override', () => {
    const url = resolveLlmEndpoint('anthropic', { KIWA_ANTHROPIC_URL: 'https://custom.example' });
    expect(url).toBe('https://custom.example');
  });

  it('openai explicit env override', () => {
    const url = resolveLlmEndpoint('openai', { KIWA_OPENAI_URL: 'https://oai.example' });
    expect(url).toBe('https://oai.example');
  });
});

describe('endpointEnvKey / apiKeyEnvVar', () => {
  it.each([
    ['anthropic', 'KIWA_ANTHROPIC_URL', 'ANTHROPIC_API_KEY'],
    ['openai', 'KIWA_OPENAI_URL', 'OPENAI_API_KEY'],
    ['vercel-ai', 'KIWA_VERCEL_AI_URL', 'OPENAI_API_KEY'],
    ['langchain', 'KIWA_LANGCHAIN_URL', 'OPENAI_API_KEY'],
  ] as const)('%s → %s / %s', (backend, envKey, keyVar) => {
    expect(endpointEnvKey(backend)).toBe(envKey);
    expect(apiKeyEnvVar(backend)).toBe(keyVar);
  });
});

describe('resolveApiKey', () => {
  it('returns key when env is set', () => {
    expect(resolveApiKey('anthropic', { ANTHROPIC_API_KEY: 'sk-anthropic-test' })).toBe(
      'sk-anthropic-test',
    );
  });

  it('returns null when env absent', () => {
    expect(resolveApiKey('anthropic', {})).toBeNull();
  });

  it('returns null when env is empty string', () => {
    expect(resolveApiKey('openai', { OPENAI_API_KEY: '' })).toBeNull();
  });
});

describe('resolveBudgetGuard', () => {
  it('defaults to $5 limit and $0.5 per-call cap', () => {
    const g = resolveBudgetGuard({});
    expect(g.limitUsd).toBe(5.0);
    expect(g.perCallCapUsd).toBe(0.5);
    expect(g.spentUsd).toBe(0);
  });

  it('honors KIWA_LLM_BUDGET_USD override', () => {
    const g = resolveBudgetGuard({ KIWA_LLM_BUDGET_USD: '12.5' });
    expect(g.limitUsd).toBe(12.5);
  });

  it('honors KIWA_LLM_PER_CALL_CAP_USD override', () => {
    const g = resolveBudgetGuard({ KIWA_LLM_PER_CALL_CAP_USD: '0.05' });
    expect(g.perCallCapUsd).toBe(0.05);
  });

  it('throws when budget is negative', () => {
    expect(() => resolveBudgetGuard({ KIWA_LLM_BUDGET_USD: '-1' })).toThrow('non-negative');
  });

  it('throws when per-call cap is negative', () => {
    expect(() => resolveBudgetGuard({ KIWA_LLM_PER_CALL_CAP_USD: '-1' })).toThrow('non-negative');
  });

  it('throws when budget is not a number', () => {
    expect(() => resolveBudgetGuard({ KIWA_LLM_BUDGET_USD: 'abc' })).toThrow('non-negative number');
  });
});

describe('chargeBudget', () => {
  it('allows spending within budget and cap', () => {
    const g = resolveBudgetGuard({ KIWA_LLM_BUDGET_USD: '5', KIWA_LLM_PER_CALL_CAP_USD: '1' });
    const r = chargeBudget(g, 0.3);
    expect(r.allowed).toBe(true);
    expect(g.spentUsd).toBe(0.3);
  });

  it('rejects when per-call cap exceeded', () => {
    const g = resolveBudgetGuard({ KIWA_LLM_BUDGET_USD: '5', KIWA_LLM_PER_CALL_CAP_USD: '0.1' });
    const r = chargeBudget(g, 1.0);
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('per-call cap');
    expect(g.spentUsd).toBe(0);
  });

  it('rejects when total budget exceeded', () => {
    const g = resolveBudgetGuard({ KIWA_LLM_BUDGET_USD: '1', KIWA_LLM_PER_CALL_CAP_USD: '1' });
    chargeBudget(g, 0.8);
    const r = chargeBudget(g, 0.5);
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('budget');
  });

  it('rejects negative cost', () => {
    const g = resolveBudgetGuard({});
    const r = chargeBudget(g, -1);
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('negative cost');
  });

  it('remaining calculated correctly', () => {
    const g = resolveBudgetGuard({ KIWA_LLM_BUDGET_USD: '10', KIWA_LLM_PER_CALL_CAP_USD: '5' });
    chargeBudget(g, 3);
    const r = chargeBudget(g, 2);
    expect(r.remaining).toBe(5);
  });
});

describe('buildRealDriverConfig', () => {
  it.each(ALL_BACKENDS)('%s builds config with all fields', (backend) => {
    const cfg = buildRealDriverConfig(backend, {}, { KIWA_MODE: 'real', OPENAI_API_KEY: 'k', ANTHROPIC_API_KEY: 'k' });
    expect(cfg.backend).toBe(backend);
    expect(cfg.endpoint.length).toBeGreaterThan(0);
    expect(cfg.budget.limitUsd).toBeGreaterThan(0);
    expect(cfg.timeoutMs).toBeGreaterThan(0);
  });

  it('honors overrides for endpoint and timeout', () => {
    const cfg = buildRealDriverConfig(
      'anthropic',
      { endpoint: 'https://custom', timeoutMs: 60000 },
      {},
    );
    expect(cfg.endpoint).toBe('https://custom');
    expect(cfg.timeoutMs).toBe(60000);
  });

  it('override apiKey explicitly to null suppresses env lookup', () => {
    const cfg = buildRealDriverConfig(
      'anthropic',
      { apiKey: null },
      { ANTHROPIC_API_KEY: 'sk-test' },
    );
    expect(cfg.apiKey).toBeNull();
  });

  it('KIWA_LLM_TIMEOUT_MS env override', () => {
    const cfg = buildRealDriverConfig('anthropic', {}, { KIWA_LLM_TIMEOUT_MS: '45000' });
    expect(cfg.timeoutMs).toBe(45000);
  });
});

describe('skipUnlessReal', () => {
  it('skip=false when KIWA_MODE=real', () => {
    const r = skipUnlessReal({ KIWA_MODE: 'real' });
    expect(r.skip).toBe(false);
    expect(r.reason).toContain('real detected');
  });

  it('skip=true when not real', () => {
    const r = skipUnlessReal({});
    expect(r.skip).toBe(true);
    expect(r.reason).toContain('skip real-driver tests');
  });
});

// Real driver gated tests - skipped unless KIWA_MODE=real
describe.skipIf(!isKiwaModeReal(process.env))('real driver — anthropic', () => {
  it('resolves anthropic endpoint with production URL', () => {
    const url = resolveLlmEndpoint('anthropic', process.env);
    expect(url).toContain('anthropic.com');
  });

  it('has ANTHROPIC_API_KEY available', () => {
    const key = resolveApiKey('anthropic', process.env);
    expect(key).not.toBeNull();
  });
});

describe.skipIf(!isKiwaModeReal(process.env))('real driver — openai', () => {
  it('resolves openai endpoint', () => {
    const url = resolveLlmEndpoint('openai', process.env);
    expect(url).toContain('openai.com');
  });

  it('has OPENAI_API_KEY available', () => {
    const key = resolveApiKey('openai', process.env);
    expect(key).not.toBeNull();
  });
});
