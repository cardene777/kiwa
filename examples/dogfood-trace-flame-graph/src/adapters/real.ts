import type {
  AdapterLog,
  AdapterSpan,
  FlameExplorerAdapter,
  FlameExplorerConfig,
  FlameExplorerMetrics,
  FlameGraphNode,
  FlameNameStats,
  LoadedTrace,
  LogJoinEntry,
  TraceEvent,
} from './interface.js';

/**
 * "Real" adapter — pulls traces from a Jaeger v3 HTTP API
 * (`GET {url}/api/traces/{id}`). When `JAEGER_URL` is not set, the
 * adapter returns a `skipped` variant whose every method records
 * `JAEGER_ENV_MISSING` and throws {@link SkippedError}. Tests use this
 * to short-circuit gracefully without failing the whole suite in local
 * dev.
 *
 * The real adapter still walks the span tree + collapses siblings +
 * builds the log index client-side — those are pure functions of the
 * fetched payload and do not need Jaeger round-trips. The one op that
 * touches the network is `loadTrace`; the remaining 4 ops run the same
 * mock code path against the fetched payload so the fidelity harness
 * observes divergences only when Jaeger returns a different shape from
 * the seeded fixture.
 *
 * Real-mode envs.
 *
 * - `JAEGER_URL` — required to enable real mode (e.g. `http://localhost:16686`)
 * - `JAEGER_TIMEOUT_MS` — optional, defaults to 5000
 */

export interface RealAdapterEnv {
  jaegerUrl: string;
  timeoutMs: number;
}

export function detectRealEnv(): RealAdapterEnv | null {
  const url = process.env.JAEGER_URL;
  if (!url) return null;
  const timeoutRaw = process.env.JAEGER_TIMEOUT_MS;
  const timeoutMs = timeoutRaw ? Math.max(100, Number(timeoutRaw) || 5000) : 5000;
  return { jaegerUrl: url.replace(/\/$/, ''), timeoutMs };
}

/**
 * Distinguished error emitted when the real adapter is asked to run
 * without a live Jaeger URL, or when the runtime cannot reach it.
 */
export class SkippedError extends Error {
  readonly code:
    | 'JAEGER_ENV_MISSING'
    | 'JAEGER_HTTP_ERROR'
    | 'JAEGER_FETCH_MISSING'
    | 'JAEGER_TRACE_NOT_FOUND';
  constructor(op: string, code: SkippedError['code']) {
    super(`SkippedError(${code}): cannot execute ${op}`);
    this.code = code;
  }
}

export function makeRealAdapter(config: FlameExplorerConfig): FlameExplorerAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter(config, 'JAEGER_ENV_MISSING');
  return makeLiveRealAdapter(config, env);
}

