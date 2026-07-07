import { describe, expect, it } from 'vitest';
import {
  captureLineage,
  detectSchemaDrift,
  evaluateFreshness,
  scoreDataQuality,
  startPipelineSession,
} from '../../src/semantics/index.js';

const targets = ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const;

describe('data-pipeline axis — happy path', () => {
  it('runs full 4-step lifecycle', () => {
    const s = startPipelineSession({
      target: 'prometheus',
      namespace: 'analytics',
      jobName: 'daily-etl',
    });
    captureLineage(s, {
      edges: [
        { from: 'raw.events', to: 'stg.events' },
        { from: 'stg.events', to: 'mart.daily_active_users' },
      ],
    });
    evaluateFreshness(s, {
      lastEventAtMs: 0,
      nowMs: 30 * 60_000,
      slaMinutes: 60,
    });
    detectSchemaDrift(s, {
      expected: [
        { name: 'id', type: 'int' },
        { name: 'ts', type: 'timestamp' },
      ],
      actual: [
        { name: 'id', type: 'int' },
        { name: 'ts', type: 'timestamp' },
      ],
    });
    scoreDataQuality(s, {
      checks: [
        { ruleId: 'not-null', passed: true },
        { ruleId: 'unique-id', passed: true },
      ],
    });
    expect(s.state).toBe('data-quality-scored');
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'pipeline.lineage_captured',
      'pipeline.freshness_evaluated',
      'pipeline.schema_drift_detected',
      'pipeline.data_quality_scored',
    ]);
  });

  it('captureLineage counts nodes and edges', () => {
    const s = startPipelineSession({ target: 'grafana-oss', namespace: 'n', jobName: 'j' });
    const step = captureLineage(s, {
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
        { from: 'a', to: 'c' },
      ],
    });
    expect(step.metadata.edgeCount).toBe(3);
    expect(step.metadata.nodeCount).toBe(3);
    expect(s.edges).toHaveLength(3);
  });

  it('evaluateFreshness detects within-sla', () => {
    const s = startPipelineSession({ target: 'loki', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    const step = evaluateFreshness(s, {
      lastEventAtMs: 0,
      nowMs: 15 * 60_000,
      slaMinutes: 30,
    });
    expect(step.metadata.ageMinutes).toBe(15);
    expect(step.metadata.withinSla).toBe(true);
    expect(s.freshnessMinutes).toBe(15);
  });

  it('evaluateFreshness detects sla breach', () => {
    const s = startPipelineSession({ target: 'otel-collector', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    const step = evaluateFreshness(s, {
      lastEventAtMs: 0,
      nowMs: 90 * 60_000,
      slaMinutes: 60,
    });
    expect(step.metadata.ageMinutes).toBe(90);
    expect(step.metadata.withinSla).toBe(false);
  });

  it('detectSchemaDrift finds missing columns', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1000, slaMinutes: 1 });
    const step = detectSchemaDrift(s, {
      expected: [
        { name: 'id', type: 'int' },
        { name: 'name', type: 'string' },
      ],
      actual: [{ name: 'id', type: 'int' }],
    });
    expect(step.metadata.driftCount).toBe(1);
    expect(step.metadata.hasDrift).toBe(true);
    expect(s.driftedColumns).toContain('name:missing');
  });

  it('detectSchemaDrift finds type changes', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1000, slaMinutes: 1 });
    const step = detectSchemaDrift(s, {
      expected: [{ name: 'id', type: 'int' }],
      actual: [{ name: 'id', type: 'string' }],
    });
    expect(step.metadata.driftCount).toBe(1);
    expect(s.driftedColumns).toContain('id:type-change');
  });

  it('detectSchemaDrift finds added columns', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1000, slaMinutes: 1 });
    const step = detectSchemaDrift(s, {
      expected: [{ name: 'id', type: 'int' }],
      actual: [
        { name: 'id', type: 'int' },
        { name: 'extra', type: 'bool' },
      ],
    });
    expect(step.metadata.driftCount).toBe(1);
    expect(s.driftedColumns).toContain('extra:added');
  });

  it('detectSchemaDrift returns 0 when identical', () => {
    const s = startPipelineSession({ target: 'grafana-oss', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1000, slaMinutes: 1 });
    const step = detectSchemaDrift(s, {
      expected: [{ name: 'id', type: 'int' }],
      actual: [{ name: 'id', type: 'int' }],
    });
    expect(step.metadata.driftCount).toBe(0);
    expect(step.metadata.hasDrift).toBe(false);
  });

  it('scoreDataQuality computes pass ratio', () => {
    const s = startPipelineSession({ target: 'loki', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1000, slaMinutes: 1 });
    detectSchemaDrift(s, { expected: [{ name: 'x', type: 'int' }], actual: [{ name: 'x', type: 'int' }] });
    const step = scoreDataQuality(s, {
      checks: [
        { ruleId: 'r1', passed: true },
        { ruleId: 'r2', passed: true },
        { ruleId: 'r3', passed: false },
        { ruleId: 'r4', passed: false },
      ],
    });
    expect(step.metadata.score).toBe(0.5);
    expect(step.metadata.passedCount).toBe(2);
    expect(step.metadata.failedCount).toBe(2);
    expect(s.qualityScore).toBe(0.5);
  });

  it.each(targets)('translates provider event for %s', (target) => {
    const s = startPipelineSession({ target, namespace: 'n', jobName: 'j' });
    const step = captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    expect(step.providerEvent).not.toBe(step.neutralEvent);
  });
});

