/**
 * v0.4 fidelity harness — mock/real trace diff 検証。
 * 全 11 axis で mock vs real の neutralEvents 一致 + completed 一致を確認。
 */
import type { MobileAxis, MobileTarget } from '../semantics/types.js';
import { MOCK_ADAPTERS, REAL_ADAPTERS } from './mock-factory.js';
import type { AdapterInvocation } from './types.js';

export interface FidelityDiff {
  axis: MobileAxis;
  target: MobileTarget;
  neutralEventsMatch: boolean;
  completedMatch: boolean;
  mockNeutralEvents: string[];
  realNeutralEvents: string[];
}

export async function runFidelityCheck(
  axes: MobileAxis[],
  targets: MobileTarget[] = ['ios', 'android', 'web'],
): Promise<FidelityDiff[]> {
  const results: FidelityDiff[] = [];
  for (const axis of axes) {
    for (const target of targets) {
      const invMock: AdapterInvocation = { scanId: 'fid', target, mode: 'mock' };
      const invReal: AdapterInvocation = { scanId: 'fid', target, mode: 'real' };
      const mockResult = await MOCK_ADAPTERS[axis].scan(invMock);
      const realResult = await REAL_ADAPTERS[axis].scan(invReal);
      const mockEvents = mockResult.neutralEvents;
      const realEvents = realResult.neutralEvents;
      results.push({
        axis,
        target,
        neutralEventsMatch:
          mockEvents.length === realEvents.length &&
          mockEvents.every((e, i) => e === realEvents[i]),
        completedMatch: mockResult.completed === realResult.completed,
        mockNeutralEvents: mockEvents,
        realNeutralEvents: realEvents,
      });
    }
  }
  return results;
}

export function summarizeFidelity(diffs: FidelityDiff[]): {
  total: number;
  matched: number;
  mismatched: number;
  perAxis: Array<{ axis: MobileAxis; matched: number; total: number }>;
} {
  const total = diffs.length;
  const matched = diffs.filter((d) => d.neutralEventsMatch && d.completedMatch).length;
  const mismatched = total - matched;
  const perAxisMap = new Map<MobileAxis, { matched: number; total: number }>();
  for (const d of diffs) {
    const cur = perAxisMap.get(d.axis) ?? { matched: 0, total: 0 };
    cur.total += 1;
    if (d.neutralEventsMatch && d.completedMatch) cur.matched += 1;
    perAxisMap.set(d.axis, cur);
  }
  return {
    total,
    matched,
    mismatched,
    perAxis: Array.from(perAxisMap.entries()).map(([axis, x]) => ({
      axis,
      matched: x.matched,
      total: x.total,
    })),
  };
}
