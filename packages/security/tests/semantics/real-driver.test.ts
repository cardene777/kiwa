import { describe, expect, it } from 'vitest';
import {
  ADV_API_KEY_ENV_KEY,
  ADV_ENDPOINT_ENV_KEY,
  ADV_REQUIRED_KEYS,
  buildAdvRealDriverConfig,
  isKiwaAdvModeReal,
  resolveAdvApiKey,
  resolveAdvEndpoint,
  resolveAdvRealDriver,
  skipUnlessAdvReal,
} from '../../src/semantics/index.js';

describe('isKiwaAdvModeReal', () => {
  it('true when KIWA_MODE=real', () => {
    expect(isKiwaAdvModeReal({ KIWA_MODE: 'real' })).toBe(true);
  });

  it('false when unset', () => {
    expect(isKiwaAdvModeReal({})).toBe(false);
  });

  it('false for other mode value', () => {
    expect(isKiwaAdvModeReal({ KIWA_MODE: 'mock' })).toBe(false);
  });
});

describe('resolveAdvRealDriver', () => {
  it('mock when KIWA_MODE not real', () => {
    const r = resolveAdvRealDriver({ provider: 'istio', env: {} });
    expect(r.useRealDriver).toBe(false);
    expect(r.reason).toContain('KIWA_MODE!=real');
  });

  it('real when all istio keys present', () => {
    const r = resolveAdvRealDriver({
      provider: 'istio',
      env: { KIWA_MODE: 'real', KIWA_ISTIO_URL: 'https://istio' },
    });
    expect(r.useRealDriver).toBe(true);
    expect(r.missingKeys).toEqual([]);
  });

  it('reports missing keys for splunk', () => {
    const r = resolveAdvRealDriver({
      provider: 'siem-splunk',
      env: { KIWA_MODE: 'real', KIWA_SPLUNK_HEC_URL: 'https://hec' },
    });
    expect(r.useRealDriver).toBe(false);
    expect(r.missingKeys).toContain('KIWA_SPLUNK_HEC_TOKEN');
  });

  it('supports vault provider', () => {
    const r = resolveAdvRealDriver({
      provider: 'vault',
      env: {
        KIWA_MODE: 'real',
        KIWA_VAULT_URL: 'https://vault',
        KIWA_VAULT_TOKEN: 'root',
      },
    });
    expect(r.useRealDriver).toBe(true);
  });
});

describe('resolveAdvEndpoint', () => {
  it('returns endpoint for istio', () => {
    expect(resolveAdvEndpoint('istio', { KIWA_ISTIO_URL: 'https://istio' })).toBe(
      'https://istio',
    );
  });

  it('returns null when unset', () => {
    expect(resolveAdvEndpoint('opa', {})).toBeNull();
  });
});

describe('resolveAdvApiKey', () => {
  it('returns key for vault', () => {
    expect(resolveAdvApiKey('vault', { KIWA_VAULT_TOKEN: 'root' })).toBe('root');
  });

  it('returns null for missing key', () => {
    expect(resolveAdvApiKey('vault', {})).toBeNull();
  });
});

describe('buildAdvRealDriverConfig', () => {
  it('returns full config for istio', () => {
    const cfg = buildAdvRealDriverConfig('istio', {
      KIWA_MODE: 'real',
      KIWA_ISTIO_URL: 'https://istio',
      KIWA_ISTIO_TOKEN: 'tok',
    });
    expect(cfg.provider).toBe('istio');
    expect(cfg.endpoint).toBe('https://istio');
    expect(cfg.apiKey).toBe('tok');
    expect(cfg.timeoutMs).toBe(15000);
  });

  it('respects custom timeout', () => {
    const cfg = buildAdvRealDriverConfig('istio', {
      KIWA_SEC_ADV_TIMEOUT_MS: '5000',
    });
    expect(cfg.timeoutMs).toBe(5000);
  });
});

describe('skipUnlessAdvReal', () => {
  it('skips when KIWA_MODE not real', () => {
    const r = skipUnlessAdvReal('istio', {});
    expect(r.skip).toBe(true);
  });

  it('does not skip when real', () => {
    const r = skipUnlessAdvReal('istio', {
      KIWA_MODE: 'real',
      KIWA_ISTIO_URL: 'https://istio',
    });
    expect(r.skip).toBe(false);
  });
});

describe('env key mappings', () => {
  it('ADV_ENDPOINT_ENV_KEY covers all 4 providers', () => {
    expect(Object.keys(ADV_ENDPOINT_ENV_KEY)).toHaveLength(4);
  });

  it('ADV_API_KEY_ENV_KEY covers all 4 providers', () => {
    expect(Object.keys(ADV_API_KEY_ENV_KEY)).toHaveLength(4);
  });

  it('ADV_REQUIRED_KEYS every provider requires KIWA_MODE', () => {
    for (const keys of Object.values(ADV_REQUIRED_KEYS)) {
      expect(keys).toContain('KIWA_MODE');
    }
  });
});
