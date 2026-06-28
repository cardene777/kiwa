import { describe, expect, it, vi } from 'vitest';
import { waitForWalletConnected } from '../src/wait-for-wallet-connected.js';

type Locator = ReturnType<NonNullable<MockPage['getByTestId']>>;

interface MockPage {
  getByTestId: (testId: string) => {
    textContent: () => Promise<string | null>;
  };
  waitForTimeout: (ms: number) => Promise<void>;
}

function makePage(
  texts: Array<string | null | (() => string | Promise<string | null>) | Error>,
  opts?: { waitForTimeoutImpl?: (ms: number) => Promise<void> },
): MockPage & {
  getByTestIdCalls: string[];
  waitForTimeoutCalls: number[];
} {
  const getByTestIdCalls: string[] = [];
  const waitForTimeoutCalls: number[] = [];
  let attempt = 0;
  return {
    getByTestIdCalls,
    waitForTimeoutCalls,
    getByTestId: (testId: string) => {
      getByTestIdCalls.push(testId);
      return {
        textContent: async (): Promise<string | null> => {
          const value = texts[attempt];
          attempt += 1;
          if (value instanceof Error) throw value;
          if (typeof value === 'function') return value();
          return value ?? null;
        },
      };
    },
    waitForTimeout: async (ms: number): Promise<void> => {
      waitForTimeoutCalls.push(ms);
      if (opts?.waitForTimeoutImpl) {
        await opts.waitForTimeoutImpl(ms);
      }
    },
  } as MockPage & { getByTestIdCalls: string[]; waitForTimeoutCalls: number[] };
}

describe('waitForWalletConnected', () => {
  it('T-WW-001 first attempt で expectedText を含めば即 return (timeout 経由しない)', async () => {
    const page = makePage(['connected']);

    await expect(
      waitForWalletConnected(page as never, { timeout: 1000, pollInterval: 100 }),
    ).resolves.toBeUndefined();

    expect(page.getByTestIdCalls).toEqual(['connection-status']);
    expect(page.waitForTimeoutCalls).toEqual([]);
  });

  it('T-WW-002 case-insensitive match - "Connected" / "CONNECTED" でも valid', async () => {
    const page1 = makePage(['Connected']);
    const page2 = makePage(['CONNECTED']);
    await expect(waitForWalletConnected(page1 as never, { timeout: 100 })).resolves.toBeUndefined();
    await expect(waitForWalletConnected(page2 as never, { timeout: 100 })).resolves.toBeUndefined();
  });

  it('T-WW-003 partial match - "wallet-connected" のように expectedText を含めば valid', async () => {
    const page = makePage(['wallet-connected ok']);
    await expect(waitForWalletConnected(page as never, { timeout: 100 })).resolves.toBeUndefined();
  });

  it('T-WW-004 maxAttempts 経過しても match しない → timeout error throw', async () => {
    const page = makePage([
      'idle',
      'pending',
      'failed',
      'idle',
      'idle',
    ]);

    await expect(
      waitForWalletConnected(page as never, { timeout: 500, pollInterval: 100 }),
    ).rejects.toThrow(/timed out after 500ms/);
    expect(page.waitForTimeoutCalls.length).toBe(4);
  });

  it('T-WW-005 timeout error message に testId / expectedText / lastSeen 含む', async () => {
    const page = makePage(['some-last-state']);

    await expect(
      waitForWalletConnected(page as never, {
        testId: 'my-status',
        expectedText: 'paired',
        timeout: 100,
        pollInterval: 100,
      }),
    ).rejects.toThrow(/testId=my-status/);
  });

  it('T-WW-006 textContent throw 時は exception swallow して次 poll に進む', async () => {
    const page = makePage([
      new Error('detached'),
      new Error('still detached'),
      'connected',
    ]);

    await expect(
      waitForWalletConnected(page as never, { timeout: 500, pollInterval: 100 }),
    ).resolves.toBeUndefined();
  });

  it('T-WW-007 textContent null 戻り値は空文字列扱い (match しない)', async () => {
    const page = makePage([null, 'connected']);

    await expect(
      waitForWalletConnected(page as never, { timeout: 500, pollInterval: 100 }),
    ).resolves.toBeUndefined();
    expect(page.waitForTimeoutCalls).toEqual([100]);
  });

  it('T-WW-008 options.testId override - default "connection-status" でなく custom testId 使用', async () => {
    const page = makePage(['connected']);

    await waitForWalletConnected(page as never, { testId: 'custom-id', timeout: 100 });

    expect(page.getByTestIdCalls).toEqual(['custom-id']);
  });

  it('T-WW-009 options.expectedText override - "connected" でなく "paired" 等で match 判定', async () => {
    const page = makePage(['paired']);

    await expect(
      waitForWalletConnected(page as never, { expectedText: 'paired', timeout: 100 }),
    ).resolves.toBeUndefined();
  });

  it('T-WW-010 boundary - timeout=1ms / pollInterval=1ms で maxAttempts=1', async () => {
    const page = makePage(['idle']);

    await expect(
      waitForWalletConnected(page as never, { timeout: 1, pollInterval: 1 }),
    ).rejects.toThrow(/timed out after 1ms/);
    expect(page.waitForTimeoutCalls.length).toBe(0);
  });

  it('T-WW-011 boundary - timeout=100 / pollInterval=200 では maxAttempts=Math.max(1, 0.5)=1', async () => {
    const page = makePage(['idle']);

    await expect(
      waitForWalletConnected(page as never, { timeout: 100, pollInterval: 200 }),
    ).rejects.toThrow(/timed out after 100ms/);
    expect(page.waitForTimeoutCalls.length).toBe(0);
  });

  it('T-WW-012 maxAttempts > 1 で最終 attempt は waitForTimeout 呼ばない', async () => {
    const page = makePage(['idle', 'idle', 'idle']);

    await expect(
      waitForWalletConnected(page as never, { timeout: 300, pollInterval: 100 }),
    ).rejects.toThrow();
    expect(page.waitForTimeoutCalls).toEqual([100, 100]);
  });

  it('T-WW-013 default value - timeout=5000 / pollInterval=100 / testId="connection-status" / expectedText="connected"', async () => {
    const page = makePage(['connected']);

    await waitForWalletConnected(page as never);

    expect(page.getByTestIdCalls).toEqual(['connection-status']);
  });

  it('T-WW-014 expectedText 大文字小文字 mix - "Connected" expected で "connected" 含むも match', async () => {
    const page = makePage(['wallet is CONNECTED now']);

    await expect(
      waitForWalletConnected(page as never, { expectedText: 'Connected', timeout: 100 }),
    ).resolves.toBeUndefined();
  });

  it('T-WW-015 success path で waitForTimeout を呼ばない (immediate return)', async () => {
    const page = makePage(['connected', 'connected', 'connected']);

    await waitForWalletConnected(page as never, { timeout: 1000, pollInterval: 100 });

    expect(page.waitForTimeoutCalls).toEqual([]);
  });
});
