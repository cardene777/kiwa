/**
 * Reproducible build end-to-end fidelity spec (reproducible axis: twin
 * build hash matching + toolchain pinning).
 *
 * Issue CAR-866 (v1.39-4) AC — the mock adapter drives the reproducible
 * build gate end to end.
 *
 *  1. matchReproducibleBuild reports matched=true when buildA_hash ===
 *     buildB_hash and threads the toolchain version through unchanged.
 *  2. matchReproducibleBuild reports matched=false when the two hashes
 *     differ (an unreproducible build).
 *  3. matchReproducibleBuild rejects an empty buildA or buildB hash.
 *  4. Session state machine rejects invalid transitions.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleReproducibleRequest,
  validateReproducibleRequest,
} from '../src/app/reproducible/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — reproducible build matching', () => {
  it('axis 1: matchReproducibleBuild reports matched=true when hashes agree', async () => {
    await mock.startReproducible({ sessionId: 'r1', target: 'opa' });
    const result = await mock.matchReproducibleBuild({
      sessionId: 'r1',
      buildA_hash: 'sha256:abcdef',
      buildB_hash: 'sha256:abcdef',
      toolchainVersion: 'rust-1.80.0',
    });
    expect(result.matched).toBe(true);
    expect(result.toolchainVersion).toBe('rust-1.80.0');
    expect(result.hashA).toBe(result.hashB);
    const trace = mock.traces().find((t) => t.op === 'matchReproducibleBuild');
    expect(trace?.ok).toBe(true);
  });

  it('axis 2: matchReproducibleBuild reports matched=false when hashes diverge', async () => {
    await mock.startReproducible({ sessionId: 'r-div', target: 'opa' });
    const result = await mock.matchReproducibleBuild({
      sessionId: 'r-div',
      buildA_hash: 'sha256:aaa',
      buildB_hash: 'sha256:bbb',
      toolchainVersion: 'go-1.23.0',
    });
    expect(result.matched).toBe(false);
  });

  it('axis 3: matchReproducibleBuild rejects an empty buildA_hash', async () => {
    await mock.startReproducible({ sessionId: 'r-empty', target: 'opa' });
    await expect(
      mock.matchReproducibleBuild({
        sessionId: 'r-empty',
        buildA_hash: '',
        buildB_hash: 'sha256:bbb',
        toolchainVersion: 'go-1.23.0',
      }),
    ).rejects.toThrow(/build hashes must not be empty/);
  });

  it('axis 3: matchReproducibleBuild rejects an empty buildB_hash', async () => {
    await mock.startReproducible({ sessionId: 'r-empty-b', target: 'opa' });
    await expect(
      mock.matchReproducibleBuild({
        sessionId: 'r-empty-b',
        buildA_hash: 'sha256:aaa',
        buildB_hash: '',
        toolchainVersion: 'go-1.23.0',
      }),
    ).rejects.toThrow(/build hashes must not be empty/);
  });

  it('axis 4: matchReproducibleBuild rejects when session missing', async () => {
    await expect(
      mock.matchReproducibleBuild({
        sessionId: 'ghost',
        buildA_hash: 'sha256:aaa',
        buildB_hash: 'sha256:aaa',
        toolchainVersion: 'v',
      }),
    ).rejects.toThrow(/reproducible_session_not_found/);
  });

  it('axis 4: startReproducible rejects duplicate session ids', async () => {
    await mock.startReproducible({ sessionId: 'dup', target: 'opa' });
    await expect(
      mock.startReproducible({ sessionId: 'dup', target: 'opa' }),
    ).rejects.toThrow(/reproducible_session_exists/);
  });

  it('axis 4: closeReproducible removes session from bookkeeping', async () => {
    await mock.startReproducible({ sessionId: 'r-close', target: 'opa' });
    await mock.closeReproducible({ sessionId: 'r-close' });
    await expect(
      mock.closeReproducible({ sessionId: 'r-close' }),
    ).rejects.toThrow(/reproducible_session_not_found/);
  });
});

describe('mock adapter — /reproducible route validation', () => {
  it('accepts match-build requests with all required fields', () => {
    const parsed = validateReproducibleRequest({
      kind: 'match-build',
      sessionId: 'r1',
      buildA_hash: 'sha256:aaa',
      buildB_hash: 'sha256:aaa',
      toolchainVersion: 'rust-1.80.0',
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects match-build requests without buildA_hash', () => {
    const parsed = validateReproducibleRequest({
      kind: 'match-build',
      sessionId: 'r1',
      buildB_hash: 'sha256:bbb',
      toolchainVersion: 'v',
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('buildA_hash_required');
  });

  it('rejects match-build requests without toolchainVersion', () => {
    const parsed = validateReproducibleRequest({
      kind: 'match-build',
      sessionId: 'r1',
      buildA_hash: 'sha256:aaa',
      buildB_hash: 'sha256:aaa',
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('toolchainVersion_required');
  });

  it('rejects an unknown kind', () => {
    const parsed = validateReproducibleRequest({
      kind: 'unknown',
      sessionId: 'r1',
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects a non-object body', () => {
    const parsed = validateReproducibleRequest(null);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('body_not_object');
  });
});

describe('mock adapter — /reproducible route handler', () => {
  it('serves a match-build request end to end', async () => {
    await mock.startReproducible({ sessionId: 'route-r', target: 'opa' });
    const parsed = validateReproducibleRequest({
      kind: 'match-build',
      sessionId: 'route-r',
      buildA_hash: 'sha256:aaa',
      buildB_hash: 'sha256:aaa',
      toolchainVersion: 'go-1.23.0',
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleReproducibleRequest(mock, parsed.value);
    expect(res.ok).toBe(true);
    expect(res.matched).toBe(true);
  });

  it('reports an adapter error via errorKind on route response', async () => {
    const parsed = validateReproducibleRequest({
      kind: 'match-build',
      sessionId: 'ghost',
      buildA_hash: 'sha256:aaa',
      buildB_hash: 'sha256:aaa',
      toolchainVersion: 'v',
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleReproducibleRequest(mock, parsed.value);
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('reproducible_session_not_found');
  });
});
