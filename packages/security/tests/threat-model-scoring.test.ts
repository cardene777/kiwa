import { describe, expect, it } from 'vitest';
import {
  detectBoundaryCrossings,
  pastaCoverage,
  scoreDread,
  scoreStride,
} from '../src/index.js';
import type { StrideThreat, TrustZone, DataFlow } from '../src/index.js';

describe('Threat model — STRIDE aggregation edge cases', () => {
  it('T-SEC-TM-S-001 all six categories addressed', () => {
    const threats: StrideThreat[] = [
      { id: '1', category: 'spoofing', description: '', severity: 1 },
      { id: '2', category: 'tampering', description: '', severity: 1 },
      { id: '3', category: 'repudiation', description: '', severity: 1 },
      { id: '4', category: 'information-disclosure', description: '', severity: 1 },
      { id: '5', category: 'denial-of-service', description: '', severity: 1 },
      { id: '6', category: 'elevation-of-privilege', description: '', severity: 1 },
    ];
    const r = scoreStride(threats);
    expect(r.total).toBe(6);
    for (const cat of Object.keys(r.byCategory)) {
      expect(r.byCategory[cat as keyof typeof r.byCategory]).toBeGreaterThan(0);
    }
  });

  it('T-SEC-TM-S-002 ties in severity keep first-seen threat', () => {
    const threats: StrideThreat[] = [
      { id: 'first', category: 'spoofing', description: '', severity: 5 },
      { id: 'second', category: 'tampering', description: '', severity: 5 },
    ];
    const r = scoreStride(threats);
    expect(r.highest?.id).toBe('first');
  });
});

describe('Threat model — DREAD boundary', () => {
  it('T-SEC-TM-D-001 dread severity="high" at avg exactly 6', () => {
    const r = scoreDread({
      damage: 6,
      reproducibility: 6,
      exploitability: 6,
      affectedUsers: 6,
      discoverability: 6,
    });
    expect(r.severity).toBe('high');
  });

  it('T-SEC-TM-D-002 dread severity="medium" at avg exactly 4', () => {
    const r = scoreDread({
      damage: 4,
      reproducibility: 4,
      exploitability: 4,
      affectedUsers: 4,
      discoverability: 4,
    });
    expect(r.severity).toBe('medium');
  });

  it('T-SEC-TM-D-003 dread severity="low" for minimum inputs', () => {
    const r = scoreDread({
      damage: 1,
      reproducibility: 1,
      exploitability: 1,
      affectedUsers: 1,
      discoverability: 1,
    });
    expect(r.severity).toBe('low');
  });

  it('T-SEC-TM-D-004 dread severity="critical" at avg exactly 8', () => {
    const r = scoreDread({
      damage: 8,
      reproducibility: 8,
      exploitability: 8,
      affectedUsers: 8,
      discoverability: 8,
    });
    expect(r.severity).toBe('critical');
  });
});

describe('Threat model — PASTA gap detection', () => {
  it('T-SEC-TM-P-001 pastaCoverage marks stages with completeness = 0.5 not as gaps', () => {
    const r = pastaCoverage([
      { stage: 'define-objectives', summary: '', completeness: 0.5 },
      { stage: 'define-technical-scope', summary: '', completeness: 0.5 },
      { stage: 'application-decomposition', summary: '', completeness: 0.5 },
      { stage: 'threat-analysis', summary: '', completeness: 0.5 },
      { stage: 'vulnerability-analysis', summary: '', completeness: 0.5 },
      { stage: 'attack-modeling', summary: '', completeness: 0.5 },
      { stage: 'risk-analysis', summary: '', completeness: 0.5 },
    ]);
    expect(r.gaps).toEqual([]);
  });

  it('T-SEC-TM-P-002 pastaCoverage averages multiple findings per stage', () => {
    const r = pastaCoverage([
      { stage: 'threat-analysis', summary: '', completeness: 0 },
      { stage: 'threat-analysis', summary: '', completeness: 1 },
    ]);
    expect(r.perStage['threat-analysis']).toBe(0.5);
  });
});

describe('Threat model — Trust boundary edge cases', () => {
  it('T-SEC-TM-B-001 higher-to-lower zone requires encryption not authn', () => {
    const zones: TrustZone[] = [
      { id: 'z-internal', label: 'internal', level: 2 },
      { id: 'z-internet', label: 'internet', level: 0 },
    ];
    const flows: DataFlow[] = [
      { id: 'f-out', from: 'api', to: 'partner', data: 'response', mitigations: ['encryption-in-transit'] },
    ];
    const m = new Map([
      ['api', 'z-internal'],
      ['partner', 'z-internet'],
    ]);
    const crossings = detectBoundaryCrossings(zones, flows, m);
    // internal→internet does not require authn (going out).
    expect(crossings[0]?.requiredMitigations).not.toContain('authentication');
    // But encryption is still required (level 0 present).
    expect(crossings[0]?.requiredMitigations).toContain('encryption-in-transit');
  });

  it('T-SEC-TM-B-002 flows with unknown zone members are skipped', () => {
    const zones: TrustZone[] = [{ id: 'z', label: 'z', level: 1 }];
    const flows: DataFlow[] = [
      { id: 'f', from: 'unknown', to: 'still-unknown', data: '', mitigations: [] },
    ];
    const m = new Map<string, string>();
    const crossings = detectBoundaryCrossings(zones, flows, m);
    expect(crossings).toEqual([]);
  });

  it('T-SEC-TM-B-003 missing mitigations only lists what is truly missing', () => {
    const zones: TrustZone[] = [
      { id: 'z-internet', label: 'internet', level: 0 },
      { id: 'z-internal', label: 'internal', level: 2 },
    ];
    const flows: DataFlow[] = [
      {
        id: 'f',
        from: 'user',
        to: 'api',
        data: 'x',
        mitigations: ['authentication', 'encryption-in-transit'],
      },
    ];
    const m = new Map([
      ['user', 'z-internet'],
      ['api', 'z-internal'],
    ]);
    const crossings = detectBoundaryCrossings(zones, flows, m);
    expect(crossings[0]?.missingMitigations).toEqual(['authorization']);
  });
});
