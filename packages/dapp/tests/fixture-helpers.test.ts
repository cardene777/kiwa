import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Page } from '@playwright/test';
import { setStorageSlot, waitForWalletConnected } from '../src/index.js';
import type { Hex } from '../src/types.js';

describe('waitForWalletConnected', () => {
  it('T-WFC-001 textContent が expected を含めば即解決する', async () => {
    const locator = {
      textContent: vi.fn().mockResolvedValue('connected (0x1234)'),
    };
    const page = {
      getByTestId: vi.fn(() => locator),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;

    await expect(
      waitForWalletConnected(page, { timeout: 500 }),
    ).resolves.toBeUndefined();

    expect(locator.textContent).toHaveBeenCalled();
  });

  it('T-WFC-002 attempts を全て使い切っても expected が現れなければ throw する', async () => {
    const locator = {
      textContent: vi.fn().mockResolvedValue('not connected yet'),
    };
    const page = {
      getByTestId: vi.fn(() => locator),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;

    await expect(
      waitForWalletConnected(page, {
        timeout: 300,
        pollInterval: 100,
        expectedText: 'connected:0x',
      }),
    ).rejects.toThrow(/waitForWalletConnected timed out/);
    expect(locator.textContent).toHaveBeenCalledTimes(3);
  });

  it('T-WFC-003 expectedText / testId を上書きできる', async () => {
    const locator = {
      textContent: vi.fn().mockResolvedValue('READY'),
    };
    const page = {
      getByTestId: vi.fn(() => locator),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;

    await expect(
      waitForWalletConnected(page, {
        testId: 'wallet-status',
        expectedText: 'ready',
        timeout: 500,
      }),
    ).resolves.toBeUndefined();

    expect(page.getByTestId).toHaveBeenCalledWith('wallet-status');
  });
});

describe('setStorageSlot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const VALID_ADDR = '0x1234567890123456789012345678901234567890';
  const VALID_VALUE: Hex =
    '0x000000000000000000000000000000000000000000000000000000000000002a';

  it('T-SSS-001 anvil_setStorageAt JSON-RPC を期待 payload で発行する', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x1' }), {
          status: 200,
        }),
      );

    await setStorageSlot({
      rpcUrl: 'http://127.0.0.1:8545',
      address: VALID_ADDR as Hex,
      slot: 3,
      value: VALID_VALUE,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      method: string;
      params: unknown[];
    };
    expect(body.method).toBe('anvil_setStorageAt');
    expect(body.params).toEqual([VALID_ADDR, '0x3', VALID_VALUE]);
  });

  it('T-SSS-002 value が 32 byte hex でなければ throw する', async () => {
    await expect(
      setStorageSlot({
        rpcUrl: 'http://127.0.0.1:8545',
        address: VALID_ADDR as Hex,
        slot: 0,
        value: '0xdead' as Hex,
      }),
    ).rejects.toThrow(/value must be a 32-byte hex/);
  });

  it('T-SSS-003 RPC error 応答時に throw する', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -32603, message: 'invalid slot' },
        }),
        { status: 200 },
      ),
    );

    await expect(
      setStorageSlot({
        rpcUrl: 'http://127.0.0.1:8545',
        address: VALID_ADDR as Hex,
        slot: 0,
        value: VALID_VALUE,
      }),
    ).rejects.toThrow(/RPC error -32603: invalid slot/);
  });

  it('T-SSS-004 slot が負の数なら throw する', async () => {
    await expect(
      setStorageSlot({
        rpcUrl: 'http://127.0.0.1:8545',
        address: VALID_ADDR as Hex,
        slot: -1,
        value: VALID_VALUE,
      }),
    ).rejects.toThrow(/slot number must be a non-negative integer/);
  });
});
