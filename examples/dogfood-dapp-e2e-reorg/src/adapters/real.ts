/**
 * Real reorg adapter — targets a live testnet RPC (Sepolia recommended) via
 * `TESTNET_RPC_URL`. When the env var is not set the adapter returns a
 * `skipped` variant whose every method records a `REORG_REAL_ENV_MISSING`
 * trace and throws `SkippedError`, so the fidelity harness records the
 * divergence instead of failing the whole suite. The dogfood ships the skip
 * path — a follow-up perf harness hooks a live testnet driver behind the
 * same env-detect logic when contributors want to measure real vs mock on a
 * public network.
 */

import type {
  AdapterMetrics,
  ReorgAdapter,
  ReorgScenarioResult,
  TraceEvent,
} from './interface.js';
import { SkippedError } from './interface.js';

export interface RealAdapterEnv {
  rpcUrl: string;
  privateKey?: string | undefined;
  contractAddress?: string | undefined;
}

const DEFAULT_ENDPOINT_ENV = 'TESTNET_RPC_URL';

export function detectRealEnv(): RealAdapterEnv | null {
  const rpc = process.env[DEFAULT_ENDPOINT_ENV];
  if (!rpc) return null;
  return {
    rpcUrl: rpc,
    privateKey: process.env['TESTNET_PRIVATE_KEY'],
    contractAddress: process.env['TESTNET_TOKEN_ADDRESS'],
  };
}

export function makeRealAdapter(): ReorgAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  // Live driver not implemented in v0.1 — testnets do not expose evm_snapshot
  // / evm_revert primitives, so reorg simulation must go through a fork test
  // that mirrors the state; that path is opt-in and out of scope for this
  // dogfood. Return a skipped adapter with a distinct error kind so the
  // fidelity report distinguishes env-missing from live-not-implemented.
  return makeLiveNotImplementedAdapter(env);
}

function makeSkippedRealAdapter(): ReorgAdapter {
  const trace: TraceEvent[] = [];
  const metrics: AdapterMetrics = {
    latencySamplesMs: [],
    pendingTxInvocations: 0,
    confirmedTxInvocations: 0,
    transferEventInvocations: 0,
    nonceGapInvocations: 0,
  };
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'REORG_REAL_ENV_MISSING' });
    throw new SkippedError(
      op,
      'TESTNET_RPC_URL is not set (Sepolia RPC endpoint required)',
    );
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    metrics: () => ({
      ...metrics,
      latencySamplesMs: [...metrics.latencySamplesMs],
    }),
    reset: async () => {},
    pendingTx: async () => unsupported<ReorgScenarioResult>('pendingTx'),
    confirmedTx: async () => unsupported<ReorgScenarioResult>('confirmedTx'),
    transferEvent: async () => unsupported<ReorgScenarioResult>('transferEvent'),
    nonceGap: async () => unsupported<ReorgScenarioResult>('nonceGap'),
  };
}

function makeLiveNotImplementedAdapter(env: RealAdapterEnv): ReorgAdapter {
  const trace: TraceEvent[] = [];
  const metrics: AdapterMetrics = {
    latencySamplesMs: [],
    pendingTxInvocations: 0,
    confirmedTxInvocations: 0,
    transferEventInvocations: 0,
    nonceGapInvocations: 0,
  };
  function unsupported<T>(op: string): T {
    trace.push({
      op,
      ok: false,
      errorKind: 'REORG_LIVE_NOT_IMPLEMENTED',
      detail: { rpcUrl: env.rpcUrl },
    });
    throw new SkippedError(
      op,
      `live testnet driver not implemented in v0.1 (rpc=${env.rpcUrl})`,
    );
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    metrics: () => ({
      ...metrics,
      latencySamplesMs: [...metrics.latencySamplesMs],
    }),
    reset: async () => {},
    pendingTx: async () => unsupported<ReorgScenarioResult>('pendingTx'),
    confirmedTx: async () => unsupported<ReorgScenarioResult>('confirmedTx'),
    transferEvent: async () => unsupported<ReorgScenarioResult>('transferEvent'),
    nonceGap: async () => unsupported<ReorgScenarioResult>('nonceGap'),
  };
}
