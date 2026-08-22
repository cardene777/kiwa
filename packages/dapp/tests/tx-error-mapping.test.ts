import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Hex, TxBroadcastCtx } from '../src/types.js';

// sendTransaction の error 分類 (transport / invalid params / revert) は、 実 anvil
// では特定の error 型を狙って発生させられない。 外部依存である viem の
// createWalletClient だけを差し替えて、 broadcast 結果を直接指定する。
// error 型の判定に使う viem の class 群と hexToBigInt は実物のまま使う。
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return { ...actual, createWalletClient: vi.fn() };
});

const PK: Hex = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TO: Hex = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const CTX: TxBroadcastCtx = { privateKey: PK, chainId: 31337, anvilPort: 8545 };

async function loadTx() {
  return await import('../src/tx.js');
}
async function loadViem() {
  return await import('viem');
}

/** wallet client の sendTransaction 結果だけを差し替える。 */
async function stubBroadcast(impl: (params: Record<string, unknown>) => Promise<unknown>) {
  const viem = await loadViem();
  const sendTransaction = vi.fn(impl);
  (viem.createWalletClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    sendTransaction,
  });
  return sendTransaction;
}

describe('sendTransaction の error 分類 (mocked wallet client)', () => {
  beforeEach(async () => {
    const viem = await loadViem();
    (viem.createWalletClient as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('T-TX-101 hex 文字列の value / gas は bigint に変換して broadcast する', async () => {
    const hash = `0x${'ab'.repeat(32)}`;
    const broadcast = await stubBroadcast(async () => hash);
    const tx = await loadTx();

    await expect(
      tx.sendTransaction(CTX, { to: TO, value: '0x2540be400' as Hex, gas: '0x5208' as Hex }),
    ).resolves.toBe(hash);

    expect(broadcast).toHaveBeenCalledWith({ to: TO, value: 10_000_000_000n, gas: 21_000n });
  });

  it('T-TX-102 未指定の field は broadcast payload に載せない', async () => {
    const broadcast = await stubBroadcast(async () => `0x${'cd'.repeat(32)}`);
    const tx = await loadTx();

    await tx.sendTransaction(CTX, { data: '0xdeadbeef' as Hex });

    expect(broadcast).toHaveBeenCalledWith({ data: '0xdeadbeef' });
  });

  it('T-TX-103 HttpRequestError は transport error (-32603) に写す', async () => {
    const viem = await loadViem();
    await stubBroadcast(async () => {
      throw new viem.HttpRequestError({ url: 'http://127.0.0.1:8545', status: 503 });
    });
    const tx = await loadTx();

    await expect(tx.sendTransaction(CTX, { to: TO, value: 1n })).rejects.toMatchObject({
      code: -32603,
      message: expect.stringContaining('transaction transport error'),
    });
  });

  it('T-TX-104 原因を辿った先が InvalidParamsRpcError なら -32602 に写す', async () => {
    const viem = await loadViem();
    const rpcError = new viem.InvalidParamsRpcError(
      Object.assign(new Error('bad params'), { name: 'RpcRequestError' }) as never,
    );
    // walkCause は cause を辿り切った末端を root とみなす。 末端であることを表すため
    // cause を落とす (これが無いと root は内側の Error になり判定が変わる)
    Object.defineProperty(rpcError, 'cause', { value: undefined, configurable: true });
    await stubBroadcast(async () => {
      throw rpcError;
    });
    const tx = await loadTx();

    await expect(tx.sendTransaction(CTX, { to: TO, value: 1n })).rejects.toMatchObject({
      code: -32602,
      message: expect.stringContaining('transaction invalid params'),
    });
  });

  it('T-TX-105 viem 由来でない network error も transport error (-32603) に写す', async () => {
    await stubBroadcast(async () => {
      throw new Error('fetch failed');
    });
    const tx = await loadTx();

    await expect(tx.sendTransaction(CTX, { to: TO, value: 1n })).rejects.toMatchObject({
      code: -32603,
      message: 'transaction transport error: fetch failed',
    });
  });

  it('T-TX-106 Error ですらない throw も message 化して reject (code 3) に写す', async () => {
    await stubBroadcast(async () => {
      throw 'wallet exploded';
    });
    const tx = await loadTx();

    await expect(tx.sendTransaction(CTX, { to: TO, value: 1n })).rejects.toMatchObject({
      code: 3,
      message: 'transaction rejected: wallet exploded',
    });
  });
});
