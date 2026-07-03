import type { AlertRuleDef } from '../adapters/interface.js';

/**
 * 10 canonical alert rules — the AC of Issue #780 scopes the mix as
 * threshold / rate / anomaly. The panel wall the dogfood exercises is
 * balanced so every routing-tree branch has at least one rule:
 *
 * - 4 `threshold` — HTTP 5xx / p99 latency / queue depth / disk usage
 * - 3 `rate` — 5xx rate, request rate, error rate per route
 * - 3 `anomaly` — memory rss anomaly, cpu usage anomaly, gc pause anomaly
 *
 * Every rule pins a `severity` + `team` label so the routing tree
 * (severity → team → channel) has a deterministic destination.
 */

// Threshold rules ------------------------------------------------------------

export function ruleHttpErrorsCritical(): AlertRuleDef {
  return {
    id: 'rule-http-errors-critical',
    kind: 'threshold',
    metricName: 'http.errors',
    operator: 'gte',
    threshold: 10,
    forSamples: 1,
    labels: { severity: 'critical', team: 'platform', channel: 'pagerduty' },
    severity: 'critical',
  };
}

export function ruleLatencyDegraded(): AlertRuleDef {
  return {
    id: 'rule-latency-degraded',
    kind: 'threshold',
    metricName: 'http.latency.ms',
    operator: 'gte',
    threshold: 500,
    forSamples: 3,
    labels: { severity: 'warn', team: 'platform', channel: 'slack' },
    severity: 'warn',
  };
}

export function ruleQueueBackpressure(): AlertRuleDef {
  return {
    id: 'rule-queue-backpressure',
    kind: 'threshold',
    metricName: 'queue.depth',
    operator: 'gte',
    threshold: 1000,
    forSamples: 1,
    labels: { severity: 'warn', team: 'data', channel: 'slack' },
    severity: 'warn',
  };
}

export function ruleDiskUsageHigh(): AlertRuleDef {
  return {
    id: 'rule-disk-usage-high',
    kind: 'threshold',
    metricName: 'disk.usage.percent',
    operator: 'gte',
    threshold: 90,
    forSamples: 1,
    labels: { severity: 'critical', team: 'infra', channel: 'pagerduty' },
    severity: 'critical',
  };
}

// Rate rules -----------------------------------------------------------------

export function ruleHttp5xxRate(): AlertRuleDef {
  return {
    id: 'rule-http-5xx-rate',
    kind: 'rate',
    metricName: 'http.errors.total',
    operator: 'gte',
    threshold: 0.5,
    windowMs: 60_000,
    labels: { severity: 'critical', team: 'platform', channel: 'pagerduty' },
    severity: 'critical',
  };
}

export function ruleRequestRate(): AlertRuleDef {
  return {
    id: 'rule-request-rate',
    kind: 'rate',
    metricName: 'http.requests.total',
    operator: 'gte',
    threshold: 100,
    windowMs: 60_000,
    labels: { severity: 'info', team: 'platform', channel: 'slack' },
    severity: 'info',
  };
}

export function ruleErrorRatePerRoute(): AlertRuleDef {
  return {
    id: 'rule-error-rate-per-route',
    kind: 'rate',
    metricName: 'route.errors.total',
    operator: 'gte',
    threshold: 0.1,
    windowMs: 30_000,
    labels: { severity: 'warn', team: 'platform', channel: 'slack', route: '/api/checkout' },
    severity: 'warn',
  };
}

// Anomaly rules --------------------------------------------------------------

export function ruleMemoryRssAnomaly(): AlertRuleDef {
  return {
    id: 'rule-memory-rss-anomaly',
    kind: 'anomaly',
    metricName: 'process.memory.rss',
    operator: 'gte',
    threshold: 0,
    stddevMult: 3,
    labels: { severity: 'warn', team: 'infra', channel: 'slack' },
    severity: 'warn',
  };
}

export function ruleCpuUsageAnomaly(): AlertRuleDef {
  return {
    id: 'rule-cpu-usage-anomaly',
    kind: 'anomaly',
    metricName: 'process.cpu.percent',
    operator: 'gte',
    threshold: 0,
    stddevMult: 3,
    labels: { severity: 'critical', team: 'infra', channel: 'pagerduty' },
    severity: 'critical',
  };
}

export function ruleGcPauseAnomaly(): AlertRuleDef {
  return {
    id: 'rule-gc-pause-anomaly',
    kind: 'anomaly',
    metricName: 'runtime.gc.pause.ms',
    operator: 'gte',
    threshold: 0,
    stddevMult: 2,
    labels: { severity: 'warn', team: 'platform', channel: 'slack' },
    severity: 'warn',
  };
}

/** The 10 canonical rules as an ordered array. */
export const seededRules: AlertRuleDef[] = [
  ruleHttpErrorsCritical(),
  ruleLatencyDegraded(),
  ruleQueueBackpressure(),
  ruleDiskUsageHigh(),
  ruleHttp5xxRate(),
  ruleRequestRate(),
  ruleErrorRatePerRoute(),
  ruleMemoryRssAnomaly(),
  ruleCpuUsageAnomaly(),
  ruleGcPauseAnomaly(),
];

/** Look up a seeded rule by id — throws if unknown. */
export function ruleById(id: string): AlertRuleDef {
  const rule = seededRules.find((r) => r.id === id);
  if (!rule) throw new Error(`no seeded rule for id=${id}`);
  return rule;
}
