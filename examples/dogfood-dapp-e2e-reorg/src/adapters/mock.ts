/**
 * Mock reorg adapter — walks an in-memory chain state entirely in-process.
 *
 * Every scenario mutates a shared `MockChainState` (block height / balances /
 * transfer log list / snapshot stack), so `reorg` is a `pop` from the
 * snapshot stack: balances + logs + nonce all roll back atomically. The
 * fidelity harness diffs the trace this adapter emits against the trace
 * `makeRealAdapter` emits (Sepolia + env-skip) so behavioural divergence
 * surfaces without needing a live network round-trip on every run.
 */

import type {
  AdapterMetrics,
  ReorgAdapter,
  ReorgScenarioResult,
  TraceEvent,
} from './interface.js';

interface LogEntry {
  txHash: string;
  from: string;
  to: string;
  value: bigint;
  blockNumber: number;
}

interface Snapshot {
  blockNumber: number;
  balances: Map<string, bigint>;
  nonces: Map<string, number>;
  logs: LogEntry[];
  mempool: Map<string, PendingTx>;
}

interface PendingTx {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  nonce: number;
}

const OWNER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const RECIPIENT = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
const INITIAL_SUPPLY = 1_000_000n * 10n ** 18n;

export class MockChainState {
  blockNumber = 0;
  balances = new Map<string, bigint>([[OWNER, INITIAL_SUPPLY]]);
  nonces = new Map<string, number>([[OWNER, 0]]);
  logs: LogEntry[] = [];
  mempool = new Map<string, PendingTx>();
  private snapshots: Snapshot[] = [];
  private txCounter = 0;

  snapshot(): number {
    this.snapshots.push({
      blockNumber: this.blockNumber,
      balances: new Map(this.balances),
      nonces: new Map(this.nonces),
      logs: [...this.logs],
      mempool: new Map(this.mempool),
    });
    return this.snapshots.length - 1;
  }

  revert(id: number): boolean {
    if (id < 0 || id >= this.snapshots.length) return false;
    const snap = this.snapshots[id]!;
    this.blockNumber = snap.blockNumber;
    this.balances = new Map(snap.balances);
    this.nonces = new Map(snap.nonces);
    this.logs = [...snap.logs];
    this.mempool = new Map(snap.mempool);
    this.snapshots = this.snapshots.slice(0, id);
    return true;
  }

  submitPending(from: string, to: string, value: bigint): string {
    const nonce = this.nonces.get(from) ?? 0;
    this.txCounter += 1;
    const hash = `0xmock${this.txCounter.toString(16).padStart(60, '0')}`;
    this.mempool.set(hash, { hash, from, to, value, nonce });
    return hash;
  }

  confirmTx(hash: string): boolean {
    const tx = this.mempool.get(hash);
    if (!tx) return false;
    const fromBal = this.balances.get(tx.from) ?? 0n;
    if (fromBal < tx.value) return false;
    this.balances.set(tx.from, fromBal - tx.value);
    this.balances.set(tx.to, (this.balances.get(tx.to) ?? 0n) + tx.value);
    this.nonces.set(tx.from, (this.nonces.get(tx.from) ?? 0) + 1);
    this.blockNumber += 1;
    this.logs.push({
      txHash: hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      blockNumber: this.blockNumber,
    });
    this.mempool.delete(hash);
    return true;
  }

  transferConfirmed(from: string, to: string, value: bigint): string {
    const hash = this.submitPending(from, to, value);
    this.confirmTx(hash);
    return hash;
  }

  balanceOf(addr: string): bigint {
    return this.balances.get(addr) ?? 0n;
  }

  nonceOf(addr: string): number {
    return this.nonces.get(addr) ?? 0;
  }

  logCount(): number {
    return this.logs.length;
  }

  isPending(hash: string): boolean {
    return this.mempool.has(hash);
  }

  isConfirmed(hash: string): boolean {
    return this.logs.some((l) => l.txHash === hash);
  }
}

