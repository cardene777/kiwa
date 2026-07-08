import {
  AlertRouter,
  TelemetryCollector,
  type AlertRule,
  type EscalationStep,
  type MetricRecord,
  type RouteEntry,
} from '@kiwa/observability';
import type {
  AlertFireEvent,
  AlertOrchestratorAdapter,
  AlertOrchestratorConfig,
  AlertOrchestratorMetrics,
  AlertRuleDef,
  EscalationDelivery,
  MetricSample,
  RouteDecision,
  RouteNode,
  TraceEvent,
} from './interface.js';
import { walkRoute } from '../routing/index.js';
import { SilenceStore } from '../silence/index.js';
import { stepFor } from '../escalation/index.js';

/**
 * Mock adapter — drives the `@kiwa/observability` `AlertRouter` so
 * the same app code exercises the Prometheus AlertManager surface without
 * needing a live AlertManager process. The mock produces deterministic
 * lifecycle transitions (fire → route → silence → escalate → resolve) so
 * fidelity tests can assert on receiver identity, silence suppression,
 * and escalation timing without wall-clock coupling.
 *
 * Rule kinds are compiled down to threshold checks at emit time:
 *
 * - `threshold` — direct pass through to `AlertRouter.registerRule`.
 * - `rate` — the mock derives a rolling delta / windowMs sample and
 *   pushes it to the collector under a synthetic metric name; the
 *   underlying AlertRouter fires when the derived rate crosses.
 * - `anomaly` — the mock tracks a rolling mean + stddev per metric
 *   name; the AlertRouter fires when the latest sample exceeds
 *   `mean + stddevMult × stddev`.
 *
 * The compiled threshold is stored per-rule so `evaluateRules` maps
 * back to the caller's original rule id.
 */
