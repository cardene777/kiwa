import { describe, expect, it } from 'vitest';
import { sampleEdgeHandler, withEdgeEnv } from '../src/edge/env-mock.js';

describe('edge runtime env mock (Deno.env + Deno.serve)', () => {
  it('T-DFI-EE-001 withEdgeEnv exposes Deno.env.get inside body only', async () => {
    const before = (globalThis as { Deno?: unknown }).Deno;
    const { snapshot } = await withEdgeEnv({ env: { KIWA_FRESH_MODE: 'dogfood' } }, async ({ read }) => {
      return read('KIWA_FRESH_MODE');
    });
    // after exit, previous Deno binding restored
    expect((globalThis as { Deno?: unknown }).Deno).toBe(before);
    expect(snapshot.envRead.KIWA_FRESH_MODE).toBe('dogfood');
  });

  it('T-DFI-EE-002 sampleEdgeHandler reads mode from env + calls serve once', async () => {
    const { result, snapshot } = await withEdgeEnv({
      env: { KIWA_FRESH_MODE: 'test' },
    }, async () => {
      const res = sampleEdgeHandler(new Request('http://x/edge'));
      return await res.json() as { mode: string };
    });
    expect(result.mode).toBe('test');
    expect(snapshot.serveCalls).toBe(1);
    expect(snapshot.denoInstalled).toBe(true);
  });

  it('T-DFI-EE-003 unset env keys return undefined', async () => {
    const { snapshot } = await withEdgeEnv({ env: {} }, async ({ read }) => {
      return read('MISSING_KEY');
    });
    expect(snapshot.envRead.MISSING_KEY).toBeUndefined();
  });

  it('T-DFI-EE-004 denoInstalled=false removes Deno binding entirely', async () => {
    const { snapshot } = await withEdgeEnv({
      env: { A: '1' },
      denoInstalled: false,
    }, async ({ read }) => {
      return read('A');
    });
    expect(snapshot.denoInstalled).toBe(false);
    expect(snapshot.serveCalls).toBe(0);
  });

  it('T-DFI-EE-005 body throw still restores Deno global', async () => {
    const before = (globalThis as { Deno?: unknown }).Deno;
    await expect(
      withEdgeEnv({ env: { A: '1' } }, async () => {
        throw new Error('body-crash');
      }),
    ).rejects.toThrow('body-crash');
    expect((globalThis as { Deno?: unknown }).Deno).toBe(before);
  });

  it('T-DFI-EE-006 sampleEdgeHandler falls back to unknown when env missing', async () => {
    const { result } = await withEdgeEnv({ env: {} }, async () => {
      const res = sampleEdgeHandler(new Request('http://x/edge'));
      return await res.json() as { mode: string };
    });
    expect(result.mode).toBe('unknown');
  });
});
