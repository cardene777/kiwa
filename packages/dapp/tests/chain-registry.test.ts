import { describe, expect, it } from 'vitest';
import {
  handleRpcRequest,
  type RpcContext,
} from '../src/rpc-handlers.js';
import { type ChainConfig, type Hex } from '../src/types.js';

const TEST_PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

function makeCtxWithRegistry(initial: ChainConfig[] = []): RpcContext {
  return {
    privateKey: TEST_PRIVATE_KEY,
    chainState: { current: 31337 },
    approvalMode: { current: 'approve' as const },
    chainRegistry: { current: initial },
  };
}

function makeCtxWithoutRegistry(): RpcContext {
  return {
    privateKey: TEST_PRIVATE_KEY,
    chainState: { current: 31337 },
    approvalMode: { current: 'approve' as const },
  };
}

describe('chain registry: rpc-handler behavior', () => {
  it('T-CR-001 registry 未設定時は wallet_switchEthereumChain が常に成功 (下位互換)', async () => {
    const ctx = makeCtxWithoutRegistry();
    await expect(
      handleRpcRequest(ctx, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa86a' }],
      }),
    ).resolves.toBeNull();
    expect(ctx.chainState.current).toBe(43114);
  });

  it('T-CR-002 registry 登録済 chain への switch が成功し chainChanged event 発火', async () => {
    const ctx = makeCtxWithRegistry([{ chainId: '0xa' }]);
    const events: string[] = [];
    ctx.emitter = {
      on() {},
      off() {},
      emit(event, ...args) {
        if (event === 'chainChanged') events.push(args[0] as string);
      },
      listenerCount() {
        return 0;
      },
    };
    await handleRpcRequest(ctx, {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xa' }],
    });
    expect(ctx.chainState.current).toBe(10);
    expect(events).toEqual(['0xa']);
  });

  it('T-CR-003 registry 未登録 chain への switch で 4902 throw (EIP-3326)', async () => {
    const ctx = makeCtxWithRegistry([{ chainId: '0xa' }]);
    await expect(
      handleRpcRequest(ctx, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa86a' }],
      }),
    ).rejects.toMatchObject({ code: 4902 });
  });

  it('T-CR-004 wallet_addEthereumChain で chain が registry に追加され以降 switch 可能', async () => {
    const ctx = makeCtxWithRegistry([]);
    await handleRpcRequest(ctx, {
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0xa86a',
          chainName: 'Avalanche',
          rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
          nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
        },
      ],
    });
    expect(ctx.chainRegistry!.current).toHaveLength(1);
    expect(ctx.chainRegistry!.current[0]!.chainId).toBe('0xa86a');
    expect(ctx.chainRegistry!.current[0]!.chainName).toBe('Avalanche');

    // 追加後は switch が成功する
    await expect(
      handleRpcRequest(ctx, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa86a' }],
      }),
    ).resolves.toBeNull();
    expect(ctx.chainState.current).toBe(43114);
  });

  it('T-CR-005 同 chainId の add は上書きされ重複しない', async () => {
    const ctx = makeCtxWithRegistry([{ chainId: '0xa', chainName: 'Optimism v1' }]);
    await handleRpcRequest(ctx, {
      method: 'wallet_addEthereumChain',
      params: [{ chainId: '0xa', chainName: 'Optimism v2' }],
    });
    expect(ctx.chainRegistry!.current).toHaveLength(1);
    expect(ctx.chainRegistry!.current[0]!.chainName).toBe('Optimism v2');
  });

  it('T-CR-006 wallet_addEthereumChain で chainId 不正 (空文字 / 非 hex) は -32602 throw', async () => {
    const ctx = makeCtxWithRegistry([]);
    await expect(
      handleRpcRequest(ctx, {
        method: 'wallet_addEthereumChain',
        params: [{ chainId: 'not-hex' }],
      }),
    ).rejects.toMatchObject({ code: -32602 });
  });

  it('T-CR-007 case-insensitive な chainId 比較 (0xA == 0xa)', async () => {
    const ctx = makeCtxWithRegistry([{ chainId: '0xA' }]);
    await expect(
      handleRpcRequest(ctx, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa' }],
      }),
    ).resolves.toBeNull();
  });
});
