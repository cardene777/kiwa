import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

export type CardinalityState =
  | 'idle'
  | 'series-scanned'
  | 'high-cardinality-detected'
  | 'label-reduced'
  | 'histogram-bucketed';

export interface SeriesFingerprint {
  metricName: string;
  labels: Record<string, string>;
}

export interface CardinalitySession {
  target: ObservabilityTarget;
  scopeId: string;
  state: CardinalityState;
  series: SeriesFingerprint[];
  droppedLabels: string[];
  histogramBuckets: number[];
  history: AxisStep<CardinalityState>[];
}

export function startCardinalitySession(input: {
  target: ObservabilityTarget;
  scopeId: string;
}): CardinalitySession {
  if (input.scopeId.length === 0) {
    throw new Error('startCardinalitySession: scopeId must not be empty');
  }
  return {
    target: input.target,
    scopeId: input.scopeId,
    state: 'idle',
    series: [],
    droppedLabels: [],
    histogramBuckets: [],
    history: [],
  };
}

export function scanSeries(
  session: CardinalitySession,
  series: SeriesFingerprint[],
): AxisStep<CardinalityState> {
  if (series.length === 0) {
    throw new Error('scanSeries: series must not be empty');
  }
  session.series = [...series];
  session.state = 'series-scanned';
  const uniqueMetrics = new Set(series.map((s) => s.metricName));
  return emit(session, 'cardinality.series_scanned', {
    seriesCount: series.length,
    metricCount: uniqueMetrics.size,
  });
}

export interface HighCardinalityFinding {
  metricName: string;
  label: string;
  uniqueValues: number;
}

export function detectHighCardinality(
  session: CardinalitySession,
  input: { threshold: number },
): { step: AxisStep<CardinalityState>; findings: HighCardinalityFinding[] } {
  if (input.threshold <= 0) {
    throw new Error('detectHighCardinality: threshold must be positive');
  }
  if (session.state === 'idle') {
    throw new Error('detectHighCardinality: series must be scanned first');
  }
  const findings: HighCardinalityFinding[] = [];
  const grouped = new Map<string, Map<string, Set<string>>>();
  for (const s of session.series) {
    let metricMap = grouped.get(s.metricName);
    if (!metricMap) {
      metricMap = new Map();
      grouped.set(s.metricName, metricMap);
    }
    for (const [label, value] of Object.entries(s.labels)) {
      let labelSet = metricMap.get(label);
      if (!labelSet) {
        labelSet = new Set();
        metricMap.set(label, labelSet);
      }
      labelSet.add(value);
    }
  }
  for (const [metricName, labelMap] of grouped.entries()) {
    for (const [label, values] of labelMap.entries()) {
      if (values.size >= input.threshold) {
        findings.push({ metricName, label, uniqueValues: values.size });
      }
    }
  }
  session.state = 'high-cardinality-detected';
  const step = emit(session, 'cardinality.high_cardinality_detected', {
    threshold: input.threshold,
    findingCount: findings.length,
  });
  return { step, findings };
}

export function reduceLabel(
  session: CardinalitySession,
  input: { label: string },
): AxisStep<CardinalityState> {
  if (input.label.length === 0) {
    throw new Error('reduceLabel: label must not be empty');
  }
  const beforeCount = session.series.length;
  session.series = session.series.map((s) => {
    const { [input.label]: _dropped, ...rest } = s.labels;
    return { metricName: s.metricName, labels: rest };
  });
  const deduped = new Map<string, SeriesFingerprint>();
  for (const s of session.series) {
    const key = `${s.metricName}${JSON.stringify(s.labels)}`;
    if (!deduped.has(key)) deduped.set(key, s);
  }
  session.series = Array.from(deduped.values());
  session.droppedLabels.push(input.label);
  session.state = 'label-reduced';
  return emit(session, 'cardinality.label_reduced', {
    label: input.label,
    beforeCount,
    afterCount: session.series.length,
    reducedBy: beforeCount - session.series.length,
  });
}

export function bucketHistogram(
  session: CardinalitySession,
  input: { boundaries: number[] },
): AxisStep<CardinalityState> {
  if (input.boundaries.length === 0) {
    throw new Error('bucketHistogram: boundaries must not be empty');
  }
  for (let i = 1; i < input.boundaries.length; i++) {
    const cur = input.boundaries[i] ?? 0;
    const prev = input.boundaries[i - 1] ?? 0;
    if (cur <= prev) {
      throw new Error('bucketHistogram: boundaries must be strictly increasing');
    }
  }
  session.histogramBuckets = [...input.boundaries];
  session.state = 'histogram-bucketed';
  return emit(session, 'cardinality.histogram_bucketed', {
    bucketCount: input.boundaries.length,
    minBoundary: input.boundaries[0] ?? 0,
    maxBoundary: input.boundaries[input.boundaries.length - 1] ?? 0,
  });
}

function emit(
  session: CardinalitySession,
  neutralEvent: AxisStep<CardinalityState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<CardinalityState> {
  const step: AxisStep<CardinalityState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, scopeId: session.scopeId, ...metadata },
  };
  session.history.push(step);
  return step;
}