describe('data-pipeline axis — invariant guards', () => {
  it('rejects empty namespace', () => {
    expect(() =>
      startPipelineSession({ target: 'prometheus', namespace: '', jobName: 'j' }),
    ).toThrow(/namespace/);
  });

  it('rejects empty jobName', () => {
    expect(() =>
      startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: '' }),
    ).toThrow(/jobName/);
  });

  it('rejects captureLineage out of state', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    expect(() => captureLineage(s, { edges: [{ from: 'a', to: 'b' }] })).toThrow(/not idle/);
  });

  it('rejects captureLineage with empty edges', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    expect(() => captureLineage(s, { edges: [] })).toThrow(/must not be empty/);
  });

  it('rejects captureLineage with self-loop', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    expect(() => captureLineage(s, { edges: [{ from: 'a', to: 'a' }] })).toThrow(/self-loop/);
  });

  it('rejects captureLineage with empty edge nodes', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    expect(() => captureLineage(s, { edges: [{ from: '', to: 'b' }] })).toThrow(/edge nodes/);
  });

  it('rejects evaluateFreshness before lineage', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    expect(() =>
      evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1000, slaMinutes: 1 }),
    ).toThrow(/not lineage-captured/);
  });

  it('rejects evaluateFreshness with non-positive sla', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    expect(() =>
      evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1000, slaMinutes: 0 }),
    ).toThrow(/slaMinutes/);
  });

  it('rejects evaluateFreshness with nowMs < lastEventAtMs', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    expect(() =>
      evaluateFreshness(s, { lastEventAtMs: 2000, nowMs: 1000, slaMinutes: 1 }),
    ).toThrow(/nowMs/);
  });

  it('rejects detectSchemaDrift before freshness', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    expect(() =>
      detectSchemaDrift(s, {
        expected: [{ name: 'x', type: 'int' }],
        actual: [{ name: 'x', type: 'int' }],
      }),
    ).toThrow(/not freshness-evaluated/);
  });

  it('rejects detectSchemaDrift with empty expected schema', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1000, slaMinutes: 1 });
    expect(() =>
      detectSchemaDrift(s, {
        expected: [],
        actual: [{ name: 'x', type: 'int' }],
      }),
    ).toThrow(/expected schema/);
  });

  it('rejects scoreDataQuality before schema drift', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    expect(() => scoreDataQuality(s, { checks: [{ ruleId: 'r', passed: true }] })).toThrow(
      /not schema-drift-detected/,
    );
  });

  it('rejects scoreDataQuality with empty checks', () => {
    const s = startPipelineSession({ target: 'prometheus', namespace: 'n', jobName: 'j' });
    captureLineage(s, { edges: [{ from: 'a', to: 'b' }] });
    evaluateFreshness(s, { lastEventAtMs: 0, nowMs: 1000, slaMinutes: 1 });
    detectSchemaDrift(s, {
      expected: [{ name: 'x', type: 'int' }],
      actual: [{ name: 'x', type: 'int' }],
    });
    expect(() => scoreDataQuality(s, { checks: [] })).toThrow(/must not be empty/);
  });
});
