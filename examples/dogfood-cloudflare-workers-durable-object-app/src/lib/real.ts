/**
 * "Real" adapter — targets a real Cloudflare Workers runtime via
 * `miniflare` (or, when `WRANGLER_KEY=1` is set, a `wrangler dev`
 * subprocess). When `KIWA_MODE=real` is not set or `WRANGLER_KEY` is
 * missing the adapter returns a `skipped` variant whose every method
 * records `KIWA_CF_DURABLE_OBJECT_ENV_MISSING` and throws a
 * distinguished error. Tests use this behaviour to short-circuit
 * gracefully — the fidelity report captures "environment absent" rather
 * than failing the whole suite in local dev.
 *
 * The real driving is intentionally lazy — we do not eagerly import
 * `miniflare` or spawn `wrangler` because the workspace does not need
 * them for the mock path. When both env gates are satisfied, the
 * connected implementation would spawn miniflare with the same DO binding
 * + WebSocket handler as the mock adapter and mirror the trace shape.
 *
 * v1.24-2 (this Sub-Issue) ships the skip path only — a follow-up milestone
 * hooks a real miniflare runtime when the caller opts in, so the fidelity
 * harness's env-gate converges on the same 2-line detect logic across all
 * v1.24 dogfoods.
 */

import type {
  AlarmPurgeSnapshot,
  ChatRoomBroadcastSnapshot,
  ChatRoomJoinSnapshot,
  CloudflareDurableObjectAdapter,
  StorageTransactionSnapshot,
  TraceEvent,
  WebSocketCloseSnapshot,
  WebSocketHibernationSnapshot,
  WebSocketMessageSnapshot,
  WebSocketUpgradeSnapshot,
} from './cf-adapter.js';

const MISSING_ENV_ERROR = 'KIWA_CF_DURABLE_OBJECT_ENV_MISSING';

export interface RealAdapterEnv {
  kiwaMode: 'real';
  wranglerKey: boolean;
}

/**
 * Detect whether the current process can drive a real Cloudflare Workers
 * runtime. Returns `null` when at least one env gate fails (skip path);
 * returns the parsed env object when both gates are satisfied.
 *
 * Env gates:
 *  - `KIWA_MODE=real`  — explicit opt-in flag shared across all v1.24
 *    dogfoods so the same test suite can toggle between mock and real
 *    without spawning miniflare in CI runs.
 *  - `WRANGLER_KEY=1`  — proxy for "wrangler is installed + authorized",
 *    used because `wrangler dev` in a subprocess is expensive.
 */
export function detectRealEnv(): RealAdapterEnv | null {
  if (process.env['KIWA_MODE'] !== 'real') return null;
  if (process.env['WRANGLER_KEY'] !== '1') return null;
  return { kiwaMode: 'real', wranglerKey: true };
}

/** Distinguished error emitted when the real adapter runs without env. */
export class SkippedError extends Error {
  readonly code = MISSING_ENV_ERROR;
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because KIWA_MODE=real + WRANGLER_KEY=1 are not both set (real Cloudflare Workers runtime requires opt-in)`,
    );
  }
}

export function makeRealAdapter(): CloudflareDurableObjectAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): CloudflareDurableObjectAdapter {
  const trace: TraceEvent[] = [];

  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: MISSING_ENV_ERROR });
    throw new SkippedError(op);
  }

  return {
    mode: 'real',
    traces: () => [...trace],
    driveRoomJoin: async () => unsupported<ChatRoomJoinSnapshot>('driveRoomJoin'),
    driveRoomBroadcast: async () =>
      unsupported<ChatRoomBroadcastSnapshot>('driveRoomBroadcast'),
    driveStorageTx: async () => unsupported<StorageTransactionSnapshot>('driveStorageTx'),
    driveAlarmPurge: async () => unsupported<AlarmPurgeSnapshot>('driveAlarmPurge'),
    driveWsUpgrade: async () => unsupported<WebSocketUpgradeSnapshot>('driveWsUpgrade'),
    driveWsSend: async () => unsupported<WebSocketMessageSnapshot>('driveWsSend'),
    driveWsClose: async () => unsupported<WebSocketCloseSnapshot>('driveWsClose'),
    driveWsHibernation: async () =>
      unsupported<WebSocketHibernationSnapshot>('driveWsHibernation'),
    metrics: () => ({
      latencySamplesMs: [],
      roomJoinCount: 0,
      roomBroadcastCount: 0,
      storageTxCount: 0,
      alarmPurgeCount: 0,
      wsUpgradeCount: 0,
      wsSendCount: 0,
      wsCloseCount: 0,
      wsHibernationCount: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(env: RealAdapterEnv): CloudflareDurableObjectAdapter {
  const trace: TraceEvent[] = [];
  const noteEnv: TraceEvent = {
    op: 'connect',
    ok: false,
    errorKind: 'KIWA_CF_DURABLE_OBJECT_LIVE_NOT_IMPLEMENTED',
    detail: { kiwaMode: env.kiwaMode, wranglerKey: env.wranglerKey },
  };
  trace.push(noteEnv);
  function unsupported<T>(op: string): T {
    trace.push({
      op,
      ok: false,
      errorKind: 'KIWA_CF_DURABLE_OBJECT_LIVE_NOT_IMPLEMENTED',
      detail: { kiwaMode: env.kiwaMode, wranglerKey: env.wranglerKey },
    });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    driveRoomJoin: async () => unsupported<ChatRoomJoinSnapshot>('driveRoomJoin'),
    driveRoomBroadcast: async () =>
      unsupported<ChatRoomBroadcastSnapshot>('driveRoomBroadcast'),
    driveStorageTx: async () => unsupported<StorageTransactionSnapshot>('driveStorageTx'),
    driveAlarmPurge: async () => unsupported<AlarmPurgeSnapshot>('driveAlarmPurge'),
    driveWsUpgrade: async () => unsupported<WebSocketUpgradeSnapshot>('driveWsUpgrade'),
    driveWsSend: async () => unsupported<WebSocketMessageSnapshot>('driveWsSend'),
    driveWsClose: async () => unsupported<WebSocketCloseSnapshot>('driveWsClose'),
    driveWsHibernation: async () =>
      unsupported<WebSocketHibernationSnapshot>('driveWsHibernation'),
    metrics: () => ({
      latencySamplesMs: [],
      roomJoinCount: 0,
      roomBroadcastCount: 0,
      storageTxCount: 0,
      alarmPurgeCount: 0,
      wsUpgradeCount: 0,
      wsSendCount: 0,
      wsCloseCount: 0,
      wsHibernationCount: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}
