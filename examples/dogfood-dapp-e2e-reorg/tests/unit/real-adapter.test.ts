/**
 * Unit tests for the real adapter — skip variant (default, TESTNET_RPC_URL
 * unset) records a REORG_REAL_ENV_MISSING trace and throws SkippedError. The
 * live-not-implemented variant (TESTNET_RPC_URL set) records
 * REORG_LIVE_NOT_IMPLEMENTED and also throws. Both paths never touch the real
 * network — that is the point of the env-skip design.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { detectRealEnv, makeRealAdapter, SkippedError } from '../../src/index.js';

const ENV_KEYS = ['TESTNET_RPC_URL', 'TESTNET_PRIVATE_KEY', 'TESTNET_TOKEN_ADDRESS'];

const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

describe('dogfood-dapp-e2e-reorg — real adapter env-skip', () => {
  it('T-DR-REAL-001 detectRealEnv returns null when TESTNET_RPC_URL is unset', () => {
    expect(detectRealEnv()).toBeNull();
  });

  it('T-DR-REAL-002 detectRealEnv returns rpcUrl when TESTNET_RPC_URL is set', () => {
    process.env['TESTNET_RPC_URL'] = 'https://sepolia.example.test';
    const env = detectRealEnv();
    expect(env).not.toBeNull();
    expect(env?.rpcUrl).toBe('https://sepolia.example.test');
  });

  it('T-DR-REAL-003 skipped adapter throws SkippedError on pendingTx', async () => {
    const adapter = makeRealAdapter();
    await expect(adapter.pendingTx()).rejects.toBeInstanceOf(SkippedError);
    const trace = adapter.traces();
    expect(trace).toHaveLength(1);
    expect(trace[0]!.op).toBe('pendingTx');
    expect(trace[0]!.errorKind).toBe('REORG_REAL_ENV_MISSING');
  });

  it('T-DR-REAL-004 skipped adapter throws SkippedError on all 4 ops', async () => {
    const adapter = makeRealAdapter();
    for (const op of ['pendingTx', 'confirmedTx', 'transferEvent', 'nonceGap'] as const) {
      await expect(adapter[op]()).rejects.toBeInstanceOf(SkippedError);
    }
    expect(adapter.traces()).toHaveLength(4);
    for (const entry of adapter.traces()) {
      expect(entry.ok).toBe(false);
      expect(entry.errorKind).toBe('REORG_REAL_ENV_MISSING');
    }
  });

  it('T-DR-REAL-005 live-not-implemented variant emits distinct error kind when TESTNET_RPC_URL is set', async () => {
    process.env['TESTNET_RPC_URL'] = 'https://sepolia.example.test';
    const adapter = makeRealAdapter();
    await expect(adapter.pendingTx()).rejects.toBeInstanceOf(SkippedError);
    const trace = adapter.traces();
    expect(trace[0]!.errorKind).toBe('REORG_LIVE_NOT_IMPLEMENTED');
  });

  it('T-DR-REAL-006 real adapter mode is "real"', () => {
    const adapter = makeRealAdapter();
    expect(adapter.mode).toBe('real');
  });

  it('T-DR-REAL-007 SkippedError code is REORG_REAL_ENV_MISSING', () => {
    const err = new SkippedError('pendingTx', 'no env');
    expect(err.code).toBe('REORG_REAL_ENV_MISSING');
    expect(err.message).toContain('pendingTx');
  });
});
