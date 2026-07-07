import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

/**
 * Data pipeline observability axis — lineage capture + freshness eval + schema drift +
 * data quality score state machine (v2.2 advanced III).
 *
 * 4-step lifecycle: capture-lineage → evaluate-freshness → detect-schema-drift →
 * score-data-quality。 OpenLineage 1.x spec 準拠 (namespace + name + dataset URI)、
 * freshness = latest event age、 schema drift = column set diff、 DQ = pass ratio。
 */

export type PipelineState =
  | 'idle'
  | 'lineage-captured'
  | 'freshness-evaluated'
  | 'schema-drift-detected'
  | 'data-quality-scored';

export interface PipelineLineageEdge {
  from: string;
  to: string;
}

export interface PipelineSchemaColumn {
  name: string;
  type: string;
}

export interface PipelineDataQualityCheck {
  ruleId: string;
  passed: boolean;
}

export interface PipelineSession {
  target: ObservabilityTarget;
  namespace: string;
  jobName: string;
  state: PipelineState;
  history: AxisStep<PipelineState>[];
  edges: PipelineLineageEdge[];
  freshnessMinutes: number;
  freshnessSlaMinutes: number;
  driftedColumns: string[];
  qualityScore: number;
}

export function startPipelineSession(input: {
  target: ObservabilityTarget;
  namespace: string;
  jobName: string;
}): PipelineSession {
  if (input.namespace.length === 0) {
    throw new Error('startPipelineSession: namespace must not be empty');
  }
  if (input.jobName.length === 0) {
    throw new Error('startPipelineSession: jobName must not be empty');
  }
  return {
    target: input.target,
    namespace: input.namespace,
    jobName: input.jobName,
    state: 'idle',
    history: [],
    edges: [],
    freshnessMinutes: 0,
    freshnessSlaMinutes: 0,
    driftedColumns: [],
    qualityScore: 0,
  };
}

export function captureLineage(
  session: PipelineSession,
  input: { edges: PipelineLineageEdge[] },
): AxisStep<PipelineState> {
  if (session.state !== 'idle') {
    throw new Error(`captureLineage: session is ${session.state}, not idle`);
  }
  if (input.edges.length === 0) {
    throw new Error('captureLineage: edges must not be empty');
  }
  for (const e of input.edges) {
    if (e.from.length === 0 || e.to.length === 0) {
      throw new Error('captureLineage: edge nodes must not be empty');
    }
    if (e.from === e.to) {
      throw new Error(`captureLineage: self-loop edge ${e.from}`);
    }
  }
  session.edges = [...input.edges];
  const uniqueNodes = new Set<string>();
  for (const e of input.edges) {
    uniqueNodes.add(e.from);
    uniqueNodes.add(e.to);
  }
  session.state = 'lineage-captured';
  return emit(session, 'pipeline.lineage_captured', {
    edgeCount: input.edges.length,
    nodeCount: uniqueNodes.size,
  });
}

export function evaluateFreshness(
  session: PipelineSession,
  input: { lastEventAtMs: number; nowMs: number; slaMinutes: number },
): AxisStep<PipelineState> {
  if (session.state !== 'lineage-captured') {
    throw new Error(`evaluateFreshness: session is ${session.state}, not lineage-captured`);
  }
  if (input.slaMinutes <= 0) {
    throw new Error('evaluateFreshness: slaMinutes must be positive');
  }
  if (input.nowMs < input.lastEventAtMs) {
    throw new Error('evaluateFreshness: nowMs must be >= lastEventAtMs');
  }
  const ageMinutes = (input.nowMs - input.lastEventAtMs) / 60_000;
  session.freshnessMinutes = ageMinutes;
  session.freshnessSlaMinutes = input.slaMinutes;
  const withinSla = ageMinutes <= input.slaMinutes;
  session.state = 'freshness-evaluated';
  return emit(session, 'pipeline.freshness_evaluated', {
    ageMinutes,
    slaMinutes: input.slaMinutes,
    withinSla,
  });
}

export function detectSchemaDrift(
  session: PipelineSession,
  input: { expected: PipelineSchemaColumn[]; actual: PipelineSchemaColumn[] },
): AxisStep<PipelineState> {
  if (session.state !== 'freshness-evaluated') {
    throw new Error(`detectSchemaDrift: session is ${session.state}, not freshness-evaluated`);
  }
  if (input.expected.length === 0) {
    throw new Error('detectSchemaDrift: expected schema must not be empty');
  }
  const expectedMap = new Map(input.expected.map((c) => [c.name, c.type]));
  const actualMap = new Map(input.actual.map((c) => [c.name, c.type]));
  const drifted: string[] = [];
  for (const [name, type] of expectedMap) {
    if (!actualMap.has(name)) drifted.push(`${name}:missing`);
    else if (actualMap.get(name) !== type) drifted.push(`${name}:type-change`);
  }
  for (const [name] of actualMap) {
    if (!expectedMap.has(name)) drifted.push(`${name}:added`);
  }
  session.driftedColumns = drifted;
  session.state = 'schema-drift-detected';
  return emit(session, 'pipeline.schema_drift_detected', {
    driftCount: drifted.length,
    expectedColumns: input.expected.length,
    actualColumns: input.actual.length,
    hasDrift: drifted.length > 0,
  });
}

export function scoreDataQuality(
  session: PipelineSession,
  input: { checks: PipelineDataQualityCheck[] },
): AxisStep<PipelineState> {
  if (session.state !== 'schema-drift-detected') {
    throw new Error(`scoreDataQuality: session is ${session.state}, not schema-drift-detected`);
  }
  if (input.checks.length === 0) {
    throw new Error('scoreDataQuality: checks must not be empty');
  }
  const passed = input.checks.filter((c) => c.passed).length;
  session.qualityScore = passed / input.checks.length;
  session.state = 'data-quality-scored';
  return emit(session, 'pipeline.data_quality_scored', {
    checkCount: input.checks.length,
    passedCount: passed,
    failedCount: input.checks.length - passed,
    score: session.qualityScore,
  });
}

function emit(
  session: PipelineSession,
  neutralEvent: AxisStep<PipelineState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<PipelineState> {
  const step: AxisStep<PipelineState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: {
      target: session.target,
      namespace: session.namespace,
      jobName: session.jobName,
      ...metadata,
    },
  };
  session.history.push(step);
  return step;
}
