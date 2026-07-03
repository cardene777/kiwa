import type {
  AlertOrchestratorAdapter,
  MetricSample,
} from '../adapters/interface.js';

/**
 * End-to-end flows a Node.js alert orchestrator walks through when
 * Prometheus metric samples arrive on an ingest endpoint. The 4 flows
 * compose into the `full` matrix the fidelity harness uses to diff
 * mock vs real.
 *
 * - `runIngestFlow` — push a batch of metric samples so the mock rule
 *   engine has data to evaluate; the real path records the ingest as a
 *   noop.
 * - `runEvaluateFlow` — call `evaluateRules` twice back-to-back so the
 *   trace records the transition from "no fires" to "fires ready" and
 *   the metrics.evaluationCount grows monotonically.
 * - `runRouteFlow` — route every fire produced by evaluate through the
 *   routing tree, giving the harness a full receiver map.
 * - `runEscalationFlow` — advance the escalation clock in 3 steps
 *   (L1 30s → L2 5min → L3 30min).
 */

const SAMPLE_METRICS: MetricSample[] = [
  { metricName: 'http.errors', kind: 'counter', value: 12 },
  { metricName: 'http.errors', kind: 'counter', value: 15 },
  { metricName: 'http.latency.ms', kind: 'histogram', value: 620 },
  { metricName: 'http.latency.ms', kind: 'histogram', value: 640 },
  { metricName: 'http.latency.ms', kind: 'histogram', value: 660 },
  { metricName: 'queue.depth', kind: 'gauge', value: 1200, tags: { queue: 'jobs' } },
  { metricName: 'disk.usage.percent', kind: 'gauge', value: 92 },
  { metricName: 'http.errors.total', kind: 'counter', value: 100 },
  { metricName: 'http.errors.total', kind: 'counter', value: 200, timestamp: 60_000 },
  { metricName: 'http.requests.total', kind: 'counter', value: 1_000 },
  { metricName: 'http.requests.total', kind: 'counter', value: 8_000, timestamp: 60_000 },
  { metricName: 'route.errors.total', kind: 'counter', value: 10, tags: { route: '/api/checkout' } },
  {
    metricName: 'route.errors.total',
    kind: 'counter',
    value: 50,
    tags: { route: '/api/checkout' },
    timestamp: 30_000,
  },
  { metricName: 'process.memory.rss', kind: 'gauge', value: 500 },
  { metricName: 'process.memory.rss', kind: 'gauge', value: 520 },
  { metricName: 'process.memory.rss', kind: 'gauge', value: 5_000 },
  { metricName: 'process.cpu.percent', kind: 'gauge', value: 50 },
  { metricName: 'process.cpu.percent', kind: 'gauge', value: 55 },
  { metricName: 'process.cpu.percent', kind: 'gauge', value: 99 },
  { metricName: 'runtime.gc.pause.ms', kind: 'histogram', value: 20 },
  { metricName: 'runtime.gc.pause.ms', kind: 'histogram', value: 22 },
  { metricName: 'runtime.gc.pause.ms', kind: 'histogram', value: 250 },
];

export async function runIngestFlow(adapter: AlertOrchestratorAdapter): Promise<void> {
  for (const sample of SAMPLE_METRICS) {
    await adapter.emitMetric(sample);
  }
}

export async function runEvaluateFlow(adapter: AlertOrchestratorAdapter): Promise<void> {
  await adapter.evaluateRules();
  await adapter.evaluateRules();
}

export async function runRouteFlow(adapter: AlertOrchestratorAdapter): Promise<void> {
  const fires = await adapter.evaluateRules();
  for (const fire of fires) {
    await adapter.routeAlert(fire);
  }
}

export async function runEscalationFlow(adapter: AlertOrchestratorAdapter): Promise<void> {
  await adapter.advanceEscalation();
}

/** Run all 4 flows in order — the harness matrix. */
export async function runFullMatrix(adapter: AlertOrchestratorAdapter): Promise<void> {
  await runIngestFlow(adapter);
  await runEvaluateFlow(adapter);
  await runRouteFlow(adapter);
  await runEscalationFlow(adapter);
}

/**
 * Ops the full matrix exercises end-to-end on both mock + real paths.
 * `emitMetric` is intentionally excluded — the real path is a noop for
 * it, so the fidelity harness would over-report divergences if it
 * were counted.
 */
export const OPS_UNDER_TEST: readonly string[] = [
  'evaluateRules',
  'routeAlert',
  'advanceEscalation',
];