function makeSkippedRealAdapter(
  _config: FlameExplorerConfig,
  kind: 'JAEGER_ENV_MISSING',
): FlameExplorerAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: kind });
    throw new SkippedError(op, kind);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    loadTrace: async () => unsupported<LoadedTrace>('loadTrace'),
    renderFlame: async () => unsupported<FlameGraphNode[]>('renderFlame'),
    drillDown: async () => unsupported<FlameGraphNode | null>('drillDown'),
    joinLogs: async () => unsupported<LogJoinEntry[]>('joinLogs'),
    filterByName: async () => unsupported<FlameNameStats | null>('filterByName'),
    metrics: () => ({
      loadCount: 0,
      renderCount: 0,
      drillDownCount: 0,
      loadLatencySamplesMs: [],
      renderLatencySamplesMs: [],
      requests: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

/**
 * Live real adapter — talks to the Jaeger v3 REST API. The 5 ops post-
 * loadTrace all run against the fetched payload, so behavioural
 * divergence between mock + real can only originate in the shape
 * Jaeger returns for a given traceId.
 */
function makeLiveRealAdapter(
  _config: FlameExplorerConfig,
  env: RealAdapterEnv,
): FlameExplorerAdapter {
  const trace: TraceEvent[] = [];
  const loadLatencyMs: number[] = [];
  const renderLatencyMs: number[] = [];
  let loadCount = 0;
  let renderCount = 0;
  let drillDownCount = 0;
  let requestCount = 0;
  const payloadCache = new Map<string, LoadedTrace>();

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function fetchTrace(traceId: string): Promise<LoadedTrace> {
    const cached = payloadCache.get(traceId);
    if (cached) return cached;
    const fetchFn = (globalThis as { fetch?: typeof fetch }).fetch;
    if (typeof fetchFn !== 'function') {
      record('loadTrace', false, { errorKind: 'JAEGER_FETCH_MISSING' });
      throw new SkippedError('loadTrace', 'JAEGER_FETCH_MISSING');
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.timeoutMs);
    let res: Response;
    try {
      res = await fetchFn(`${env.jaegerUrl}/api/traces/${encodeURIComponent(traceId)}`, {
        signal: controller.signal,
      });
    } catch (err) {
      record('loadTrace', false, {
        errorKind: 'JAEGER_HTTP_ERROR',
        detail: err instanceof Error ? err.message : String(err),
      });
      throw new SkippedError('loadTrace', 'JAEGER_HTTP_ERROR');
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      record('loadTrace', false, {
        errorKind: res.status === 404 ? 'JAEGER_TRACE_NOT_FOUND' : 'JAEGER_HTTP_ERROR',
        detail: `${res.status} ${body.slice(0, 200)}`,
      });
      throw new SkippedError(
        'loadTrace',
        res.status === 404 ? 'JAEGER_TRACE_NOT_FOUND' : 'JAEGER_HTTP_ERROR',
      );
    }
    const payload = (await res.json()) as JaegerTraceResponse;
    const normalised = normaliseJaegerPayload(payload, traceId);
    payloadCache.set(traceId, normalised);
    return normalised;
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    loadTrace: async (traceId: string): Promise<LoadedTrace> => {
      const started = Date.now();
      loadCount += 1;
      requestCount += 1;
      const payload = await fetchTrace(traceId);
      loadLatencyMs.push(Math.max(0, Date.now() - started));
      record('loadTrace', true, { detail: traceId });
      return payload;
    },

    renderFlame: async (traceId: string): Promise<FlameGraphNode[]> => {
      renderCount += 1;
      const started = Date.now();
      const payload = await fetchTrace(traceId);
      const flame = buildFlameGraphFromPayload(payload);
      renderLatencyMs.push(Math.max(0, Date.now() - started));
      record('renderFlame', true, { detail: traceId });
      return flame;
    },

    drillDown: async (traceId: string, name: string): Promise<FlameGraphNode | null> => {
      drillDownCount += 1;
      const payload = await fetchTrace(traceId);
      const flame = buildFlameGraphFromPayload(payload);
      const target = findFirst(flame, name);
      record('drillDown', target !== null, { detail: `${traceId}#${name}` });
      return target === null ? null : rebase(target, target.depth);
    },

    joinLogs: async (traceId: string): Promise<LogJoinEntry[]> => {
      const payload = await fetchTrace(traceId);
      const spanNameById = new Map<string, string>();
      for (const s of payload.spans) spanNameById.set(s.spanId, s.name);
      const links = payload.logs.map<LogJoinEntry>((l) => ({
        log: l,
        spanId: l.spanId,
        traceId: l.traceId,
        spanName: l.spanId ? (spanNameById.get(l.spanId) ?? null) : null,
      }));
      record('joinLogs', true, { detail: traceId });
      return links;
    },

    filterByName: async (traceId: string, name: string): Promise<FlameNameStats | null> => {
      const payload = await fetchTrace(traceId);
      const flame = buildFlameGraphFromPayload(payload);
      const flat = flattenAll(flame).filter((n) => n.name === name);
      if (flat.length === 0) {
        record('filterByName', false, { detail: `${traceId}#${name}` });
        return null;
      }
      const samples = flat.reduce((sum, n) => sum + n.samples, 0);
      const totalMs = flat.reduce((sum, n) => sum + n.totalMs, 0);
      const selfMs = flat.reduce((sum, n) => sum + n.selfMs, 0);
      const averageMs = samples === 0 ? 0 : totalMs / samples;
      record('filterByName', true, { detail: `${traceId}#${name}` });
      return { name, samples, totalMs, selfMs, averageMs };
    },

    metrics: () => ({
      loadCount,
      renderCount,
      drillDownCount,
      loadLatencySamplesMs: [...loadLatencyMs],
      renderLatencySamplesMs: [...renderLatencyMs],
      requests: requestCount,
    }),

    reset: async () => {
      trace.length = 0;
      loadLatencyMs.length = 0;
      renderLatencyMs.length = 0;
      loadCount = 0;
      renderCount = 0;
      drillDownCount = 0;
      requestCount = 0;
      payloadCache.clear();
    },
  };
}

/**
 * Minimal Jaeger v3 payload shape — the adapter reads only the fields
 * it needs. Callers are welcome to point at any Jaeger-compatible
 * backend (Tempo / OTel Collector / self-hosted Jaeger).
 */
interface JaegerTraceResponse {
  data?: Array<{
    traceID: string;
    spans: Array<{
      spanID: string;
      operationName: string;
      startTime: number;
      duration: number;
      references?: Array<{ refType: string; spanID: string }>;
      tags?: Array<{ key: string; value: string | number | boolean }>;
      logs?: Array<{ timestamp: number; fields: Array<{ key: string; value: unknown }> }>;
    }>;
  }>;
}

function normaliseJaegerPayload(payload: JaegerTraceResponse, requestedTraceId: string): LoadedTrace {
  const first = payload.data?.[0];
  if (!first) {
    return { traceId: requestedTraceId, spans: [], logs: [] };
  }
  const traceId = first.traceID ?? requestedTraceId;
  const spans: AdapterSpan[] = first.spans.map((s) => {
    const parentRef = (s.references ?? []).find((r) => r.refType === 'CHILD_OF');
    const attrs: Record<string, unknown> = {
      trace_id: traceId,
      span_id: s.spanID,
    };
    for (const t of s.tags ?? []) attrs[t.key] = t.value;
    return {
      spanId: s.spanID,
      parentSpanId: parentRef?.spanID ?? null,
      name: s.operationName,
      traceId,
      // Jaeger reports startTime in microseconds; convert to ms.
      startedAt: s.startTime / 1000,
      endedAt: (s.startTime + s.duration) / 1000,
      attributes: attrs,
    };
  });
  const logs: AdapterLog[] = [];
  for (const s of first.spans) {
    for (const l of s.logs ?? []) {
      const fields: Record<string, unknown> = { trace_id: traceId, span_id: s.spanID };
      let level: AdapterLog['level'] = 'info';
      let message = '';
      for (const f of l.fields) {
        if (f.key === 'level' && typeof f.value === 'string') level = coerceLevel(f.value);
        else if (f.key === 'message' && typeof f.value === 'string') message = f.value;
        else fields[f.key] = f.value;
      }
      logs.push({
        level,
        message,
        timestamp: l.timestamp / 1000,
        traceId,
        spanId: s.spanID,
        attributes: fields,
      });
    }
  }
  return { traceId, spans, logs };
}

function coerceLevel(v: string): AdapterLog['level'] {
  switch (v) {
    case 'debug':
    case 'info':
    case 'warn':
    case 'error':
    case 'fatal':
      return v;
    case 'warning':
      return 'warn';
    default:
      return 'info';
  }
}

/**
 * Build a flame graph from a raw LoadedTrace payload. Kept local to
 * avoid importing the observability package on the real path (the mock
 * adapter uses the packaged helpers; the real path stays independent
 * so fidelity diffs stay honest).
 */
function buildFlameGraphFromPayload(payload: LoadedTrace): FlameGraphNode[] {
  const bySpanId = new Map<string, AdapterSpan & { children: string[] }>();
  for (const s of payload.spans) bySpanId.set(s.spanId, { ...s, children: [] });
  const roots: string[] = [];
  for (const s of payload.spans) {
    const parent = s.parentSpanId === null ? null : bySpanId.get(s.parentSpanId);
    if (parent) parent.children.push(s.spanId);
    else roots.push(s.spanId);
  }

  function buildSubtree(id: string, depth: number): FlameGraphNode {
    const s = bySpanId.get(id)!;
    const totalMs = s.endedAt === null ? 0 : s.endedAt - s.startedAt;
    const children = s.children.map((cid) => buildSubtree(cid, depth + 1));
    const childTotal = children.reduce((sum, c) => sum + c.totalMs, 0);
    const selfMs = Math.max(0, totalMs - childTotal);
    return {
      name: s.name,
      depth,
      totalMs,
      selfMs,
      samples: 1,
      children,
    };
  }

  const rawTrees: FlameGraphNode[] = roots.map((id) => buildSubtree(id, 0));
  return collapseSiblings(rawTrees);
}

function collapseSiblings(nodes: FlameGraphNode[]): FlameGraphNode[] {
  const groups = new Map<string, FlameGraphNode[]>();
  const order: string[] = [];
  for (const n of nodes) {
    const bucket = groups.get(n.name);
    if (bucket) bucket.push(n);
    else {
      groups.set(n.name, [n]);
      order.push(n.name);
    }
  }
  const out: FlameGraphNode[] = [];
  for (const name of order) {
    const bucket = groups.get(name)!;
    const totalMs = bucket.reduce((sum, n) => sum + n.totalMs, 0);
    const selfMs = bucket.reduce((sum, n) => sum + n.selfMs, 0);
    const samples = bucket.reduce((sum, n) => sum + n.samples, 0);
    const children = collapseSiblings(bucket.flatMap((n) => n.children));
    out.push({
      name,
      depth: bucket[0]!.depth,
      totalMs,
      selfMs,
      samples,
      children,
    });
  }
  return out;
}

function findFirst(nodes: FlameGraphNode[], name: string): FlameGraphNode | null {
  for (const n of nodes) {
    if (n.name === name) return n;
    const deep = findFirst(n.children, name);
    if (deep) return deep;
  }
  return null;
}

function rebase(node: FlameGraphNode, offset: number): FlameGraphNode {
  return {
    name: node.name,
    depth: node.depth - offset,
    totalMs: node.totalMs,
    selfMs: node.selfMs,
    samples: node.samples,
    children: node.children.map((c) => rebase(c, offset)),
  };
}

function flattenAll(nodes: FlameGraphNode[]): FlameGraphNode[] {
  const out: FlameGraphNode[] = [];
  const walk = (list: FlameGraphNode[]): void => {
    for (const n of list) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}
