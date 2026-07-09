import type { VisualReviewEntry } from '@kiwa-lab/component';
import type {
  BaselineSeedOutcome,
  CaptureOutcome,
  ReviewOutcome,
  TraceEvent,
  VisualRegressionAdapter,
} from './interface.js';

/**
 * "Real" adapter — targets a real `chromatic-cli` upload flow. When
 * `CHROMATIC_PROJECT_TOKEN` is not set the adapter returns a `skipped` variant
 * whose every method records a `CHROMATIC_REAL_ENV_MISSING` trace and throws
 * a distinguished error. Tests use this behaviour to short-circuit gracefully
 * — the fidelity report captures "environment absent" rather than failing the
 * whole suite in local dev.
 *
 * The real driving is intentionally lazy — we do not eagerly install
 * `chromatic` (or a browser runtime) because the workspace does not need one
 * for the mock path. When `CHROMATIC_PROJECT_TOKEN=...` is set, the connected
 * implementation would forward each op to the `chromatic` CLI (baseline upload
 * + diff + review), mirroring the trace shape.
 *
 * The v0.1 dogfood ships the skip path plus a `CHROMATIC_LIVE_NOT_IMPLEMENTED`
 * placeholder for the connected path — a follow-up "live" harness hooks a real
 * chromatic-cli invocation when the caller sets the env, so the perf and
 * fidelity paths converge on the same env-detect logic.
 */

export interface RealAdapterEnv {
  chromaticToken: string;
  chromaticStorybookUrl?: string | undefined;
  chromaticBranch?: string | undefined;
}

const DEFAULT_TOKEN_ENV = 'CHROMATIC_PROJECT_TOKEN';

export function detectRealEnv(): RealAdapterEnv | null {
  const token = process.env[DEFAULT_TOKEN_ENV];
  if (!token) return null;
  const env: RealAdapterEnv = {
    chromaticToken: token,
    chromaticStorybookUrl: process.env['CHROMATIC_STORYBOOK_URL'],
    chromaticBranch: process.env['CHROMATIC_BRANCH'],
  };
  return env;
}

/**
 * Distinguished error emitted when the real adapter cannot service a call.
 * Two flavours —
 *
 * - `code='CHROMATIC_REAL_ENV_MISSING'` — thrown by the skip path when
 *   `CHROMATIC_PROJECT_TOKEN` is not set (local dev with no Chromatic token)
 * - `code='CHROMATIC_LIVE_NOT_IMPLEMENTED'` — thrown by the connected path
 *   when the token is set but the v0.1 driver still has no live wiring
 *
 * Callers should catch it and let the fidelity harness record the divergence
 * rather than aborting the whole suite. The `code` field lets the trace layer
 * and downstream reporting distinguish "env absent" from "env present, driver
 * not yet implemented" without string-matching the message.
 */
export type SkippedErrorCode =
  | 'CHROMATIC_REAL_ENV_MISSING'
  | 'CHROMATIC_LIVE_NOT_IMPLEMENTED';

export class SkippedError extends Error {
  readonly code: SkippedErrorCode;
  constructor(op: string, code: SkippedErrorCode) {
    super(
      code === 'CHROMATIC_REAL_ENV_MISSING'
        ? `SkippedError: cannot execute ${op} because CHROMATIC_PROJECT_TOKEN is not set (real Chromatic upload requires a project token from chromatic.com)`
        : `SkippedError: cannot execute ${op} because the connected chromatic-cli driver is not yet implemented in v0.1 (token is set but the live upload path is a placeholder — a follow-up milestone swaps in the real driver)`,
    );
    this.code = code;
  }
}

export function makeRealAdapter(): VisualRegressionAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): VisualRegressionAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'CHROMATIC_REAL_ENV_MISSING' });
    throw new SkippedError(op, 'CHROMATIC_REAL_ENV_MISSING');
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    seedBaselines: async () => unsupported<BaselineSeedOutcome[]>('seedBaselines'),
    captureOne: async () => unsupported<CaptureOutcome>('captureOne'),
    captureAll: async () => unsupported<CaptureOutcome[]>('captureAll'),
    review: async () => unsupported<ReviewOutcome>('review'),
    reviewHistory: (): VisualReviewEntry[] => [],
    metrics: () => ({
      latencySamplesMs: [],
      seedInvocations: 0,
      captureInvocations: 0,
      reviewInvocations: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

/**
 * Connected real-mode driver — v0.1 ships as a placeholder that records a
 * `CHROMATIC_LIVE_NOT_IMPLEMENTED` trace event so the fidelity harness reads
 * the divergence. The intent is to swap this for a real `chromatic-cli`
 * upload + diff + review flow in a follow-up milestone once the caller opts
 * in with `CHROMATIC_PROJECT_TOKEN` and the workspace hosts a browser runtime
 * for the Storybook preview build.
 *
 * The trace shape is intentionally identical to the skip path (mode='real',
 * errorKind on every trace) so the release-gate divergence count reports the
 * same "absent" signal without a shape-level noise diff.
 */
function makeConnectedRealAdapter(env: RealAdapterEnv): VisualRegressionAdapter {
  const trace: TraceEvent[] = [];
  const noteEnv: TraceEvent = {
    op: 'connect',
    ok: false,
    errorKind: 'CHROMATIC_LIVE_NOT_IMPLEMENTED',
    detail: {
      chromaticStorybookUrl: env.chromaticStorybookUrl ?? '(unset)',
    },
  };
  trace.push(noteEnv);
  function unsupported<T>(op: string): T {
    trace.push({
      op,
      ok: false,
      errorKind: 'CHROMATIC_LIVE_NOT_IMPLEMENTED',
      detail: {
        chromaticStorybookUrl: env.chromaticStorybookUrl ?? '(unset)',
      },
    });
    throw new SkippedError(op, 'CHROMATIC_LIVE_NOT_IMPLEMENTED');
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    seedBaselines: async () => unsupported<BaselineSeedOutcome[]>('seedBaselines'),
    captureOne: async () => unsupported<CaptureOutcome>('captureOne'),
    captureAll: async () => unsupported<CaptureOutcome[]>('captureAll'),
    review: async () => unsupported<ReviewOutcome>('review'),
    reviewHistory: (): VisualReviewEntry[] => [],
    metrics: () => ({
      latencySamplesMs: [],
      seedInvocations: 0,
      captureInvocations: 0,
      reviewInvocations: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}
