import { describe, expect, it } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { ANVIL_DEFAULT_PRIVATE_KEYS } from '../src/anvil-default-keys.js';
import {
  handleRpcRequest,
  resolveActivePrivateKey,
  type RpcContext,
} from '../src/rpc-handlers.js';
import { type Hex } from '../src/types.js';

function makeCtxWithAccounts(initialIndex: number = 0): RpcContext {
  return {
    privateKey: ANVIL_DEFAULT_PRIVATE_KEYS[0]!,
    accounts: ANVIL_DEFAULT_PRIVATE_KEYS,
    activeIndex: { current: initialIndex },
    chainState: { current: 31337 },
    approvalMode: { current: 'approve' as const },
  };
}

function makeCtxWithoutAccounts(): RpcContext {
  return {
    privateKey: ANVIL_DEFAULT_PRIVATE_KEYS[0]!,
    chainState: { current: 31337 },
    approvalMode: { current: 'approve' as const },
  };
}

describe('setActiveAccount: rpc-handler behavior', () => {
  it('T-SAA-001 accounts 未指定時は eth_accounts が [privateKey].address だけを返す (下位互換)', async () => {
    const ctx = makeCtxWithoutAccounts();
    const result = (await handleRpcRequest(ctx, { method: 'eth_accounts' })) as Hex[];
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(privateKeyToAccount(ctx.privateKey).address);
  });

  it('T-SAA-002 accounts 指定時は eth_accounts が 10 個の address を active 先頭で返す', async () => {
    const ctx = makeCtxWithAccounts(0);
    const result = (await handleRpcRequest(ctx, { method: 'eth_accounts' })) as Hex[];
    expect(result).toHaveLength(10);
    expect(result[0]).toBe(privateKeyToAccount(ANVIL_DEFAULT_PRIVATE_KEYS[0]!).address);
  });

  it('T-SAA-003 activeIndex 切替後 eth_accounts の先頭が新 active address になる', async () => {
    const ctx = makeCtxWithAccounts(0);
    ctx.activeIndex!.current = 3;
    const result = (await handleRpcRequest(ctx, { method: 'eth_accounts' })) as Hex[];
    expect(result[0]).toBe(privateKeyToAccount(ANVIL_DEFAULT_PRIVATE_KEYS[3]!).address);
    // 残り 9 個の address は他 dev account
    expect(result).toHaveLength(10);
  });

  it('T-SAA-004 resolveActivePrivateKey は activeIndex に対応した key を返す', () => {
    const ctx = makeCtxWithAccounts(0);
    expect(resolveActivePrivateKey(ctx)).toBe(ANVIL_DEFAULT_PRIVATE_KEYS[0]);
    ctx.activeIndex!.current = 5;
    expect(resolveActivePrivateKey(ctx)).toBe(ANVIL_DEFAULT_PRIVATE_KEYS[5]);
  });

  it('T-SAA-005 accounts 未指定時 resolveActivePrivateKey は privateKey にフォールバック', () => {
    const ctx = makeCtxWithoutAccounts();
    expect(resolveActivePrivateKey(ctx)).toBe(ctx.privateKey);
  });

  it('T-SAA-006 active 切替後 personal_sign が新 active の private key で署名する', async () => {
    const ctx = makeCtxWithAccounts(0);
    ctx.activeIndex!.current = 2;
    const newActiveAddress = privateKeyToAccount(ANVIL_DEFAULT_PRIVATE_KEYS[2]!).address;
    const sig = (await handleRpcRequest(ctx, {
      method: 'personal_sign',
      params: ['hello', newActiveAddress],
    })) as Hex;
    expect(sig).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  it('T-SAA-007 旧 active の address で personal_sign すると 4100 unauthorized', async () => {
    const ctx = makeCtxWithAccounts(0);
    ctx.activeIndex!.current = 2;
    const oldActiveAddress = privateKeyToAccount(ANVIL_DEFAULT_PRIVATE_KEYS[0]!).address;
    await expect(
      handleRpcRequest(ctx, {
        method: 'personal_sign',
        params: ['hello', oldActiveAddress],
      }),
    ).rejects.toMatchObject({ code: 4100 });
  });
});
