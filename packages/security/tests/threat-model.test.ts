import { describe, expect, it } from 'vitest';
import {
  detectBoundaryCrossings,
  pastaCoverage,
  scoreDread,
  scoreStride,
  toThreatModelEvent,
} from '../src/index.js';
import type { DataFlow, PastaFinding, StrideThreat, TrustZone } from '../src/index.js';

describe('Threat model — STRIDE', () => {
  const threats: StrideThreat[] = [
    { id: 't1', category: 'spoofing', description: 'phishing', severity: 4 },
    { id: 't2', category: 'tampering', description: 'form tampering', severity: 3 },
    { id: 't3', category: 'denial-of-service', description: 'ddos', severity: 5 },
  ];

  it('T-SEC-TM-001 scoreStride sums per category', () => {
    const r = scoreStride(threats);
    expect(r.byCategory['spoofing']).toBe(4);
    expect(r.byCategory['tampering']).toBe(3);
    expect(r.byCategory['denial-of-service']).toBe(5);
  });

  it('T-SEC-TM-002 scoreStride returns total across categories', () => {
    expect(scoreStride(threats).total).toBe(12);
  });

  it('T-SEC-TM-003 scoreStride identifies the highest severity threat', () => {
    const r = scoreStride(threats);
    expect(r.highest?.id).toBe('t3');
  });

  it('T-SEC-TM-004 scoreStride handles an empty threat list', () => {
    const r = scoreStride([]);
    expect(r.total).toBe(0);
    expect(r.highest).toBeNull();
  });
});

describe('Threat model — PASTA', () => {
  const findings: PastaFinding[] = [
    { stage: 'define-objectives', summary: 'goals', completeness: 1 },
    { stage: 'define-technical-scope', summary: 'scope', completeness: 0.8 },
    { stage: 'threat-analysis', summary: 'threats', completeness: 0.6 },
  ];

  it('T-SEC-TM-005 pastaCoverage averages per-stage completeness', () => {
    const r = pastaCoverage(findings);
    expect(r.perStage['define-objectives']).toBe(1);
    expect(r.perStage['threat-analysis']).toBe(0.6);
  });

  it('T-SEC-TM-006 pastaCoverage identifies gaps below 0.5', () => {
    const r = pastaCoverage(findings);
    // 4 stages have zero completeness — those are the gaps.
    expect(r.gaps.length).toBeGreaterThan(0);
    expect(r.gaps).toContain('vulnerability-analysis');
  });

  it('T-SEC-TM-007 pastaCoverage overall completeness averages all 7 stages', () => {
    const r = pastaCoverage(findings);
    expect(r.overallCompleteness).toBeGreaterThan(0);
    expect(r.overallCompleteness).toBeLessThan(1);
  });

  it('T-SEC-TM-008 pastaCoverage handles empty findings', () => {
    const r = pastaCoverage([]);
    expect(r.overallCompleteness).toBe(0);
    expect(r.gaps.length).toBe(7);
  });
});

describe('Threat model — DREAD', () => {
  it('T-SEC-TM-009 scoreDread computes total and average', () => {
    const r = scoreDread({
      damage: 8,
      reproducibility: 9,
      exploitability: 7,
      affectedUsers: 8,
      discoverability: 8,
    });
    expect(r.total).toBe(40);
    expect(r.average).toBe(8);
  });

  it('T-SEC-TM-010 scoreDread returns critical for average >= 8', () => {
    const r = scoreDread({
      damage: 10,
      reproducibility: 10,
      exploitability: 10,
      affectedUsers: 10,
      discoverability: 10,
    });
    expect(r.severity).toBe('critical');
  });

  it('T-SEC-TM-011 scoreDread returns low for average < 4', () => {
    const r = scoreDread({
      damage: 2,
      reproducibility: 2,
      exploitability: 2,
      affectedUsers: 2,
      discoverability: 2,
    });
    expect(r.severity).toBe('low');
  });

  it('T-SEC-TM-012 scoreDread throws when a factor is out of range', () => {
    expect(() =>
      scoreDread({
        damage: 11,
        reproducibility: 5,
        exploitability: 5,
        affectedUsers: 5,
        discoverability: 5,
      }),
    ).toThrow(/range/);
  });

  it('T-SEC-TM-013 scoreDread throws when a factor is below 1', () => {
    expect(() =>
      scoreDread({
        damage: 0,
        reproducibility: 5,
        exploitability: 5,
        affectedUsers: 5,
        discoverability: 5,
      }),
    ).toThrow(/range/);
  });
});

describe('Threat model — trust boundary', () => {
  const zones: TrustZone[] = [
    { id: 'z-internet', label: 'internet', level: 0 },
    { id: 'z-dmz', label: 'dmz', level: 1 },
    { id: 'z-internal', label: 'internal', level: 2 },
  ];
  const flows: DataFlow[] = [
    {
      id: 'f1',
      from: 'user',
      to: 'api',
      data: 'credentials',
      mitigations: ['encryption-in-transit', 'authentication'],
    },
    {
      id: 'f2',
      from: 'api',
      to: 'db',
      data: 'query',
      mitigations: [],
    },
  ];
  const membership = new Map<string, string>([
    ['user', 'z-internet'],
    ['api', 'z-dmz'],
    ['db', 'z-internal'],
  ]);

  it('T-SEC-TM-014 detectBoundaryCrossings identifies internet->dmz crossing', () => {
    const crossings = detectBoundaryCrossings(zones, flows, membership);
    const f1 = crossings.find((c) => c.flow.id === 'f1');
    expect(f1).toBeDefined();
    expect(f1?.fromZone.id).toBe('z-internet');
    expect(f1?.toZone.id).toBe('z-dmz');
  });

  it('T-SEC-TM-015 requires authn + authz when moving up in trust level', () => {
    const crossings = detectBoundaryCrossings(zones, flows, membership);
    const f2 = crossings.find((c) => c.flow.id === 'f2');
    expect(f2?.requiredMitigations).toContain('authentication');
    expect(f2?.requiredMitigations).toContain('authorization');
  });

  it('T-SEC-TM-016 lists missing mitigations for crossings', () => {
    const crossings = detectBoundaryCrossings(zones, flows, membership);
    const f2 = crossings.find((c) => c.flow.id === 'f2');
    expect(f2?.missingMitigations).toContain('authentication');
    expect(f2?.missingMitigations).toContain('authorization');
  });

  it('T-SEC-TM-017 does not list a crossing for same-zone flows', () => {
    const zonesOne: TrustZone[] = [{ id: 'z-alone', label: 'alone', level: 1 }];
    const singleZoneFlows: DataFlow[] = [
      { id: 'f3', from: 'a', to: 'b', data: 'x', mitigations: [] },
    ];
    const m = new Map([
      ['a', 'z-alone'],
      ['b', 'z-alone'],
    ]);
    const crossings = detectBoundaryCrossings(zonesOne, singleZoneFlows, m);
    expect(crossings).toEqual([]);
  });
});

describe('Threat model — toThreatModelEvent', () => {
  it('T-SEC-TM-018 wraps a threat verdict into a SecurityEvent', () => {
    const ev = toThreatModelEvent({
      provider: 'coraza',
      verdict: 'warn',
      reason: 'boundary crossing missing authn',
      payload: { flow: 'f2' },
      timestamp: 100,
    });
    expect(ev.axis).toBe('threat-model');
    expect(ev.verdict).toBe('warn');
  });
});
