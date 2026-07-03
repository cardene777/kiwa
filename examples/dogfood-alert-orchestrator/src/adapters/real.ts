import type {
  AlertFireEvent,
  AlertOrchestratorAdapter,
  AlertOrchestratorConfig,
  AlertOrchestratorMetrics,
  EscalationDelivery,
  MetricSample,
  RouteDecision,
  TraceEvent,
} from './interface.js';
import { walkRoute } from '../routing/index.js';
import { SilenceStore } from '../silence/index.js';

/**
 * "Real" adapter — posts fires to a live Prometheus AlertManager HTTP
 * API (`POST {url}/api/v2/alerts`). When `ALERTMANAGER_URL` is not set,
 * the adapter returns a `skipped` variant whose every method records
 * `ALERTMANAGER_ENV_MISSING` and throws {@link SkippedError}. Tests use
 * this to short-circuit gracefully without failing the whole suite in
 * local dev.
 *
 * The real adapter still walks the routing tree + silence store
 * client-side — those are pure functions of the fire labels and do not
 * need AlertManager round-trips. The two ops that touch the network are
 * `routeAlert` (posts the alert to `/api/v2/alerts`) and
 * `evaluateRules` (fetches the active alert group via
 * `GET /api/v2/alerts`). `emitMetric` is a no-op on the real path
 * because Prometheus scrapes metrics on its own cadence — the trace
 * records `ALERTMANAGER_METRIC_NOOP` so the harness knows the mock op
 * does not have a real analog.
 */

export interface RealAdapterEnv {
  alertmanagerUrl: string;
  timeoutMs: number;
}

export function detectRealEnv(): RealAdapterEnv | null {
  const url = process.env.ALERTMANAGER_URL;
  if (!url) return null;
  const timeoutRaw = process.env.ALERTMANAGER_TIMEOUT_MS;
  const timeoutMs = timeoutRaw ? Math.max(100, Number(timeoutRaw) || 5000) : 5000;
  return { alertmanagerUrl: url.replace(/\/$/, ''), timeoutMs };
}

/**
 * Distinguished error emitted when the real adapter is asked to run
 * without a live AlertManager URL, or when the runtime cannot reach it.
 */
export class SkippedError extends Error {
  readonly code:
    | 'ALERTMANAGER_ENV_MISSING'
    | 'ALERTMANAGER_HTTP_ERROR'
    | 'ALERTMANAGER_FETCH_MISSING'
    | 'ALERTMANAGER_METRIC_NOOP';
  constructor(op: string, code: SkippedError['code']) {
    super(`SkippedError(${code}): cannot execute ${op}`);
    this.code = code;
  }
}

export function makeRealAdapter(config: AlertOrchestratorConfig): AlertOrchestratorAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter(config, 'ALERTMANAGER_ENV_MISSING');
  return makeLiveRealAdapter(config, env);
}

