import type {
  DashboardAdapter,
  DashboardAdapterConfig,
  DashboardMetrics,
  DashboardQuery,
  PanelDef,
  PanelRenderResult,
  QueryResult,
  TraceEvent,
} from './interface.js';

/**
 * "Real" adapter — points at a real Prometheus HTTP API. When
 * `PROMETHEUS_URL` is not set the adapter returns a `skipped` variant
 * whose every method records a `PROMETHEUS_ENV_MISSING` trace and throws
 * a distinguished error. Tests use this behaviour to short-circuit
 * gracefully — the fidelity report captures "environment absent" rather
 * than failing the whole suite in local dev.
 *
 * The real Prometheus driving is intentionally lazy — we do not eagerly
 * import a fetch polyfill because the harness is meant to be runnable
 * without a live Prometheus. When `PROMETHEUS_URL` is set but
 * `globalThis.fetch` is unavailable (older Node without fetch), the
 * adapter records `PROMETHEUS_FETCH_MISSING` traces — the same harness
 * path, one level closer to real IO.
 */

export interface RealAdapterEnv {
  prometheusUrl: string;
  timeoutMs: number;
}

export function detectRealEnv(): RealAdapterEnv | null {
  const url = process.env.PROMETHEUS_URL;
  if (!url) return null;
  const timeoutRaw = process.env.PROMETHEUS_TIMEOUT_MS;
  const timeoutMs = timeoutRaw ? Math.max(100, Number(timeoutRaw) || 5000) : 5000;
  return { prometheusUrl: url.replace(/\/$/, ''), timeoutMs };
}

/**
 * Distinguished error emitted when the real adapter is asked to run
 * without a live Prometheus URL, or when the runtime cannot reach it.
 */
export class SkippedError extends Error {
  readonly code:
    | 'PROMETHEUS_ENV_MISSING'
    | 'PROMETHEUS_HTTP_ERROR'
    | 'PROMETHEUS_FETCH_MISSING';
  constructor(op: string, code: SkippedError['code']) {
    super(`SkippedError(${code}): cannot execute ${op}`);
    this.code = code;
  }
}

export function makeRealAdapter(config: DashboardAdapterConfig): DashboardAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter(config, 'PROMETHEUS_ENV_MISSING');
  return makeLiveRealAdapter(config, env);
}

