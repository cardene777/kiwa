/**
 * 4 provider × 8 axis fidelity harness — 32 combination grid。
 *
 * kiwa 中核思想 = 「1 度書けば同じ mock で real driver と挙動照合できる」 を
 * security 領域でも実現。 real driver (production helmet / express-rate-limit /
 * casbin / coraza と testcontainers 経由 stack) と mock driver が同じ
 * `SecurityDriver` interface を実装、 harness が同一 scenario を両方に投げて
 * event 列を照合する。
 */

import type {
  SecurityAxis,
  SecurityDriver,
  SecurityEvent,
  SecurityProvider,
} from './types.js';

export interface SecurityFidelityInput {
  provider: SecurityProvider;
  axis: SecurityAxis;
  realDriver: SecurityDriver;
  mockDriver: SecurityDriver;
  scenarios: string[];
  perScenarioTimeoutMs?: number;
}

export interface SecurityFidelityRecord {
  scenarioId: string;
  provider: SecurityProvider;
  axis: SecurityAxis;
  real: SecurityEvent[];
  mock: SecurityEvent[];
  /** event 数の差 (real - mock)。 */
  eventCountDiff: number;
  /** verdict 一致率 0-1 (real と mock の verdict 列)。 */
  verdictMatch: number;
  /** reason 一致率 0-1 (loose match)。 */
  reasonMatch: number;
  /** 総合 accuracy score 0-1 (verdict * reason の平均)。 */
  accuracyScore: number;
}

export interface SecurityFidelityReport {
  records: SecurityFidelityRecord[];
  summary: {
    scenarios: number;
    avgAccuracyScore: number;
    avgEventCountDiff: number;
    avgVerdictMatch: number;
    avgReasonMatch: number;
    accuracyMethod: 'sequence-jaccard';
  };
}

export async function runSecurityFidelityCheck(
  input: SecurityFidelityInput,
): Promise<SecurityFidelityReport> {
  const timeout = input.perScenarioTimeoutMs ?? 3000;
  const records: SecurityFidelityRecord[] = [];
  for (const scenarioId of input.scenarios) {
    input.realDriver.reset();
    input.mockDriver.reset();
    const [real, mock] = await Promise.all([
      withTimeout(input.realDriver.runScenario(scenarioId), timeout, 'real'),
      withTimeout(input.mockDriver.runScenario(scenarioId), timeout, 'mock'),
    ]);
    const eventCountDiff = real.length - mock.length;
    const verdictMatch = verdictSimilarity(real, mock);
    const reasonMatch = reasonSimilarity(real, mock);
    const accuracyScore = (verdictMatch + reasonMatch) / 2;
    records.push({
      scenarioId,
      provider: input.provider,
      axis: input.axis,
      real,
      mock,
      eventCountDiff,
      verdictMatch,
      reasonMatch,
      accuracyScore,
    });
  }
  return {
    records,
    summary: aggregateSummary(records),
  };
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`security-fidelity: ${label} timeout ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

export function verdictSimilarity(real: SecurityEvent[], mock: SecurityEvent[]): number {
  const n = Math.min(real.length, mock.length);
  if (n === 0) return real.length === mock.length ? 1 : 0;
  let matches = 0;
  for (let i = 0; i < n; i += 1) {
    if (real[i]?.verdict === mock[i]?.verdict) matches += 1;
  }
  return matches / Math.max(real.length, mock.length);
}

export function reasonSimilarity(real: SecurityEvent[], mock: SecurityEvent[]): number {
  const realTokens = real.flatMap((e) => tokenize(e.reason));
  const mockTokens = mock.flatMap((e) => tokenize(e.reason));
  const realSet = new Set(realTokens);
  const mockSet = new Set(mockTokens);
  const intersection = new Set([...realSet].filter((x) => mockSet.has(x)));
  const union = new Set([...realSet, ...mockSet]);
  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

function tokenize(reason: string): string[] {
  return reason
    .toLowerCase()
    .split(/[\s:,\-.;()"'/]+/)
    .filter((t) => t.length > 0);
}

function aggregateSummary(records: SecurityFidelityRecord[]): SecurityFidelityReport['summary'] {
  if (records.length === 0) {
    return {
      scenarios: 0,
      avgAccuracyScore: 0,
      avgEventCountDiff: 0,
      avgVerdictMatch: 0,
      avgReasonMatch: 0,
      accuracyMethod: 'sequence-jaccard',
    };
  }
  const acc = records.reduce(
    (agg, r) => ({
      accuracyScore: agg.accuracyScore + r.accuracyScore,
      eventCountDiff: agg.eventCountDiff + r.eventCountDiff,
      verdictMatch: agg.verdictMatch + r.verdictMatch,
      reasonMatch: agg.reasonMatch + r.reasonMatch,
    }),
    { accuracyScore: 0, eventCountDiff: 0, verdictMatch: 0, reasonMatch: 0 },
  );
  return {
    scenarios: records.length,
    avgAccuracyScore: acc.accuracyScore / records.length,
    avgEventCountDiff: acc.eventCountDiff / records.length,
    avgVerdictMatch: acc.verdictMatch / records.length,
    avgReasonMatch: acc.reasonMatch / records.length,
    accuracyMethod: 'sequence-jaccard',
  };
}

/**
 * 32 grid の全 combination を SSOT で列挙 — provider x axis の
 * どの組合せが fidelity harness の一次対象か明示する。
 */
export const SECURITY_FIDELITY_GRID: {
  provider: SecurityProvider;
  axis: SecurityAxis;
}[] = (() => {
  const providers: SecurityProvider[] = ['helmet', 'express-rate-limit', 'casbin', 'coraza'];
  const axes: SecurityAxis[] = [
    'csp',
    'rate-limit',
    'authorization',
    'waf',
    'threat-model',
    'secrets-scan',
    'sbom',
    'security-headers',
  ];
  const out: { provider: SecurityProvider; axis: SecurityAxis }[] = [];
  for (const provider of providers) {
    for (const axis of axes) {
      out.push({ provider, axis });
    }
  }
  return out;
})();
