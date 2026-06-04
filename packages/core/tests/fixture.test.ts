import { describe, expect, it, vi } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { createRpcHandler, dappE2eTest, verifySignature, waitForPendingRpcs } from '../src/index.js';
import type { RpcContext } from '../src/rpc-handlers.js';
import type { Hex } from '../src/types.js';

const PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

describe('dappE2eTest fixture', () => {
  it('T-FIX-001 dappE2eTest は @playwright/test の test オブジェクト互換 (extend method を持つ)', () => {
    // Given
    // When
    const tt = dappE2eTest as { extend?: unknown };
    // Then
    expect(typeof tt?.extend).toBe('function');
  });

  it('T-FIX-002 dappE2eTest は describe / step / use を持つ Playwright test API である', () => {
    // Given
    const tt = dappE2eTest as { describe?: unknown; step?: unknown };
    // When (no action)
    // Then
    expect(typeof tt?.describe).toBe('function');
  });

  it('T-FIX-003 verifySignature helper は viem verifyMessage と同じ結果を返す', async () => {
    const account = privateKeyToAccount(PRIVATE_KEY);
    const signature = await account.signMessage({ message: 'hello fixture helper' });

    const valid = await verifySignature(account.address, signature, 'hello fixture helper');

    expect(valid).toBe(true);
  });

  it('T-FIX-004 DEBUG=dapp-e2e:rpc で createRpcHandler が console.log を出す', async () => {
    const ctx: RpcContext = {
      privateKey: PRIVATE_KEY,
      chainState: { current: 31337 },
      approvalPolicy: { current: { default: 'approve' } },
    };
    const tracker = {
      pendingRpcs: new Map(),
      nextId: () => 1,
    };
    const rpcHandler = createRpcHandler(ctx, tracker);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const prevDebug = process.env.DEBUG;
    process.env.DEBUG = 'dapp-e2e:rpc';

    try {
      await rpcHandler({ method: 'eth_chainId' });
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[dapp-e2e:rpc\] eth_chainId .*duration=/),
      );
    } finally {
      process.env.DEBUG = prevDebug;
      logSpy.mockRestore();
    }
  });

  it('T-FIX-005 waitForRpcIdle timeout message に pending RPC の method / params / elapsed を含める', async () => {
    const pendingRpcs = new Map([
      [
        1,
        {
          request: { method: 'eth_call', params: [{ to: '0xabc', data: '0x1234' }] },
          startedAt: Date.now() - 12_300,
          promise: new Promise<never>(() => {}),
        },
      ],
    ]);

    await expect(waitForPendingRpcs({} as never, pendingRpcs, 10)).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof Error &&
        'code' in error &&
        (error as Error & { code: number }).code === -32603 &&
        /\[dapp-e2e:rpc\] eth_call /.test(error.message) &&
        /pending for 12\.\ds/.test(error.message) &&
        /"to":"0xabc"/.test(error.message),
    );
  });
});
