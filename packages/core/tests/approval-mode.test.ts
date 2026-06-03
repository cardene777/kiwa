import { describe, expect, it } from 'vitest';
import { handleRpcRequest, type RpcContext } from '../src/rpc-handlers.js';
import { type ApprovalMode, type Hex } from '../src/types.js';

const TEST_PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TEST_ACCOUNT = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as Hex;

function makeCtx(mode: ApprovalMode = 'approve'): RpcContext {
  return {
    privateKey: TEST_PRIVATE_KEY,
    chainState: { current: 31337 },
    approvalMode: { current: mode },
  };
}

describe('approval mode', () => {
  it('T-APP-001 default は approve で personal_sign が成功する', async () => {
    const ctx = makeCtx();

    const sig = await handleRpcRequest(ctx, {
      method: 'personal_sign',
      params: ['hello', TEST_ACCOUNT],
    });

    expect(typeof sig).toBe('string');
    expect(sig).toMatch(/^0x[0-9a-fA-F]+$/);
  });

  it('T-APP-002 reject mode で personal_sign が code 4001 で reject される', async () => {
    const ctx = makeCtx('reject');

    await expect(
      handleRpcRequest(ctx, { method: 'personal_sign', params: ['hello', TEST_ACCOUNT] }),
    ).rejects.toMatchObject({ code: 4001, message: 'User rejected the request.' });
  });

  it('T-APP-003 reject mode で eth_signTypedData_v4 / wallet_switchEthereumChain が code 4001 で reject される', async () => {
    const ctx = makeCtx('reject');
    const typedData = JSON.stringify({
      types: { Mail: [{ name: 'contents', type: 'string' }] },
      primaryType: 'Mail',
      domain: { name: 'Test', chainId: 31337 },
      message: { contents: 'hello' },
    });

    await expect(
      handleRpcRequest(ctx, {
        method: 'eth_signTypedData_v4',
        params: [TEST_ACCOUNT, typedData],
      }),
    ).rejects.toMatchObject({ code: 4001 });
    await expect(
      handleRpcRequest(ctx, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
      }),
    ).rejects.toMatchObject({ code: 4001 });
  });

  it('T-APP-004 approve mode に切替後 personal_sign が再び成功する', async () => {
    const ctx = makeCtx('reject');

    await expect(
      handleRpcRequest(ctx, { method: 'personal_sign', params: ['hello', TEST_ACCOUNT] }),
    ).rejects.toMatchObject({ code: 4001 });

    ctx.approvalMode.current = 'approve';

    const sig = await handleRpcRequest(ctx, {
      method: 'personal_sign',
      params: ['hello', TEST_ACCOUNT],
    });

    expect(typeof sig).toBe('string');
  });

  it('T-APP-005 reject mode でも read-only method は成功する', async () => {
    const ctx = makeCtx('reject');

    const chainId = await handleRpcRequest(ctx, { method: 'eth_chainId' });
    const accounts = await handleRpcRequest(ctx, { method: 'eth_requestAccounts' });

    expect(chainId).toBe('0x7a69');
    expect(Array.isArray(accounts)).toBe(true);
    expect((accounts as string[])[0]?.toLowerCase()).toBe(TEST_ACCOUNT.toLowerCase());
  });

  it('T-APP-006 reject mode で eth_sendTransaction が code 4001 で reject される (anvilPort 不要)', async () => {
    const ctx = makeCtx('reject');

    await expect(
      handleRpcRequest(ctx, {
        method: 'eth_sendTransaction',
        params: [{ from: TEST_ACCOUNT, to: TEST_ACCOUNT, value: '0x0' }],
      }),
    ).rejects.toMatchObject({ code: 4001, message: 'User rejected the request.' });
  });

  it('T-APP-007 reject mode でも wallet_addEthereumChain は approval check 対象外で成功する', async () => {
    const ctx = makeCtx('reject');

    const result = await handleRpcRequest(ctx, {
      method: 'wallet_addEthereumChain',
      params: [{ chainId: '0x1' }],
    });

    expect(result).toBeNull();
    expect(ctx.chainState.current).toBe(1);
  });

  it('T-APP-008 approvalMode field を完全 omit した RpcContext でも default approve で personal_sign が成功する (external caller 互換契約の構造的担保)', async () => {
    const ctx: RpcContext = {
      privateKey: TEST_PRIVATE_KEY,
      chainState: { current: 31337 },
    };

    const sig = await handleRpcRequest(ctx, {
      method: 'personal_sign',
      params: ['hello', TEST_ACCOUNT],
    });

    expect(typeof sig).toBe('string');
    expect(sig).toMatch(/^0x[0-9a-fA-F]+$/);
  });
});
