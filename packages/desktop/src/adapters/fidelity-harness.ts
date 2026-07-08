/**
 * Fidelity harness (v0.7)。 mock/real の trace diff を検証、 12 axis × 3 target = 36 pair の
 * neutral event 列一致を保証しつつ、 v0.7 で behavior diff (metadata / duration) を early
 * warning 検知する pattern 拡張。
 *
 * shape 契約 preserving = neutralEvents 順序 + eventCount 一致 (matched=true)
 * behavior diff = metadata + duration + state / completed 差異、 metadataDiff 経路で report
 */
import type { AxisStep, DesktopAxis, DesktopTarget, NeutralEventName } from '../semantics/types.js';
import { MOCK_ADAPTERS, REAL_ADAPTERS } from './mock-factory.js';
import { shouldSkipAxis } from './probe.js';
import type { AdapterInvocation, AdapterResult } from './types.js';

export interface FidelityDiff {
  axis: DesktopAxis;
  target: DesktopTarget;
  mockEvents: NeutralEventName[];
  realEvents: NeutralEventName[];
  matched: boolean;
  mockCompleted: boolean;
  realCompleted: boolean;
  /** v0.7: mock/real の metadata 差異検知 (step 別) */
  metadataDiffs: MetadataDiff[];
  /** v0.7: mock/real の duration 差異 (絶対値 ms) */
  durationDiffMs: number;
}

export interface MetadataDiff {
  stepIndex: number;
  neutralEvent: NeutralEventName;
  key: string;
  mockValue: string | number | boolean | undefined;
  realValue: string | number | boolean | undefined;
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

function collectMetadataDiffs(
  mockHistory: AxisStep<string>[],
  realHistory: AxisStep<string>[],
): MetadataDiff[] {
  const diffs: MetadataDiff[] = [];
  const len = Math.min(mockHistory.length, realHistory.length);
  for (let i = 0; i < len; i += 1) {
    const m = mockHistory[i];
    const r = realHistory[i];
    if (!m || !r) continue;
    const keys = new Set([...Object.keys(m.metadata), ...Object.keys(r.metadata)]);
    for (const key of keys) {
      const mv = m.metadata[key];
      const rv = r.metadata[key];
      if (mv !== rv) {
        diffs.push({
          stepIndex: i,
          neutralEvent: m.neutralEvent,
          key,
          mockValue: mv,
          realValue: rv,
        });
      }
    }
  }
  return diffs;
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
        metadataDiffs: collectMetadataDiffs(mockResult.history, realResult.history),
        durationDiffMs: Math.abs(mockResult.durationMs - realResult.durationMs),
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

/**
 * v0.7 behavior diff summary — shape 契約 preserving (matched=true) を保ったまま、
 * mock/real で異なる behavior (metadata + duration) を per-axis で集計。
 * v1.62+ real 実装後の behavior drift を early warning 検知する経路。
 */
export interface FidelityBehaviorSummary {
  total: number;
  axesWithBehaviorDiff: DesktopAxis[];
  totalMetadataDiffs: number;
  perAxis: Record<
    DesktopAxis,
    {
      metadataDiffCount: number;
      maxDurationDiffMs: number;
      hasBehaviorDiff: boolean;
    }
  >;
}

/**
 * v0.8 = probe integration 経路の fidelity check。
 * shouldSkipAxis で skip 判定された pair は skippedPairs に記録、 diffs から除外。
 * shape 契約 preserving 絶対維持 = skip 経路は skippedPairs 経由で追跡可能。
 */
export interface SkippedPair {
  axis: DesktopAxis;
  target: DesktopTarget;
  reason: string;
}

export interface FidelityCheckWithProbeResult {
  diffs: FidelityDiff[];
  skippedPairs: SkippedPair[];
}

export async function runFidelityCheckWithProbe(input: {
  scanIdPrefix?: string;
  axes?: DesktopAxis[];
  targets?: DesktopTarget[];
}): Promise<FidelityCheckWithProbeResult> {
  const axes = input.axes ?? ALL_AXES;
  const targets = input.targets ?? ALL_TARGETS;
  const prefix = input.scanIdPrefix ?? 'fidelity-probe';
  const diffs: FidelityDiff[] = [];
  const skippedPairs: SkippedPair[] = [];

  for (const axis of axes) {
    for (const target of targets) {
      const decision = shouldSkipAxis(axis, target);
      if (decision.skip) {
        skippedPairs.push({ axis, target, reason: decision.reason ?? 'unknown' });
        continue;
      }
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
        metadataDiffs: collectMetadataDiffs(mockResult.history, realResult.history),
        durationDiffMs: Math.abs(mockResult.durationMs - realResult.durationMs),
      });
    }
  }
  return { diffs, skippedPairs };
}

export function summarizeFidelityBehaviorDiff(diffs: FidelityDiff[]): FidelityBehaviorSummary {
  const perAxis: Record<
    string,
    { metadataDiffCount: number; maxDurationDiffMs: number; hasBehaviorDiff: boolean }
  > = {};
  const axesWithBehaviorDiff = new Set<DesktopAxis>();
  let totalMetadataDiffs = 0;

  for (const d of diffs) {
    const bucket = (perAxis[d.axis] ??= {
      metadataDiffCount: 0,
      maxDurationDiffMs: 0,
      hasBehaviorDiff: false,
    });
    bucket.metadataDiffCount += d.metadataDiffs.length;
    if (d.durationDiffMs > bucket.maxDurationDiffMs) {
      bucket.maxDurationDiffMs = d.durationDiffMs;
    }
    if (d.metadataDiffs.length > 0) {
      bucket.hasBehaviorDiff = true;
      axesWithBehaviorDiff.add(d.axis);
    }
    totalMetadataDiffs += d.metadataDiffs.length;
  }

  return {
    total: diffs.length,
    axesWithBehaviorDiff: Array.from(axesWithBehaviorDiff),
    totalMetadataDiffs,
    perAxis: perAxis as Record<
      DesktopAxis,
      { metadataDiffCount: number; maxDurationDiffMs: number; hasBehaviorDiff: boolean }
    >,
  };
}
