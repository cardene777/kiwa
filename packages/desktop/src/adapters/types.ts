/**
 * Desktop adapter types (v0.4、 pair 深度 4 段拡張達成 5 例目 depth-4 record)。
 *
 * v0.1 semantics 3 axis + v0.2 advanced I 5 axis + v0.3 advanced III 4 axis に
 * 加えて v0.4 で adapter interface を追加、 12 axis × mock/real = 24 adapter を
 * pair layer 化、 3 target × 12 axis × 2 mode = 72 combination fidelity。
 * v1.60+ で real adapter を実 OS API 呼出 (electron-updater / SCStream / NSPasteboard
 * 等) に置換予定。 backward compat 絶対維持。
 */
import type { AxisStep, DesktopAxis, DesktopTarget, NeutralEventName } from '../semantics/types.js';

export type AdapterMode = 'mock' | 'real';

export interface AdapterInvocation {
  scanId: string;
  target: DesktopTarget;
  mode: AdapterMode;
  metadata?: Record<string, string | number | boolean>;
}

export interface AdapterResult {
  axis: DesktopAxis;
  target: DesktopTarget;
  mode: AdapterMode;
  completed: boolean;
  eventCount: number;
  durationMs: number;
  history: AxisStep<string>[];
  neutralEvents: NeutralEventName[];
}

export interface DesktopAdapter {
  axis: DesktopAxis;
  scan(input: AdapterInvocation): Promise<AdapterResult>;
}