function makeSkippedRealAdapter(
  config: DashboardAdapterConfig,
  kind: 'PROMETHEUS_ENV_MISSING',
): DashboardAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: kind });
    throw new SkippedError(op, kind);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    runQuery: async () => unsupported<QueryResult>('runQuery'),
    refreshDashboard: async () => unsupported<PanelRenderResult[]>('refreshDashboard'),
    getRefreshCount: () => 0,
    getPanel: () => undefined,
    metrics: () => ({
      queryCount: 0,
      refreshCount: 0,
      queryLatencySamplesMs: [],
      refreshLatencySamplesMs: [],
      requests: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

/**
 * Live real adapter — talks to a Prometheus instant-query endpoint (
 * `GET {url}/api/v1/query?query=<promql>`) and folds the resulting vector
 * into the same aggregated numeric shape the mock produces. Because
 * Prometheus already aggregates server-side, the client-side aggregation
 * we apply on top is degenerate for a single scalar / vector result and
 * mostly acts as a safety net.
 */
function makeLiveRealAdapter(
  config: DashboardAdapterConfig,
  env: RealAdapterEnv,
): DashboardAdapter {
  const trace: TraceEvent[] = [];
  const queryLatencySamplesMs: number[] = [];
  const refreshLatencySamplesMs: number[] = [];
  const lastResults = new Map<string, PanelRenderResult>();
  let queryCount = 0;
  let refreshCount = 0;
  let requestCount = 0;

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function fetchInstantQuery(promql: string): Promise<{
    value: number;
    matchedSamples: number;
    latencyMs: number;
  }> {
    if (typeof globalThis.fetch !== 'function') {
      throw new SkippedError('runQuery', 'PROMETHEUS_FETCH_MISSING');
    }
    const start = Date.now();
    const url = `${env.prometheusUrl}/api/v1/query?query=${encodeURIComponent(promql)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        throw new SkippedError('runQuery', 'PROMETHEUS_HTTP_ERROR');
      }
      const body = (await res.json()) as PrometheusInstantResponse;
      if (body.status !== 'success') {
        throw new SkippedError('runQuery', 'PROMETHEUS_HTTP_ERROR');
      }
      const { value, matchedSamples } = foldInstantVector(body);
      return { value, matchedSamples, latencyMs };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async runQuery(query: DashboardQuery): Promise<QueryResult> {
      const promql = queryToPromQL(query);
      requestCount += 1;
      queryCount += 1;
      try {
        const { value, matchedSamples, latencyMs } = await fetchInstantQuery(promql);
        queryLatencySamplesMs.push(latencyMs);
        record('runQuery', true, { detail: query.metricName });
        return {
          metricName: query.metricName,
          value,
          matchedSamples,
          latencyMs,
        };
      } catch (err) {
        const kind =
          err instanceof SkippedError
            ? err.code
            : 'PROMETHEUS_HTTP_ERROR';
        record('runQuery', false, { errorKind: kind });
        throw err instanceof SkippedError ? err : new SkippedError('runQuery', kind);
      }
    },

    async refreshDashboard(): Promise<PanelRenderResult[]> {
      const start = Date.now();
      requestCount += 1;
      refreshCount += 1;
      const rendered: PanelRenderResult[] = [];
      for (const panel of config.panels) {
        try {
          const q = queryToPromQL(panel.query);
          const { value, matchedSamples } = await fetchInstantQuery(q);
          const badge = pickBadge(value, panel.thresholds);
          const refreshedAt = Date.now();
          const rp: PanelRenderResult = {
            panelId: panel.id,
            title: panel.title,
            chartType: panel.chartType,
            value,
            matchedSamples,
            badge,
            refreshedAt,
          };
          rendered.push(rp);
          lastResults.set(panel.id, rp);
        } catch (err) {
          const kind =
            err instanceof SkippedError
              ? err.code
              : 'PROMETHEUS_HTTP_ERROR';
          record('refreshDashboard', false, {
            errorKind: kind,
            detail: `panel=${panel.id}`,
          });
          throw err instanceof SkippedError
            ? err
            : new SkippedError('refreshDashboard', kind);
        }
      }
      const latencyMs = Date.now() - start;
      refreshLatencySamplesMs.push(latencyMs);
      record('refreshDashboard', true, { detail: `panels=${rendered.length}` });
      return rendered;
    },

    getRefreshCount(): number {
      return refreshCount;
    },

    getPanel(panelId: string): PanelRenderResult | undefined {
      return lastResults.get(panelId);
    },

    metrics(): DashboardMetrics {
      return {
        queryCount,
        refreshCount,
        queryLatencySamplesMs: [...queryLatencySamplesMs],
        refreshLatencySamplesMs: [...refreshLatencySamplesMs],
        requests: requestCount,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      queryLatencySamplesMs.length = 0;
      refreshLatencySamplesMs.length = 0;
      lastResults.clear();
      queryCount = 0;
      refreshCount = 0;
      requestCount = 0;
    },
  };
}

interface PrometheusInstantResponse {
  status: 'success' | 'error';
  data?: {
    resultType: 'vector' | 'scalar' | 'matrix' | 'string';
    result: Array<{
      metric: Record<string, string>;
      value?: [number, string];
      values?: Array<[number, string]>;
    }> | [number, string];
  };
}

function foldInstantVector(body: PrometheusInstantResponse): {
  value: number;
  matchedSamples: number;
} {
  if (!body.data) return { value: 0, matchedSamples: 0 };
  const { data } = body;
  if (data.resultType === 'scalar' && Array.isArray(data.result)) {
    const scalar = data.result as unknown as [number, string];
    const raw = Number(scalar[1]);
    return { value: Number.isFinite(raw) ? raw : 0, matchedSamples: 1 };
  }
  if (data.resultType === 'vector' && Array.isArray(data.result)) {
    const samples = data.result as Array<{
      metric: Record<string, string>;
      value?: [number, string];
    }>;
    if (samples.length === 0) return { value: 0, matchedSamples: 0 };
    const first = samples[0]?.value;
    const raw = first ? Number(first[1]) : 0;
    return {
      value: Number.isFinite(raw) ? raw : 0,
      matchedSamples: samples.length,
    };
  }
  return { value: 0, matchedSamples: 0 };
}

/**
 * Compile the provider-neutral {@link DashboardQuery} into a PromQL
 * instant query. The dogfood pins to a minimal subset (aggregation
 * operator + optional label filter) because the mock aggregations map
 * 1:1 to Prometheus aggregation operators.
 */
export function queryToPromQL(query: DashboardQuery): string {
  const labelSelector = query.labels
    ? `{${Object.entries(query.labels)
        .map(([k, v]) => `${k}="${escapeLabelValue(v)}"`)
        .join(',')}}`
    : '';
  const selector = `${query.metricName}${labelSelector}`;
  switch (query.aggregation) {
    case 'sum':
      return `sum(${selector})`;
    case 'avg':
      return `avg(${selector})`;
    case 'max':
      return `max(${selector})`;
    case 'min':
      return `min(${selector})`;
    case 'count':
      return `count(${selector})`;
    case 'last':
      // Prometheus does not have a distinct `last` operator on instant
      // queries — the instant vector already returns the most-recent
      // sample per series, so `sum` over the vector is safe when the
      // caller expects a single scalar.
      return `sum(${selector})`;
    default: {
      const _exhaustive: never = query.aggregation;
      return _exhaustive;
    }
  }
}

function escapeLabelValue(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function pickBadge(
  value: number,
  thresholds: PanelDef['thresholds'],
): 'ok' | 'warn' | 'critical' | null {
  if (!thresholds || thresholds.length === 0) return null;
  for (const t of thresholds) {
    if (compare(value, t.operator, t.value)) return t.label;
  }
  return null;
}

function compare(
  a: number,
  op: 'gt' | 'gte' | 'lt' | 'lte' | 'eq',
  b: number,
): boolean {
  switch (op) {
    case 'gt':
      return a > b;
    case 'gte':
      return a >= b;
    case 'lt':
      return a < b;
    case 'lte':
      return a <= b;
    case 'eq':
      return a === b;
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}
