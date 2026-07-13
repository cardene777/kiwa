/**
 * Mobile adapter types (v0.4、 pair 深度 4 段拡張達成 4 例目 depth-4 record)。
 *
 * v0.1 semantics + v0.2 env-gate helper + v0.3 New Architecture semantics に
 * 加えて v0.4 で adapter interface を追加、 11 axis × mock/real = 22 adapter
 * を pair layer 化。 v1.54+ で real adapter を child_process.spawn 実装に置換
 * 予定。 backward compat 絶対維持。
 */
import type { AxisStep, MobileAxis, MobileTarget, NeutralEventName } from '../semantics/types.js';

export type AdapterMode = 'mock' | 'real';

export const ADAPTER_MODES: readonly AdapterMode[] = ['mock', 'real'];
export function isAdapterMode(value: unknown): value is AdapterMode {
  return (
    typeof value === 'string' &&
    (ADAPTER_MODES as readonly string[]).includes(value)
  );
}

export interface AdapterInvocation {
  scanId: string;
  target: MobileTarget;
  mode: AdapterMode;
  metadata?: Record<string, string | number | boolean>;
}

export interface AdapterResult {
  axis: MobileAxis;
  target: MobileTarget;
  mode: AdapterMode;
  completed: boolean;
  eventCount: number;
  durationMs: number;
  history: AxisStep<string>[];
  neutralEvents: NeutralEventName[];
}

export interface MobileAdapter {
  axis: MobileAxis;
  scan(input: AdapterInvocation): Promise<AdapterResult>;
}
