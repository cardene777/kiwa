/**
 * Axis 5 — Threat modeling scorer。
 *
 * 4 sub-axis ...
 * - STRIDE (Spoofing / Tampering / Repudiation / InfoDisclosure / DoS / Elevation)
 * - PASTA (Process for Attack Simulation and Threat Analysis、 7 stage)
 * - DREAD (Damage / Reproducibility / Exploitability / Affected users / Discoverability)
 * - trust boundary (subject / resource / data-flow / trust-zone)
 */

import type { SecurityEvent } from './types.js';

export type StrideCategory =
  | 'spoofing'
  | 'tampering'
  | 'repudiation'
  | 'information-disclosure'
  | 'denial-of-service'
  | 'elevation-of-privilege';

export interface StrideThreat {
  id: string;
  category: StrideCategory;
  description: string;
  /** 1-5 severity。 */
  severity: 1 | 2 | 3 | 4 | 5;
}

export function scoreStride(threats: StrideThreat[]): {
  total: number;
  byCategory: Record<StrideCategory, number>;
  highest: StrideThreat | null;
} {
  const byCategory: Record<StrideCategory, number> = {
    spoofing: 0,
    tampering: 0,
    repudiation: 0,
    'information-disclosure': 0,
    'denial-of-service': 0,
    'elevation-of-privilege': 0,
  };
  let highest: StrideThreat | null = null;
  for (const t of threats) {
    byCategory[t.category] += t.severity;
    if (!highest || t.severity > highest.severity) highest = t;
  }
  const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
  return { total, byCategory, highest };
}

/** PASTA stage identifiers — 7 stage は Tony UcedaVélez / Marco Morana 定義に沿う。 */
export type PastaStage =
  | 'define-objectives'
  | 'define-technical-scope'
  | 'application-decomposition'
  | 'threat-analysis'
  | 'vulnerability-analysis'
  | 'attack-modeling'
  | 'risk-analysis';

export interface PastaFinding {
  stage: PastaStage;
  summary: string;
  /** stage 単位 completeness 0-1 (test coverage proxy)。 */
  completeness: number;
}

export function pastaCoverage(findings: PastaFinding[]): {
  overallCompleteness: number;
  perStage: Record<PastaStage, number>;
  gaps: PastaStage[];
} {
  const perStage: Record<PastaStage, number> = {
    'define-objectives': 0,
    'define-technical-scope': 0,
    'application-decomposition': 0,
    'threat-analysis': 0,
    'vulnerability-analysis': 0,
    'attack-modeling': 0,
    'risk-analysis': 0,
  };
  const counts: Record<PastaStage, number> = { ...perStage };
  for (const f of findings) {
    perStage[f.stage] += f.completeness;
    counts[f.stage] += 1;
  }
  const stages = Object.keys(perStage) as PastaStage[];
  for (const stage of stages) {
    if (counts[stage] > 0) {
      perStage[stage] = perStage[stage] / counts[stage];
    }
  }
  const overall = stages.map((s) => perStage[s]).reduce((a, b) => a + b, 0) / stages.length;
  const gaps = stages.filter((s) => perStage[s] < 0.5);
  return { overallCompleteness: overall, perStage, gaps };
}

/**
 * DREAD scoring — each factor 1-10、 total = sum、 threshold = 30
 * (mitigation must-do)。 一般的な 5 factor 平均 6 以上 = critical。
 */
export interface DreadInput {
  damage: number;
  reproducibility: number;
  exploitability: number;
  affectedUsers: number;
  discoverability: number;
}

export interface DreadResult {
  total: number;
  average: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function scoreDread(input: DreadInput): DreadResult {
  const values = [
    input.damage,
    input.reproducibility,
    input.exploitability,
    input.affectedUsers,
    input.discoverability,
  ];
  for (const v of values) {
    if (v < 1 || v > 10) {
      throw new Error(`dread: factor out of range (${v}); must be 1..10`);
    }
  }
  const total = values.reduce((a, b) => a + b, 0);
  const average = total / values.length;
  const severity: DreadResult['severity'] =
    average >= 8 ? 'critical' : average >= 6 ? 'high' : average >= 4 ? 'medium' : 'low';
  return { total, average, severity };
}

/**
 * Trust boundary — DFD-style zone crossing modeler。
 * subject と resource が異なる trust zone を跨ぐ dataflow は
 * mitigation (authn / authz / encryption) を必ず要求する。
 */
export interface TrustZone {
  id: string;
  label: string;
  /** 0=untrusted / 1=partially / 2=trusted。 */
  level: 0 | 1 | 2;
}

export interface DataFlow {
  id: string;
  from: string;
  to: string;
  data: string;
  mitigations: string[];
}

export interface BoundaryCrossing {
  flow: DataFlow;
  fromZone: TrustZone;
  toZone: TrustZone;
  requiredMitigations: string[];
  missingMitigations: string[];
}

export function detectBoundaryCrossings(
  zones: TrustZone[],
  flows: DataFlow[],
  membership: Map<string, string>,
): BoundaryCrossing[] {
  const zoneOf = (nodeId: string): TrustZone | null => {
    const zoneId = membership.get(nodeId);
    if (!zoneId) return null;
    return zones.find((z) => z.id === zoneId) ?? null;
  };
  const out: BoundaryCrossing[] = [];
  for (const flow of flows) {
    const fromZone = zoneOf(flow.from);
    const toZone = zoneOf(flow.to);
    if (!fromZone || !toZone) continue;
    if (fromZone.id === toZone.id) continue;
    const requiredMitigations = requiredMitigationsForCrossing(fromZone, toZone);
    const missingMitigations = requiredMitigations.filter(
      (req) => !flow.mitigations.includes(req),
    );
    out.push({ flow, fromZone, toZone, requiredMitigations, missingMitigations });
  }
  return out;
}

function requiredMitigationsForCrossing(from: TrustZone, to: TrustZone): string[] {
  const required = new Set<string>();
  if (from.level < to.level) {
    required.add('authentication');
    required.add('authorization');
  }
  if (from.level === 0 || to.level === 0) {
    required.add('encryption-in-transit');
  }
  return [...required];
}

export function toThreatModelEvent(input: {
  provider: 'coraza' | 'helmet';
  verdict: 'allow' | 'deny' | 'warn';
  reason: string;
  payload: unknown;
  timestamp: number;
}): SecurityEvent {
  return {
    axis: 'threat-model',
    provider: input.provider,
    verdict: input.verdict,
    reason: input.reason,
    payload: input.payload,
    timestamp: input.timestamp,
  };
}
