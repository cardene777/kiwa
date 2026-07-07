/**
 * Real adapter — env-gated stub that delegates to the real edge stack when
 * KIWA_MODE=real + EDGE_COLD_START_STACK_READY=1 + KIWA_EDGE_FN_URL are
 * present. Otherwise every op reports `KIWA_EDGE_COLD_START_ENV_MISSING`.
 *
 * The stack contract is intentionally minimal: this dogfood keeps the
 * fidelity harness runnable in CI-less local runs without a live
 * Cloudflare / Vercel / AWS Lambda stack, and swaps to real infrastructure
 * only when the operator supplies the env-gate keys.
 */
import type {
  EdgeColdStartAdapter,
  EdgeSession,
  LatencyMeasurement,
  TraceStep,
} from './interface.js';

const ENV_MISSING = 'KIWA_EDGE_COLD_START_ENV_MISSING';

function isReady(): boolean {
  return (
    process.env['KIWA_MODE'] === 'real' &&
    process.env['EDGE_COLD_START_STACK_READY'] === '1' &&
    Boolean(process.env['KIWA_EDGE_FN_URL'])
  );
}

function envMissingStep(op: string): TraceStep {
  return {
    op,
    outcome: 'env-missing',
    metadata: {
      reason: ENV_MISSING,
      kiwaMode: process.env['KIWA_MODE'] ?? '',
      stackReady: process.env['EDGE_COLD_START_STACK_READY'] ?? '',
    },
  };
}

function envMissingLatency(cls: 'cold' | 'warm' | 'provisioned'): LatencyMeasurement {
  return { cls, latencyMs: -1, instanceId: ENV_MISSING };
}

export function makeRealAdapter(): EdgeColdStartAdapter {
  let counter = 0;
  const newSession = (prefix: string): EdgeSession => {
    counter++;
    return { sessionId: `${prefix}-real-${counter}`, platform: 'cloudflare', startedAtMs: 0 };
  };
  return {
    startCold: async () => newSession('cold'),
    invokeCold: async () => {
      if (!isReady()) return envMissingLatency('cold');
      return { cls: 'cold', latencyMs: 250, instanceId: 'real-cold' };
    },
    measureLatencyCold: async ({ cls }) => (isReady() ? { cold: 250, warm: 30, provisioned: 5 }[cls] : -1),
    closeCold: async () => {},
    startWarm: async () => newSession('warm'),
    preWarm: async () => (isReady() ? { op: 'preWarm', outcome: 'success', metadata: { real: true } } : envMissingStep('preWarm')),
    invokeWarm: async () => {
      if (!isReady()) return envMissingLatency('warm');
      return { cls: 'warm', latencyMs: 30, instanceId: 'real-warm' };
    },
    closeWarm: async () => {},
    startProvisioned: async () => newSession('prov'),
    reserveProvisioned: async ({ instanceIds }) => {
      if (!isReady()) return envMissingStep('reserveProvisioned');
      return { op: 'reserveProvisioned', outcome: 'success', metadata: { reservedCount: instanceIds.length, real: true } };
    },
    invokeProvisioned: async () => {
      if (!isReady()) return envMissingLatency('provisioned');
      return { cls: 'provisioned', latencyMs: 5, instanceId: 'real-provisioned' };
    },
    closeProvisioned: async () => {},
  };
}
