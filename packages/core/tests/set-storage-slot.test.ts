import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Address, Hex } from '../src/types.js';
import { setStorageSlot } from '../src/set-storage-slot.js';

const ADDR = '0x1234567890123456789012345678901234567890' as Address;
const VALUE32 = ('0x' + '01'.repeat(32)) as Hex;

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(responseInit: { ok?: boolean; status?: number; statusText?: string; json?: () => Promise<unknown> }): void {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: responseInit.ok ?? true,
    status: responseInit.status ?? 200,
    statusText: responseInit.statusText ?? 'OK',
    json: responseInit.json ?? (async () => ({ result: '0x1' })),
  })));
}

describe('setStorageSlot', () => {
  it('T-SSS-001 accepts valid 64-char hex value', async () => {
    mockFetch({});
    await setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: 0, value: VALUE32 });
  });

  it('T-SSS-002 rejects value not 64 hex chars', async () => {
    await expect(
      setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: 0, value: '0x01' as Hex }),
    ).rejects.toThrow(/32-byte hex/);
  });

  it('T-SSS-003 rejects value missing 0x prefix', async () => {
    await expect(
      setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: 0, value: ('00'.repeat(32)) as Hex }),
    ).rejects.toThrow(/32-byte hex/);
  });

  it('T-SSS-004 slot accepts number 0', async () => {
    mockFetch({});
    await setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: 0, value: VALUE32 });
  });

  it('T-SSS-005 slot rejects negative number', async () => {
    await expect(
      setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: -1, value: VALUE32 }),
    ).rejects.toThrow(/non-negative/);
  });

  it('T-SSS-006 slot rejects non-integer number', async () => {
    await expect(
      setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: 1.5, value: VALUE32 }),
    ).rejects.toThrow(/non-negative integer/);
  });

  it('T-SSS-007 slot accepts bigint', async () => {
    mockFetch({});
    await setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: 100n, value: VALUE32 });
  });

  it('T-SSS-008 slot rejects negative bigint', async () => {
    await expect(
      setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: -1n, value: VALUE32 }),
    ).rejects.toThrow(/non-negative/);
  });

  it('T-SSS-009 slot accepts valid hex string', async () => {
    mockFetch({});
    await setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: '0xff' as Hex, value: VALUE32 });
  });

  it('T-SSS-010 slot rejects invalid hex string', async () => {
    await expect(
      setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: 'invalid' as Hex, value: VALUE32 }),
    ).rejects.toThrow(/slot hex must match/);
  });

  it('T-SSS-011 throws on HTTP non-ok response', async () => {
    mockFetch({ ok: false, status: 500, statusText: 'Server Error' });
    await expect(
      setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: 0, value: VALUE32 }),
    ).rejects.toThrow(/HTTP 500.*Server Error/);
  });

  it('T-SSS-012 throws on RPC error payload', async () => {
    mockFetch({
      json: async () => ({ error: { code: -32000, message: 'invalid' } }),
    });
    await expect(
      setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: 0, value: VALUE32 }),
    ).rejects.toThrow(/RPC error -32000.*invalid/);
  });

  it('T-SSS-013 sends anvil_setStorageAt method', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ result: '0x1' }),
    }));
    vi.stubGlobal('fetch', fetchSpy);
    await setStorageSlot({ rpcUrl: 'http://x', address: ADDR, slot: 5, value: VALUE32 });
    const body = JSON.parse((fetchSpy.mock.calls[0]?.[1] as { body: string }).body);
    expect(body.method).toBe('anvil_setStorageAt');
    expect(body.params).toEqual([ADDR, '0x5', VALUE32]);
  });
});