function makeSkippedRealAdapter(
  config: AlertOrchestratorConfig,
  kind: 'ALERTMANAGER_ENV_MISSING',
): AlertOrchestratorAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: kind });
    throw new SkippedError(op, kind);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    emitMetric: async () => {
      trace.push({ op: 'emitMetric', ok: false, errorKind: 'ALERTMANAGER_METRIC_NOOP' });
      // The real path never accepts metrics — Prometheus scrapes them.
      // The trace records the no-op so the harness can fold it into
      // divergences without failing the caller.
    },
    evaluateRules: async () => unsupported<AlertFireEvent[]>('evaluateRules'),
    routeAlert: async () => unsupported<RouteDecision>('routeAlert'),
    advanceEscalation: async () => unsupported<EscalationDelivery[]>('advanceEscalation'),
    getActive: () => [],
    metrics: () => ({
      evaluationCount: 0,
      routeCount: 0,
      escalationCount: 0,
      evaluationLatencySamplesMs: [],
      routingLatencySamplesMs: [],
      requests: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

/**
 * Live real adapter — talks to the AlertManager v2 REST API. Because
 * AlertManager owns silence state server-side, the client-side silence
 * store is only consulted when the caller explicitly hands one in via
 * the config (allowing the harness to diff mock vs real without an
 * AlertManager side lookup).
 */
function makeLiveRealAdapter(
  config: AlertOrchestratorConfig,
  env: RealAdapterEnv,
): AlertOrchestratorAdapter {
  const trace: TraceEvent[] = [];
  const evaluationLatencyMs: number[] = [];
  const routingLatencyMs: number[] = [];
  let evaluationCount = 0;
  let routeCount = 0;
  let escalationCount = 0;
  let requestCount = 0;
  const silenceStore = new SilenceStore(config.silences);

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function amFetch<T>(path: string, init?: RequestInit): Promise<T> {
    if (typeof globalThis.fetch !== 'function') {
      throw new SkippedError(path, 'ALERTMANAGER_FETCH_MISSING');
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.timeoutMs);
    try {
      const res = await fetch(`${env.alertmanagerUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new SkippedError(path, 'ALERTMANAGER_HTTP_ERROR');
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async emitMetric(sample: MetricSample): Promise<void> {
      // Prometheus scrapes metrics on its own cadence — no analog on the
      // real path. Record the noop so trace parity vs mock is honest.
      record('emitMetric', false, {
        errorKind: 'ALERTMANAGER_METRIC_NOOP',
        detail: sample.metricName,
      });
    },

    async evaluateRules(): Promise<AlertFireEvent[]> {
      const start = Date.now();
      evaluationCount += 1;
      requestCount += 1;
      try {
        const alerts = await amFetch<AlertManagerAlertResponse[]>('/api/v2/alerts');
        const latency = Date.now() - start;
        evaluationLatencyMs.push(latency);
        const fires: AlertFireEvent[] = alerts.map((a) => ({
          ruleId: a.labels['alertname'] ?? 'unknown',
          severity: (a.labels['severity'] as 'info' | 'warn' | 'critical') ?? 'info',
          labels: a.labels,
          value: Number(a.annotations?.['value'] ?? 0),
          firedAt: Date.parse(a.startsAt),
          state: a.status.state === 'active' ? 'firing' : 'resolved',
        }));
        record('evaluateRules', true, { detail: `fires=${fires.length}` });
        return fires;
      } catch (err) {
        const kind =
          err instanceof SkippedError ? err.code : 'ALERTMANAGER_HTTP_ERROR';
        record('evaluateRules', false, { errorKind: kind });
        throw err instanceof SkippedError ? err : new SkippedError('evaluateRules', kind);
      }
    },

    async routeAlert(fire: AlertFireEvent): Promise<RouteDecision> {
      const start = Date.now();
      const matchedAt = Date.now();
      const silence = silenceStore.isSilenced(fire, matchedAt);
      routeCount += 1;
      requestCount += 1;
      if (silence) {
        const latency = Date.now() - start;
        routingLatencyMs.push(latency);
        record('routeAlert', true, { detail: `silenced=${silence.id}` });
        return {
          ruleId: fire.ruleId,
          receiver: null,
          silenced: true,
          silenceId: silence.id,
          matchedAt,
        };
      }
      // POST the fire to AlertManager so it lands on the configured
      // routing tree server-side. The client-side receiver we compute
      // via walkRoute is only for parity checking vs mock.
      try {
        await amFetch<unknown>('/api/v2/alerts', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify([
            {
              labels: { alertname: fire.ruleId, ...fire.labels },
              annotations: { value: String(fire.value) },
              startsAt: new Date(fire.firedAt).toISOString(),
            },
          ]),
        });
        const receiver = walkRoute(config.route, fire.labels);
        const latency = Date.now() - start;
        routingLatencyMs.push(latency);
        record('routeAlert', true, { detail: `receiver=${receiver ?? 'none'}` });
        return {
          ruleId: fire.ruleId,
          receiver,
          silenced: false,
          matchedAt,
        };
      } catch (err) {
        const kind =
          err instanceof SkippedError ? err.code : 'ALERTMANAGER_HTTP_ERROR';
        record('routeAlert', false, { errorKind: kind });
        throw err instanceof SkippedError ? err : new SkippedError('routeAlert', kind);
      }
    },

    async advanceEscalation(): Promise<EscalationDelivery[]> {
      // Escalation is owned by AlertManager's server-side ladder —
      // the client-side walk we do in mock mode is only informative on
      // the real path. Report an empty delivery batch so the harness
      // records "no client-side deliveries" without contradicting
      // server-side state.
      requestCount += 1;
      record('advanceEscalation', true, { detail: 'server-owned' });
      return [];
    },

    getActive(): AlertFireEvent[] {
      return [];
    },

    metrics(): AlertOrchestratorMetrics {
      return {
        evaluationCount,
        routeCount,
        escalationCount,
        evaluationLatencySamplesMs: [...evaluationLatencyMs],
        routingLatencySamplesMs: [...routingLatencyMs],
        requests: requestCount,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      evaluationLatencyMs.length = 0;
      routingLatencyMs.length = 0;
      evaluationCount = 0;
      routeCount = 0;
      escalationCount = 0;
      requestCount = 0;
    },
  };
}

interface AlertManagerAlertResponse {
  labels: Record<string, string>;
  annotations?: Record<string, string>;
  startsAt: string;
  status: { state: 'active' | 'suppressed' | 'unprocessed' };
}
