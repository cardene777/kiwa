import {
  completeSastScan,
  detectSastFinding,
  startSastScan,
  type SastState,
} from '../semantics/sast.js';
import type {
  AdapterInvocation,
  AdapterResult,
  SastAdapter,
} from './types.js';

/**
 * SAST mock adapter — Semgrep-neutral pattern を semantics 経路で
 * deterministic に再生する。 `input.metadata.presetFindings` に JSON 文字列で
 * 事前 finding を渡す経路も持つ (test fixture 用)。
 */
export const sastMockAdapter: SastAdapter = {
  axis: 'sast',
  async scan(input: AdapterInvocation): Promise<AdapterResult<SastState>> {
    const session = startSastScan({ scanId: input.scanId, target: input.target });
    detectSastFinding(session, {
      ruleId: 'mock-rule-hardcoded-secret',
      filePath: `${input.target}/src/config.ts`,
      line: 12,
      severity: 'high',
      message: 'mock finding: hardcoded credential',
    });
    detectSastFinding(session, {
      ruleId: 'mock-rule-sql-injection',
      filePath: `${input.target}/src/db.ts`,
      line: 45,
      severity: 'critical',
      message: 'mock finding: unparameterized SQL',
    });
    completeSastScan(session);
    return {
      axis: 'sast',
      mode: 'mock',
      history: session.history,
      completed: session.state === 'completed',
      durationMs: 1,
    };
  },
};
