import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  driveD1NotesFlow,
  driveExecutionCtxFlow,
  driveKvCounterFlow,
  driveR2UploadFlow,
  driveRouteVsRpcFlow,
} from '../src/flows/hono-flows.js';

describe('hono flows (end-to-end drive)', () => {
  it('T-DHW-HF-001 driveRouteVsRpc agrees on /health status + body', async () => {
    const adapter = makeMockAdapter();
    const out = await driveRouteVsRpcFlow(adapter, 'GET', '/health');
    expect(out.routeStatus).toBe(200);
    expect(out.rpcStatus).toBe(200);
    expect(out.agree).toBe(true);
    await adapter.reset();
  });

  it('T-DHW-HF-002 driveKvCounterFlow × 5 produces monotonic counter', async () => {
    const adapter = makeMockAdapter();
    const out = await driveKvCounterFlow(adapter, 5);
    expect(out.finalValue).toBe('5');
    expect(out.writeCount).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('T-DHW-HF-003 driveD1NotesFlow returns rows registered via seed', async () => {
    const adapter = makeMockAdapter();
    const out = await driveD1NotesFlow(adapter, [
      { id: 1, title: 'alpha' },
      { id: 2, title: 'beta' },
    ]);
    expect(out.rowCount).toBe(2);
    expect(out.rows[0]?.title).toBe('alpha');
    await adapter.reset();
  });

  it('T-DHW-HF-004 driveR2UploadFlow writes 3 keys and lists them back', async () => {
    const adapter = makeMockAdapter();
    const out = await driveR2UploadFlow(adapter, [
      { key: 'k1', contents: 'v1' },
      { key: 'k2', contents: 'v2' },
      { key: 'k3', contents: 'v3' },
    ]);
    expect(out.written).toEqual(['k1', 'k2', 'k3']);
    expect(out.listed).toEqual(expect.arrayContaining(['k1', 'k2', 'k3']));
    await adapter.reset();
  });

  it('T-DHW-HF-005 driveExecutionCtxFlow drains all scheduled promises', async () => {
    const adapter = makeMockAdapter();
    const out = await driveExecutionCtxFlow(adapter, 4);
    expect(out.pending).toBe(0);
    expect(out.passedThrough).toBe(false);
    await adapter.reset();
  });
});