export function makeMockAdapter(config: AlertOrchestratorConfig): AlertOrchestratorAdapter {
  const collector = new TelemetryCollector();
  let virtualNow = 0;
  const clock = config.now ?? ((): number => (virtualNow += 1));
  const trace: TraceEvent[] = [];
  const evaluationLatencyMs: number[] = [];
  const routingLatencyMs: number[] = [];
  let evaluationCount = 0;
  let routeCount = 0;
  let escalationCount = 0;
  let requestCount = 0;

  const router = new AlertRouter(collector, { now: clock });
  const silenceStore = new SilenceStore(config.silences);

  // Per-metric rolling window used by rate compilation. Stores the
  // (value, timestamp) of the first sample inside the current window.
  const rateWindow = new Map<string, { value: number; timestamp: number }>();

  // Per-metric rolling stats used by anomaly compilation. Uses Welford
  // one-pass mean + population variance so long-running scenarios do
  // not accumulate float error.
  const anomalyStats = new Map<
    string,
    { count: number; mean: number; m2: number }
  >();

  // Register every rule against the underlying AlertRouter. Rate +
  // anomaly rules are wrapped in a synthetic metric name so the router
  // firing predicate stays a scalar comparison.
  for (const def of config.rules) {
    const rule = toRouterRule(def);
    router.registerRule(rule);
  }

  router.setRoute(toRouterRoute(config.route));

  // Every rule shares the same escalation ladder — the ladder is
  // orchestrator-wide, not per-rule (matches PagerDuty's shared oncall
  // rotation model). Register the same step array against every rule id
  // so any fire walks the same L1 / L2 / L3 route.
  const ladder: EscalationStep[] = config.escalation.map((s) => ({
    afterMs: s.afterMs,
    receiver: s.receiver,
  }));
  for (const def of config.rules) {
    router.setEscalation(def.id, ladder);
  }

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async emitMetric(sample: MetricSample): Promise<void> {
      const t = sample.timestamp ?? clock();
      const record0: MetricRecord = {
        name: sample.metricName,
        kind: sample.kind,
        value: sample.value,
        tags: sample.tags ?? {},
        timestamp: t,
      };
      collector.metrics.push(record0);

      // Compile rate + anomaly rules into synthetic scalars so the
      // AlertRouter's threshold path fires deterministically.
      for (const def of config.rules) {
        if (def.metricName !== sample.metricName) continue;
        if (def.kind === 'rate') pushRateSample(def, record0);
        if (def.kind === 'anomaly') pushAnomalySample(def, record0);
      }
      requestCount += 1;
      record('emitMetric', true, { detail: sample.metricName });
    },

    async evaluateRules(): Promise<AlertFireEvent[]> {
      const start = clock();
      const events = router.evaluate();
      evaluationCount += 1;
      requestCount += 1;
      const latency = Math.max(0, clock() - start);
      evaluationLatencyMs.push(latency);
      const fires: AlertFireEvent[] = events.map((ev) => ({
        ruleId: ev.fire.ruleId,
        severity: ev.fire.severity,
        labels: ev.fire.labels,
        value: ev.fire.value,
        firedAt: ev.fire.firedAt,
        state: 'firing',
      }));
      record('evaluateRules', true, { detail: `fires=${fires.length}` });
      return fires;
    },

    async routeAlert(fire: AlertFireEvent): Promise<RouteDecision> {
      const start = clock();
      const matchedAt = clock();
      const silence = silenceStore.isSilenced(fire, matchedAt);
      const receiver = silence ? null : walkRoute(config.route, fire.labels);
      routeCount += 1;
      requestCount += 1;
      const latency = Math.max(0, clock() - start);
      routingLatencyMs.push(latency);
      const decision: RouteDecision = {
        ruleId: fire.ruleId,
        receiver,
        silenced: silence !== null,
        matchedAt,
      };
      if (silence) decision.silenceId = silence.id;
      record('routeAlert', true, {
        detail: silence ? `silenced=${silence.id}` : `receiver=${receiver ?? 'none'}`,
      });
      return decision;
    },

    async advanceEscalation(): Promise<EscalationDelivery[]> {
      const events = router.tickEscalation();
      escalationCount += events.length;
      requestCount += 1;
      const deliveries: EscalationDelivery[] = [];
      for (const ev of events) {
        const elapsed = ev.deliveredAt - ev.fire.firedAt;
        const step = stepFor(config.escalation, elapsed);
        if (!step) continue;
        deliveries.push({
          ruleId: ev.fire.ruleId,
          receiver: ev.receiver,
          step: step.step,
          afterMs: step.afterMs,
          deliveredAt: ev.deliveredAt,
        });
      }
      record('advanceEscalation', true, { detail: `deliveries=${deliveries.length}` });
      return deliveries;
    },

    getActive(): AlertFireEvent[] {
      return router.getActive().map((f) => ({
        ruleId: f.ruleId,
        severity: f.severity,
        labels: f.labels,
        value: f.value,
        firedAt: f.firedAt,
        // observability AlertState = pending | firing | escalated | resolved.
        // getActive only returns fires that have transitioned past
        // pending, so narrow to the 3 observable states here.
        state: f.state === 'pending' ? 'firing' : f.state,
      }));
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
      collector.clear();
      rateWindow.clear();
      anomalyStats.clear();
    },
  };

  function pushRateSample(def: AlertRuleDef, latest: MetricRecord): void {
    const windowMs = def.windowMs ?? 60_000;
    const start = rateWindow.get(def.metricName);
    if (!start) {
      rateWindow.set(def.metricName, { value: latest.value, timestamp: latest.timestamp });
      return;
    }
    const elapsedMs = latest.timestamp - start.timestamp;
    if (elapsedMs <= 0) return;
    const elapsedSec = Math.max(1 / 1000, elapsedMs / 1000);
    const delta = latest.value - start.value;
    const rate = delta / elapsedSec;
    // Push the derived rate under a rule-scoped synthetic metric name
    // the toRouterRule mapping listens on.
    collector.metrics.push({
      name: syntheticName(def),
      kind: 'gauge',
      value: rate,
      tags: latest.tags,
      timestamp: latest.timestamp,
    });
    // Slide the window forward once we cross the window boundary so
    // subsequent rate samples measure the fresh (latest, latest+window)
    // slice instead of an ever-growing interval.
    if (elapsedMs >= windowMs) {
      rateWindow.set(def.metricName, { value: latest.value, timestamp: latest.timestamp });
    }
  }

  function pushAnomalySample(def: AlertRuleDef, latest: MetricRecord): void {
    // Compare the incoming sample against the trailing baseline BEFORE
    // folding it in, so a genuine outlier is not smoothed into the mean
    // it is supposed to trigger against.
    const s = anomalyStats.get(def.metricName) ?? { count: 0, mean: 0, m2: 0 };
    // Need at least 2 prior samples to have a meaningful stddev.
    if (s.count >= 2) {
      const variance = s.m2 / s.count;
      const stddev = Math.sqrt(variance);
      const mult = def.stddevMult ?? 3;
      const threshold = s.mean + mult * stddev;
      // Derived scalar: latest - threshold. AlertRouter fires when it is
      // >= 0 (rule kind='anomaly' compiles to operator=gte, threshold=0).
      collector.metrics.push({
        name: syntheticName(def),
        kind: 'gauge',
        value: latest.value - threshold,
        tags: latest.tags,
        timestamp: latest.timestamp,
      });
    }
    // Now fold the latest sample into the running stats so subsequent
    // anomaly checks see it. Welford one-pass mean + variance.
    const nextCount = s.count + 1;
    const delta = latest.value - s.mean;
    const nextMean = s.mean + delta / nextCount;
    const delta2 = latest.value - nextMean;
    const nextM2 = s.m2 + delta * delta2;
    anomalyStats.set(def.metricName, { count: nextCount, mean: nextMean, m2: nextM2 });
  }
}

/**
 * Compile a provider-neutral {@link AlertRuleDef} into a
 * `@kiwa/observability` {@link AlertRule}. Rate + anomaly kinds
 * remap to a synthetic scalar metric so the router still fires by
 * threshold comparison.
 */
function toRouterRule(def: AlertRuleDef): AlertRule {
  if (def.kind === 'threshold') {
    return {
      id: def.id,
      metricName: def.metricName,
      operator: def.operator,
      threshold: def.threshold,
      ...(def.forSamples !== undefined ? { forSamples: def.forSamples } : {}),
      labels: def.labels,
      severity: def.severity,
    };
  }
  // rate + anomaly — the synthetic metric already encodes the threshold
  // signal, so the router-side operator degenerates to `gte 0` (rate) or
  // `gte 0` (anomaly: latest - threshold).
  return {
    id: def.id,
    metricName: syntheticName(def),
    operator: def.kind === 'rate' ? def.operator : 'gte',
    threshold: def.kind === 'rate' ? def.threshold : 0,
    forSamples: 1,
    labels: def.labels,
    severity: def.severity,
  };
}

function syntheticName(def: AlertRuleDef): string {
  return `__derived.${def.kind}.${def.id}`;
}

function toRouterRoute(node: RouteNode): RouteEntry {
  const entry: RouteEntry = {
    match: { ...node.match },
    receiver: node.receiver,
  };
  if (node.routes && node.routes.length > 0) {
    entry.routes = node.routes.map(toRouterRoute);
  }
  return entry;
}
