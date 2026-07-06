/**
 * Real driver env-gate for observability v2.1.
 *
 * Provides KIWA_MODE=real-based helpers for testing against actual observability
 * backends (Grafana OSS + Prometheus + Loki + OpenTelemetry Collector). Consumers
 * gate a describe block on `isKiwaModeReal()`, and use `resolveObservabilityEndpoint()`
 * to fetch backend URLs. When KIWA_MODE != 'real', tests should skip.
 */

export type ObservabilityBackend = 'grafana-oss' | 'prometheus' | 'loki' | 'otel-collector';

const DEFAULT_PORTS: Record<ObservabilityBackend, number> = {
  'grafana-oss': 3000,
  prometheus: 9090,
  loki: 3100,
  'otel-collector': 4318,
};

export function isKiwaModeReal(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.KIWA_MODE === 'real';
}

export function resolveObservabilityEndpoint(
  backend: ObservabilityBackend,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const explicit = env[explicitEnvKey(backend)];
  if (explicit && explicit.length > 0) {
    return explicit;
  }
  const host = env.KIWA_OBSERVABILITY_HOST ?? '127.0.0.1';
  return `http://${host}:${DEFAULT_PORTS[backend]}`;
}

export function explicitEnvKey(backend: ObservabilityBackend): string {
  switch (backend) {
    case 'grafana-oss':
      return 'KIWA_GRAFANA_URL';
    case 'prometheus':
      return 'KIWA_PROMETHEUS_URL';
    case 'loki':
      return 'KIWA_LOKI_URL';
    case 'otel-collector':
      return 'KIWA_OTEL_COLLECTOR_URL';
  }
}

export interface RealDriverConfig {
  backend: ObservabilityBackend;
  endpoint: string;
  timeoutMs: number;
}

export function buildRealDriverConfig(
  backend: ObservabilityBackend,
  overrides: Partial<Omit<RealDriverConfig, 'backend'>> = {},
  env: NodeJS.ProcessEnv = process.env,
): RealDriverConfig {
  return {
    backend,
    endpoint: overrides.endpoint ?? resolveObservabilityEndpoint(backend, env),
    timeoutMs: overrides.timeoutMs ?? Number(env.KIWA_OBSERVABILITY_TIMEOUT_MS ?? 5000),
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
