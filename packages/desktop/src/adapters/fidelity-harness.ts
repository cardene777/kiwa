/**
 * Fidelity harness (v0.4)。 mock/real の trace diff を検証、 12 axis × 3 target = 36 pair の
 * neutral event 列一致を保証する。 shape 契約 preserving 段階では diff 0 (v1.60+ で real
 * 実装後の behavior diff 発生時に本 harness が early warning を出す設計)。
 */
import type { DesktopAxis, DesktopTarget, NeutralEventName } from '../semantics/types.js';
import { MOCK_ADAPTERS, REAL_ADAPTERS } from './mock-factory.js';
import type { AdapterInvocation, AdapterResult } from './types.js';

export interface FidelityDiff {
  axis: DesktopAxis;
  target: DesktopTarget;
  mockEvents: NeutralEventName[];
  realEvents: NeutralEventName[];
  matched: boolean;
  mockCompleted: boolean;
  realCompleted: boolean;
}

const ALL_AXES: DesktopAxis[] = [
  'electron',
  'tauri',
  'webview',
  'auto-updater',
  'fs-permissions',
  'notification',
  'menu-bar',
  'tray-icon',
  'screen-recording',
  'global-shortcut',
  'clipboard',
  'dark-mode',
];

const ALL_TARGETS: DesktopTarget[] = ['macos', 'windows', 'linux'];

function sameEvents(a: NeutralEventName[], b: NeutralEventName[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export async function runFidelityCheck(input: {
  scanIdPrefix?: string;
  axes?: DesktopAxis[];
  targets?: DesktopTarget[];
}): Promise<FidelityDiff[]> {
  const axes = input.axes ?? ALL_AXES;
  const targets = input.targets ?? ALL_TARGETS;
  const prefix = input.scanIdPrefix ?? 'fidelity';
  const diffs: FidelityDiff[] = [];
  for (const axis of axes) {
    for (const target of targets) {
      const baseInv: Omit<AdapterInvocation, 'mode'> = {
        scanId: `${prefix}-${axis}-${target}`,
        target,
      };
      const mockResult: AdapterResult = await MOCK_ADAPTERS[axis].scan({ ...baseInv, mode: 'mock' });
      const realResult: AdapterResult = await REAL_ADAPTERS[axis].scan({ ...baseInv, mode: 'real' });
      diffs.push({
        axis,
        target,
        mockEvents: mockResult.neutralEvents,
        realEvents: realResult.neutralEvents,
        matched: sameEvents(mockResult.neutralEvents, realResult.neutralEvents),
        mockCompleted: mockResult.completed,
        realCompleted: realResult.completed,
      });
    }
  }
  return diffs;
}

export interface FidelitySummary {
  total: number;
  matched: number;
  unmatched: number;
  matchedRatio: number;
  perAxis: Record<DesktopAxis, { matched: number; total: number }>;
}

export function summarizeFidelity(diffs: FidelityDiff[]): FidelitySummary {
  const perAxis: Record<string, { matched: number; total: number }> = {};
  let matched = 0;
  for (const d of diffs) {
    const bucket = (perAxis[d.axis] ??= { matched: 0, total: 0 });
    bucket.total += 1;
    if (d.matched && d.mockCompleted && d.realCompleted) {
      bucket.matched += 1;
      matched += 1;
    }
  }
  const total = diffs.length;
  return {
    total,
    matched,
    unmatched: total - matched,
    matchedRatio: total === 0 ? 1 : matched / total,
    perAxis: perAxis as Record<DesktopAxis, { matched: number; total: number }>,
  };
}