export function makeMockAdapter(): ReorgAdapter {
  const state = new MockChainState();
  const trace: TraceEvent[] = [];
  const metrics: AdapterMetrics = {
    latencySamplesMs: [],
    pendingTxInvocations: 0,
    confirmedTxInvocations: 0,
    transferEventInvocations: 0,
    nonceGapInvocations: 0,
  };

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    if (extra?.latencyMs !== undefined) entry.latencyMs = extra.latencyMs;
    trace.push(entry);
  }

  async function timed<T>(op: string, run: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const out = await run();
      const latency = performance.now() - start;
      metrics.latencySamplesMs.push(latency);
      record(op, true, { latencyMs: latency });
      return out;
    } catch (err) {
      const latency = performance.now() - start;
      metrics.latencySamplesMs.push(latency);
      record(op, false, {
        errorKind: 'MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
        latencyMs: latency,
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],
    metrics: () => ({
      ...metrics,
      latencySamplesMs: [...metrics.latencySamplesMs],
    }),
    reset: async () => {},

    async pendingTx(): Promise<ReorgScenarioResult> {
      metrics.pendingTxInvocations += 1;
      return timed('pendingTx', () => {
        const before = {
          balance: state.balanceOf(OWNER),
          logCount: state.logCount(),
          nonce: state.nonceOf(OWNER),
        };
        const snapId = state.snapshot();
        const hash = state.submitPending(OWNER, RECIPIENT, 5n * 10n ** 18n);
        const wasPending = state.isPending(hash);
        const reverted = state.revert(snapId);
        const stillPending = state.isPending(hash);
        return {
          op: 'pendingTx' as const,
          before,
          after: {
            balance: state.balanceOf(OWNER),
            logCount: state.logCount(),
            nonce: state.nonceOf(OWNER),
            txStatus: reverted && !stillPending && wasPending ? 'dropped' : 'unknown',
          },
        };
      });
    },

    async confirmedTx(): Promise<ReorgScenarioResult> {
      metrics.confirmedTxInvocations += 1;
      return timed('confirmedTx', () => {
        const before = {
          balance: state.balanceOf(OWNER),
          logCount: state.logCount(),
          nonce: state.nonceOf(OWNER),
        };
        const snapId = state.snapshot();
        const hash = state.transferConfirmed(OWNER, RECIPIENT, 100n * 10n ** 18n);
        const confirmed = state.isConfirmed(hash);
        state.revert(snapId);
        return {
          op: 'confirmedTx' as const,
          before,
          after: {
            balance: state.balanceOf(OWNER),
            logCount: state.logCount(),
            nonce: state.nonceOf(OWNER),
            txStatus: confirmed && state.balanceOf(OWNER) === before.balance ? 'dropped' : 'unknown',
          },
        };
      });
    },

    async transferEvent(): Promise<ReorgScenarioResult> {
      metrics.transferEventInvocations += 1;
      return timed('transferEvent', () => {
        const before = {
          balance: state.balanceOf(OWNER),
          logCount: state.logCount(),
          nonce: state.nonceOf(OWNER),
        };
        const snapId = state.snapshot();
        for (let i = 0; i < 3; i += 1) {
          state.transferConfirmed(OWNER, RECIPIENT, BigInt(i + 1) * 10n ** 18n);
        }
        const midCount = state.logCount();
        state.revert(snapId);
        return {
          op: 'transferEvent' as const,
          before,
          after: {
            balance: state.balanceOf(OWNER),
            logCount: state.logCount(),
            nonce: state.nonceOf(OWNER),
            txStatus: midCount === before.logCount + 3 && state.logCount() === before.logCount
              ? 'dropped'
              : 'unknown',
          },
        };
      });
    },

    async nonceGap(): Promise<ReorgScenarioResult> {
      metrics.nonceGapInvocations += 1;
      return timed('nonceGap', () => {
        const before = {
          balance: state.balanceOf(OWNER),
          logCount: state.logCount(),
          nonce: state.nonceOf(OWNER),
        };
        const snapId = state.snapshot();
        state.transferConfirmed(OWNER, RECIPIENT, 7n * 10n ** 18n);
        const midNonce = state.nonceOf(OWNER);
        state.revert(snapId);
        // Re-send at same nonce — should succeed since chain reverted.
        state.transferConfirmed(OWNER, RECIPIENT, 11n * 10n ** 18n);
        return {
          op: 'nonceGap' as const,
          before,
          after: {
            balance: state.balanceOf(OWNER),
            logCount: state.logCount(),
            nonce: state.nonceOf(OWNER),
            txStatus:
              midNonce === before.nonce + 1 && state.nonceOf(OWNER) === before.nonce + 1
                ? 'confirmed'
                : 'unknown',
          },
        };
      });
    },
  };
}
