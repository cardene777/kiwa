import {
  containerSecurityMockAdapter,
  containerSecurityRealAdapter,
  dastMockAdapter,
  dastRealAdapter,
  iacScanMockAdapter,
  iacScanRealAdapter,
  sastMockAdapter,
  sastRealAdapter,
  scaMockAdapter,
  scaRealAdapter,
  secretScanMockAdapter,
  secretScanRealAdapter,
  type AdapterInvocation,
  type AdapterMode,
} from '@kiwa/security-devsecops';

/**
 * DevSecOps 6 axis adapter workflow — v0.2 の mock/real adapter を横断的に
 * 実行する dogfood app。 mode=mock は常時 pass、 mode=real は env-gate 通過時のみ。
 */
export interface WorkflowResult {
  axis: string;
  mode: AdapterMode;
  completed: boolean;
  eventCount: number;
  durationMs: number;
}

export async function runAdapterWorkflow(
  mode: AdapterMode,
  target: string = '/repo',
): Promise<WorkflowResult[]> {
  const inv = (scanId: string): AdapterInvocation => ({ scanId, target, mode });
  const adapters = mode === 'mock'
    ? [
        sastMockAdapter,
        scaMockAdapter,
        secretScanMockAdapter,
        iacScanMockAdapter,
        dastMockAdapter,
        containerSecurityMockAdapter,
      ]
    : [
        sastRealAdapter,
        scaRealAdapter,
        secretScanRealAdapter,
        iacScanRealAdapter,
        dastRealAdapter,
        containerSecurityRealAdapter,
      ];
  const results: WorkflowResult[] = [];
  let i = 0;
  for (const adapter of adapters) {
    const r = await adapter.scan(inv(`${adapter.axis}-${i++}`));
    results.push({
      axis: r.axis,
      mode: r.mode,
      completed: r.completed,
      eventCount: r.history.length,
      durationMs: r.durationMs,
    });
  }
  return results;
}

export function diffFidelity(
  mockResults: WorkflowResult[],
  realResults: WorkflowResult[],
): { axis: string; matched: boolean; mockEvents: number; realEvents: number }[] {
  const out: { axis: string; matched: boolean; mockEvents: number; realEvents: number }[] = [];
  for (const m of mockResults) {
    const r = realResults.find((x) => x.axis === m.axis);
    if (!r) {
      out.push({ axis: m.axis, matched: false, mockEvents: m.eventCount, realEvents: 0 });
      continue;
    }
    out.push({
      axis: m.axis,
      matched: m.completed === r.completed,
      mockEvents: m.eventCount,
      realEvents: r.eventCount,
    });
  }
  return out;
}
