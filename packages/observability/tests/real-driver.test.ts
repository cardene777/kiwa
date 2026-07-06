import { describe, expect, it } from 'vitest';
import {
  buildRealDriverConfig,
  explicitEnvKey,
  isKiwaModeReal,
  resolveObservabilityEndpoint,
  skipUnlessReal,
  type ObservabilityBackend,
} from '../src/index.js';

describe('real-driver env-gate', () => {
  it('detects KIWA_MODE=real', () => {
    expect(isKiwaModeReal({ KIWA_MODE: 'real' } as NodeJS.ProcessEnv)).toBe(true);
    expect(isKiwaModeReal({ KIWA_MODE: 'mock' } as NodeJS.ProcessEnv)).toBe(false);
    expect(isKiwaModeReal({} as NodeJS.ProcessEnv)).toBe(false);
  });

  it('resolves endpoint from explicit env override', () => {
    const url = resolveObservabilityEndpoint(
      'prometheus',
      { KIWA_PROMETHEUS_URL: 'http://custom:9091' } as NodeJS.ProcessEnv,
    );
    expect(url).toBe('http://custom:9091');
  });

  it('resolves endpoint from KIWA_OBSERVABILITY_HOST default', () => {
    const url = resolveObservabilityEndpoint(
      'grafana-oss',
      { KIWA_OBSERVABILITY_HOST: 'example.com' } as NodeJS.ProcessEnv,
    );
    expect(url).toBe('http://example.com:3000');
  });

  it('resolves endpoint from localhost default when no env', () => {
    const url = resolveObservabilityEndpoint('loki', {} as NodeJS.ProcessEnv);
    expect(url).toBe('http://127.0.0.1:3100');
  });

  it('uses correct default ports per backend', () => {
    const cases: Array<[ObservabilityBackend, string]> = [
      ['grafana-oss', 'http://127.0.0.1:3000'],
      ['prometheus', 'http://127.0.0.1:9090'],
      ['loki', 'http://127.0.0.1:3100'],
      ['otel-collector', 'http://127.0.0.1:4318'],
    ];
    for (const [backend, expected] of cases) {
      expect(resolveObservabilityEndpoint(backend, {} as NodeJS.ProcessEnv)).toBe(expected);
    }
  });

  it('maps backend to explicit env key', () => {
    expect(explicitEnvKey('grafana-oss')).toBe('KIWA_GRAFANA_URL');
    expect(explicitEnvKey('prometheus')).toBe('KIWA_PROMETHEUS_URL');
    expect(explicitEnvKey('loki')).toBe('KIWA_LOKI_URL');
    expect(explicitEnvKey('otel-collector')).toBe('KIWA_OTEL_COLLECTOR_URL');
  });

  it('builds real driver config with overrides', () => {
    const cfg = buildRealDriverConfig('prometheus', { timeoutMs: 12_000 }, {} as NodeJS.ProcessEnv);
    expect(cfg.backend).toBe('prometheus');
    expect(cfg.timeoutMs).toBe(12_000);
  });

  it('builds real driver config with default timeout', () => {
    const cfg = buildRealDriverConfig('loki', {}, {} as NodeJS.ProcessEnv);
    expect(cfg.timeoutMs).toBe(5000);
  });

  it('honors KIWA_OBSERVABILITY_TIMEOUT_MS env override', () => {
    const cfg = buildRealDriverConfig(
      'loki',
      {},
      { KIWA_OBSERVABILITY_TIMEOUT_MS: '20000' } as NodeJS.ProcessEnv,
    );
    expect(cfg.timeoutMs).toBe(20_000);
  });

  it('skipUnlessReal returns skip=true when not real', () => {
    const result = skipUnlessReal({ KIWA_MODE: 'mock' } as NodeJS.ProcessEnv);
    expect(result.skip).toBe(true);
    expect(result.reason).toMatch(/KIWA_MODE!=real/);
  });

  it('skipUnlessReal returns skip=false when real', () => {
    const result = skipUnlessReal({ KIWA_MODE: 'real' } as NodeJS.ProcessEnv);
    expect(result.skip).toBe(false);
  });
});
