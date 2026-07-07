/**
 * Model registry end-to-end fidelity spec (registry axis: startOps →
 * updateRegistry → session state).
 *
 * Sub-Issue CAR-891 (v1.40-4) AC — the mock adapter drives a full
 * model registry ceremony end to end and the fidelity harness diffs
 * the raw {@link TraceEvent} sequence across the axis.
 *
 *  1. startOps + updateRegistry appends a versioned entry to the registry.
 *  2. updateRegistry with activate=true flips exactly one entry active.
 *  3. Registering a version that already exists throws / refuses.
 *  4. closeOps records the history length + refuses missing sessions.
 *  5. Route validation + wrapper handler surface the same errorKinds.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleRegistryRequest,
  validateRegistryRequest,
} from '../src/app/registry/route.js';
import type { LlmOpsAdapter } from '../src/adapters/interface.js';

let mock: LlmOpsAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — startOps', () => {
  it('startOps creates a new session', async () => {
    await mock.startOps({ sessionId: 's1' });
    const trace = mock.traces().filter((t) => t.op === 'startOps');
    expect(trace).toHaveLength(1);
    expect(trace[0]?.ok).toBe(true);
  });

  it('startOps refuses a duplicate session id', async () => {
    await mock.startOps({ sessionId: 's1' });
    await expect(mock.startOps({ sessionId: 's1' })).rejects.toThrow(
      /duplicate session/,
    );
  });

  it('startOps rejects an empty session id', async () => {
    await expect(mock.startOps({ sessionId: '' })).rejects.toThrow(
      /sessionId must not be empty/,
    );
  });
});

describe('mock adapter — updateRegistry', () => {
  beforeEach(async () => {
    await mock.startOps({ sessionId: 's1' });
  });

  it('registers a version + reports registrySize=1', async () => {
    const r = await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v1', activate: true },
    });
    expect(r.registrySize).toBe(1);
    expect(r.activated).toBe(true);
    expect(r.activeVersion).toBe('v1');
    expect(r.latencyMs).toBeGreaterThanOrEqual(1);
  });

  it('registers a second version + reports registrySize=2', async () => {
    await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v1', activate: true },
    });
    const r = await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v2', activate: false },
    });
    expect(r.registrySize).toBe(2);
    expect(r.activated).toBe(false);
    // v1 remains active because the new entry did not activate.
    expect(r.activeVersion).toBe('v1');
  });

  it('activate=true flips the active version', async () => {
    await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v1', activate: true },
    });
    const r = await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v2', activate: true },
    });
    expect(r.activeVersion).toBe('v2');
  });

  it('exactly one version is active at any time', async () => {
    await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v1', activate: true },
    });
    await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v2', activate: true },
    });
    const registry = mock.registry('s1');
    const active = registry.filter((r) => r.active);
    expect(active).toHaveLength(1);
    expect(active[0]?.version).toBe('v2');
  });

  it('refuses a duplicate version', async () => {
    await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v1', activate: true },
    });
    await expect(
      mock.updateRegistry({
        sessionId: 's1',
        entry: { version: 'v1', activate: false },
      }),
    ).rejects.toThrow(/already registered/);
  });

  it('refuses an empty version string', async () => {
    await expect(
      mock.updateRegistry({
        sessionId: 's1',
        entry: { version: '', activate: true },
      }),
    ).rejects.toThrow(/version must not be empty/);
  });

  it('refuses updateRegistry before startOps', async () => {
    await expect(
      mock.updateRegistry({
        sessionId: 'no-such',
        entry: { version: 'v1', activate: true },
      }),
    ).rejects.toThrow(/no session no-such/);
  });

  it('activeVersion is null when no version is activated', async () => {
    const r = await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v1', activate: false },
    });
    expect(r.activeVersion).toBeNull();
  });

  it('activate does not skip inactivated entries when re-activating', async () => {
    await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v1', activate: true },
    });
    await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v2', activate: false },
    });
    await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v3', activate: true },
    });
    const registry = mock.registry('s1');
    // v1 was flipped inactive by v3 activation, v2 was inactive to start.
    const active = registry.filter((r) => r.active);
    expect(active).toHaveLength(1);
    expect(active[0]?.version).toBe('v3');
  });
});

describe('mock adapter — closeOps', () => {
  it('closeOps records history length', async () => {
    await mock.startOps({ sessionId: 's1' });
    await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v1', activate: true },
    });
    await mock.closeOps({ sessionId: 's1' });
    const closed = mock.traces().find((t) => t.op === 'closeOps' && t.ok);
    expect(closed).toBeDefined();
    const detail = closed?.detail as { historyLength: number };
    expect(detail.historyLength).toBeGreaterThanOrEqual(1);
  });

  it('closeOps refuses a missing session', async () => {
    await expect(mock.closeOps({ sessionId: 'no-such' })).rejects.toThrow(
      /no session no-such/,
    );
  });

  it('reset clears all rooms and trace', async () => {
    await mock.startOps({ sessionId: 's1' });
    await mock.updateRegistry({
      sessionId: 's1',
      entry: { version: 'v1', activate: true },
    });
    await mock.reset();
    expect(mock.traces()).toHaveLength(0);
    // Recreating the session should now succeed.
    await mock.startOps({ sessionId: 's1' });
  });
});

describe('route validation — registry', () => {
  it('accepts a valid registry body', () => {
    const r = validateRegistryRequest({
      sessionId: 's1',
      entry: { version: 'v1', activate: true },
    });
    expect(r.ok).toBe(true);
  });

  it('rejects a non-object body', () => {
    const r = validateRegistryRequest(null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects an empty sessionId', () => {
    const r = validateRegistryRequest({
      sessionId: '',
      entry: { version: 'v1', activate: true },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects a missing entry field', () => {
    const r = validateRegistryRequest({ sessionId: 's1' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('entry_required');
  });

  it('rejects an empty version', () => {
    const r = validateRegistryRequest({
      sessionId: 's1',
      entry: { version: '', activate: true },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('entry.version_required');
  });

  it('rejects a non-boolean activate', () => {
    const r = validateRegistryRequest({
      sessionId: 's1',
      entry: { version: 'v1', activate: 'yes' },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('entry.activate_required');
  });
});

describe('route handlers — registry', () => {
  it('handleRegistryRequest wraps a successful update op', async () => {
    await mock.startOps({ sessionId: 's1' });
    const r = await handleRegistryRequest(mock, {
      sessionId: 's1',
      entry: { version: 'v1', activate: true },
    });
    expect(r.ok).toBe(true);
    expect(r.result?.registrySize).toBe(1);
    expect(r.result?.activeVersion).toBe('v1');
  });

  it('handleRegistryRequest translates thrown errors to errorKind', async () => {
    const r = await handleRegistryRequest(mock, {
      sessionId: 'no-such',
      entry: { version: 'v1', activate: true },
    });
    expect(r.ok).toBe(false);
    expect(r.errorKind).toMatch(/no session/);
  });

  it('handleRegistryRequest reports duplicate version as an error', async () => {
    await mock.startOps({ sessionId: 's1' });
    await handleRegistryRequest(mock, {
      sessionId: 's1',
      entry: { version: 'v1', activate: true },
    });
    const r = await handleRegistryRequest(mock, {
      sessionId: 's1',
      entry: { version: 'v1', activate: false },
    });
    expect(r.ok).toBe(false);
    expect(r.errorKind).toMatch(/already registered/);
  });
});
