import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RpcContext } from '../src/rpc-handlers.js';
import type { Hex } from '../src/types.js';

// contract account 経路の防御分岐 (private helper 側で ctx.contractAccount が消えている
// 場合) と、 ERC20 approve の decode 失敗 fallback を通す。
//
// broadcast (../src/tx.js) と proxy (fetch) は差し替えて、 万一分岐に落ちなかった場合でも
// 実 anvil / 実 network に出ないようにしている。
vi.mock('../src/tx.js', () => ({
  sendTransaction: vi.fn(async () => {
    throw new Error('broadcast は本 test では起こさない');
  }),
}));

const PK: Hex = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const CONTRACT_ACCOUNT: Hex = '0x1234567890123456789012345678901234567890';
const TOKEN: Hex = '0x2222222222222222222222222222222222222222';

async function loadRpcHandlers() {
  return await import('../src/rpc-handlers.js');
}

function baseContractAccountCtx(): RpcContext {
  return {
    privateKey: PK,
    chainState: { current: 31337 },
    anvilPort: 8545,
    contractAccount: {
      address: CONTRACT_ACCOUNT,
      executeAbi: ['function execute(address target, uint256 value, bytes data) returns (bytes)'],
    },
  } as RpcContext;
}

/**
 * `ctx.contractAccount` の N 回目以降の読み取りを undefined にする ctx を作る。
 *
 * private helper 側の `!contractAccount` 分岐は、 呼出元 (case 節) が既に truthy を
 * 確認しているため通常の入力では到達しない。 読み取り回数で hide することで、
 * 「呼出元の確認後に設定が消えた」 状況だけを再現する。
 * 読み取り位置は resolveActiveAddress で 2 回 / case 節の guard で 1 回 / helper 内で
 * 1 回の計 4 回。 hide 位置がずれたら test 側の read 数 assert が落ちる。
 */
function hideContractAccountFromRead(base: RpcContext, hideFromRead: number) {
  const config = base.contractAccount;
  let reads = 0;
  const ctx = { ...base } as RpcContext;
  Object.defineProperty(ctx, 'contractAccount', {
    configurable: true,
    get() {
      reads += 1;
      return reads >= hideFromRead ? undefined : config;
    },
  });
  return { ctx, readCount: () => reads };
}

describe('contract account 経路の防御分岐', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // proxy / EIP-1271 verify が万一走っても外へ出さない
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('network は本 test では使わない');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('T-RH-201 署名検証 helper に入った時点で contract account 設定が無ければ検証を飛ばす', async () => {
    const { ctx, readCount } = hideContractAccountFromRead(baseContractAccountCtx(), 4);
    const { handleRpcRequest } = await loadRpcHandlers();

    const signature = await handleRpcRequest(ctx, {
      method: 'personal_sign',
      params: ['hello kiwa', CONTRACT_ACCOUNT],
    });

    // 署名自体は返る = EIP-1271 検証に進まず早期 return した
    expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/);
    // 検証に進んでいれば eth_call のため fetch が呼ばれる
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(readCount()).toBe(4);
  });

  it('T-RH-202 送信 helper に入った時点で contract account 設定が無ければ内部エラーにする', async () => {
    const { ctx, readCount } = hideContractAccountFromRead(baseContractAccountCtx(), 4);
    const { handleRpcRequest } = await loadRpcHandlers();

    await expect(
      handleRpcRequest(ctx, {
        method: 'eth_sendTransaction',
        params: [{ to: TOKEN, value: '0x0' }],
      }),
    ).rejects.toMatchObject({
      code: -32603,
      message: 'internal: missing contract account config',
    });
    expect(readCount()).toBe(4);
  });

  it('T-RH-203 contract account 設定が生きていれば EIP-1271 検証まで進む', async () => {
    // 前 2 件が「消えた時だけ」 の分岐であることの対照。 hide しなければ検証に入り、
    // eth_call (fetch) が失敗するので検証 NG として reject する
    const { handleRpcRequest } = await loadRpcHandlers();

    await expect(
      handleRpcRequest(baseContractAccountCtx(), {
        method: 'personal_sign',
        params: ['hello kiwa', CONTRACT_ACCOUNT],
      }),
    ).rejects.toMatchObject({ code: -32000, message: 'EIP-1271 verification failed' });
    expect(fetchSpy).toHaveBeenCalled();
  });
});

describe('ERC20 approve の decode 失敗 fallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('T-RH-204 approve selector だが引数が壊れた data は token 別 policy を引かない', async () => {
    const { handleRpcRequest } = await loadRpcHandlers();
    const ctx = {
      privateKey: PK,
      chainState: { current: 31337 },
      anvilPort: 8545,
      approvalPolicy: { current: { default: 'reject' as const } },
    } as RpcContext;

    // selector は approve(address,uint256) だが引数 32 byte 分が足りない
    const promise = handleRpcRequest(ctx, {
      method: 'eth_sendTransaction',
      params: [{ to: TOKEN, data: '0x095ea7b3dead' }],
    });

    // decode 失敗で approve とみなせず、 token 別ではなく既定 policy で reject される
    await expect(promise).rejects.toMatchObject({
      code: 4001,
      message: 'User rejected the request.',
    });
  });

  it('T-RH-205 正しい approve data なら token 名入りの reject message になる', async () => {
    const { handleRpcRequest } = await loadRpcHandlers();
    const { encodeFunctionData } = await import('viem');
    const ctx = {
      privateKey: PK,
      chainState: { current: 31337 },
      anvilPort: 8545,
      approvalPolicy: { current: { default: 'reject' as const } },
    } as RpcContext;

    const data = encodeFunctionData({
      abi: [
        {
          type: 'function',
          name: 'approve',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ] as const,
      functionName: 'approve',
      args: [CONTRACT_ACCOUNT, 1n],
    });

    await expect(
      handleRpcRequest(ctx, {
        method: 'eth_sendTransaction',
        params: [{ to: TOKEN, data }],
      }),
    ).rejects.toMatchObject({
      code: 4001,
      message: `User rejected the request for ERC20 approve on token ${TOKEN}.`,
    });
  });
});
