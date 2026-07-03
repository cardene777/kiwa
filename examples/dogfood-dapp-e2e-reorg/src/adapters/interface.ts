/**
 * Provider-neutral reorg adapter interface.
 *
 * The dogfood harness talks to the chain only through this shape so
 * `makeMockAdapter` (anvil fork mainnet + evm_snapshot / evm_revert) and
 * `makeRealAdapter` (Sepolia testnet, env-skip via TESTNET_RPC_URL) satisfy
 * the same contract. Fidelity is measured by comparing the trace both
 * adapters emit for the same 4-op sequence: pendingTx / confirmedTx /
 * transferEvent / nonceGap.
 *
 * Ops
 *   pendingTx        — submit tx, keep in mempool, snapshot, revert, observe drop
 *   confirmedTx      — snapshot, mine tx, revert, observe balance rollback
 *   transferEvent    — snapshot, mine 3 txs, revert, observe log list truncation
 *   nonceGap         — snapshot, mine tx, revert, re-submit at same nonce
 */

export type ReorgOp =
  | 'pendingTx'
  | 'confirmedTx'
  | 'transferEvent'
  | 'nonceGap';

export interface TraceEvent {
  op: ReorgOp | string;
  ok: boolean;
  errorKind?: string;
  latencyMs?: number;
  detail?: unknown;
}

export interface AdapterMetrics {
  latencySamplesMs: number[];
  pendingTxInvocations: number;
  confirmedTxInvocations: number;
  transferEventInvocations: number;
  nonceGapInvocations: number;
}

export interface ReorgScenarioResult {
  op: ReorgOp;
  before: {
    balance: bigint;
    logCount: number;
    nonce: number;
  };
  after: {
    balance: bigint;
    logCount: number;
    nonce: number;
    txStatus: 'pending' | 'confirmed' | 'dropped' | 'unknown';
  };
}

export interface ReorgAdapter {
  mode: 'mock' | 'real';
  traces(): TraceEvent[];
  metrics(): AdapterMetrics;
  reset(): Promise<void>;

  pendingTx(): Promise<ReorgScenarioResult>;
  confirmedTx(): Promise<ReorgScenarioResult>;
  transferEvent(): Promise<ReorgScenarioResult>;
  nonceGap(): Promise<ReorgScenarioResult>;
}

/** Distinguished error emitted when the real adapter is asked to run without
 *  the required environment. Callers should catch it and let the fidelity
 *  harness record the divergence rather than aborting the whole suite. */
export class SkippedError extends Error {
  readonly code: string;
  constructor(op: string, reason: string) {
    super(`SkippedError: cannot execute ${op}: ${reason}`);
    this.code = 'REORG_REAL_ENV_MISSING';
  }
}

export const OPS_UNDER_TEST: ReorgOp[] = [
  'pendingTx',
  'confirmedTx',
  'transferEvent',
  'nonceGap',
];
