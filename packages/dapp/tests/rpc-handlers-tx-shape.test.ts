import { afterEach, describe, expect, it, vi } from 'vitest';
import { decodeFunctionData, parseAbi, parseTransaction } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI,
  handleRpcRequest,
  type RpcContext,
} from '../src/index.js';
import type { Address, Hex } from '../src/types.js';

/**
 * eth_sendTransaction が組み立てた transaction の中身を観測する test。
 *
 * `normalizeTxParams` / `normalizeTransactionValue` / `normalizeTransactionGas` は
 * export されておらず、 戻り値は viem の walletClient にしか渡らない。
 * 到達できる観測点は **anvil に届いた署名済 transaction** だけなので、
 * 偽 anvil を置いて `eth_sendRawTransaction` の payload を復号し、
 * to / value / gas / data が正規化の結果どうなったかを直接見る。
 *
 * ここで mock しているのは transport (fetch) だけで、 正規化も署名も実装が行う。
 */

const PK1: Hex = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ADDR1 = privateKeyToAccount(PK1).address;
const TO: Hex = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
const CONTRACT_ACCOUNT: Address = '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc';
const CHAIN_ID = 31337;
const ANVIL_PORT = 8545;
/** `eth_estimateGas` が返す値。 明示 gas を渡さなかった時だけ transaction に載る。 */
const ESTIMATED_GAS = 0x5208n;

function ctx(overrides: Partial<RpcContext> = {}): RpcContext {
  return {
    privateKey: PK1,
    chainState: { current: CHAIN_ID },
    anvilPort: ANVIL_PORT,
    ...overrides,
  };
}

type FakeAnvil = {
  /** 受け取った `eth_sendRawTransaction` の raw transaction。 */
  raw?: Hex;
  urls: string[];
  methods: string[];
  /** responder が答えられなかった method。 空でないなら偽 anvil の穴。 */
  unanswered: string[];
};

/**
 * viem の walletClient が投げる JSON-RPC に固定値で答える偽 anvil。
 * 署名と RLP は実装 (viem) がそのまま行うので、 raw transaction は本物の形になる。
 */
function fakeAnvil(): FakeAnvil {
  const sink: FakeAnvil = { urls: [], methods: [], unanswered: [] };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown, init?: { body?: string }) => {
      const req = JSON.parse(String(init?.body ?? '{}')) as {
        id?: number;
        method?: string;
        params?: unknown[];
      };
      const method = req.method ?? '';
      sink.urls.push(String(input));
      sink.methods.push(method);

      let result: unknown;
      let error: { code: number; message: string } | undefined;
      switch (method) {
        case 'eth_fillTransaction':
          // anvil / geth 拡張。 viem は未対応なら標準経路 (nonce + fee + estimate) に降りる。
          // ここで埋めてしまうと正規化の結果が偽 anvil 側の値に置き換わる。
          error = { code: -32601, message: 'method not found' };
          break;
        case 'eth_chainId':
          result = '0x7a69';
          break;
        case 'eth_getTransactionCount':
          result = '0x0';
          break;
        case 'eth_estimateGas':
          result = `0x${ESTIMATED_GAS.toString(16)}`;
          break;
        case 'eth_gasPrice':
        case 'eth_maxPriorityFeePerGas':
          result = '0x3b9aca00';
          break;
        case 'eth_getBlockByNumber':
          result = {
            number: '0x1',
            timestamp: '0x1',
            gasLimit: '0x1c9c380',
            baseFeePerGas: '0x3b9aca00',
          };
          break;
        case 'eth_sendRawTransaction':
          sink.raw = (req.params?.[0] ?? undefined) as Hex;
          result = `0x${'ab'.repeat(32)}`;
          break;
        default:
          sink.unanswered.push(method);
          result = null;
      }
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        // viem の http transport は Content-Type を見てから body を読む。
        // headers が無いと本文まで届かず transport error に落ちる。
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () =>
          error
            ? { jsonrpc: '2.0', id: req.id ?? 1, error }
            : { jsonrpc: '2.0', id: req.id ?? 1, result },
      };
    }),
  );
  return sink;
}

/** 偽 anvil に届いた transaction を復号する。 届いていなければ失敗させる。 */
function sentTransaction(sink: FakeAnvil) {
  expect(sink.unanswered, '偽 anvil が答えられない RPC がある (観測が成立していない)').toEqual([]);
  expect(sink.raw, 'eth_sendRawTransaction が届いていない').toBeDefined();
  return parseTransaction(sink.raw as Hex);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('eth_sendTransaction — 署名済 transaction の中身', () => {
  it('T-RH-TX-001 hex 文字列の value / gas は bigint に直して載る', async () => {
    const sink = fakeAnvil();
    await handleRpcRequest(ctx(), {
      method: 'eth_sendTransaction',
      params: [{ to: TO, value: '0x64', gas: '0x7530', data: '0xabcd' }],
    });
    const tx = sentTransaction(sink);
    expect({ to: tx.to, value: tx.value, gas: tx.gas, data: tx.data }).toStrictEqual({
      to: TO,
      value: 100n,
      gas: 0x7530n,
      data: '0xabcd',
    });
  });

  it('T-RH-TX-002 bigint の value / gas はそのまま載る', async () => {
    const sink = fakeAnvil();
    await handleRpcRequest(ctx(), {
      method: 'eth_sendTransaction',
      params: [{ to: TO, value: 100n, gas: 0x7530n }],
    });
    const tx = sentTransaction(sink);
    expect({ value: tx.value, gas: tx.gas }).toStrictEqual({ value: 100n, gas: 0x7530n });
  });

  it('T-RH-TX-003 string でも bigint でもない value / gas は捨てる', async () => {
    const sink = fakeAnvil();
    await handleRpcRequest(ctx(), {
      method: 'eth_sendTransaction',
      params: [{ to: TO, value: 7, gas: 9 }],
    });
    const tx = sentTransaction(sink);
    // value は載らず 0、 gas は estimate に落ちる。 7 / 9 が素通しされていれば両方変わる。
    expect({ value: tx.value ?? 0n, gas: tx.gas }).toStrictEqual({
      value: 0n,
      gas: ESTIMATED_GAS,
    });
  });

  it('T-RH-TX-004 value / gas 未指定なら value 0 で gas は estimate 値になる', async () => {
    const sink = fakeAnvil();
    await handleRpcRequest(ctx(), { method: 'eth_sendTransaction', params: [{ to: TO }] });
    const tx = sentTransaction(sink);
    expect({ value: tx.value ?? 0n, gas: tx.gas }).toStrictEqual({
      value: 0n,
      gas: ESTIMATED_GAS,
    });
    expect(sink.methods).toContain('eth_estimateGas');
  });

  it('T-RH-TX-005 to / data が string でなければ載せず contract 作成として送る', async () => {
    const sink = fakeAnvil();
    await handleRpcRequest(ctx(), {
      method: 'eth_sendTransaction',
      params: [{ to: 123, data: 456 }],
    });
    const tx = sentTransaction(sink);
    expect(tx.to ?? null).toBeNull();
    expect(tx.data ?? '0x').toBe('0x');
  });

  it('T-RH-TX-006 from 未指定でも認可 check で止まらず送信できる', async () => {
    const sink = fakeAnvil();
    await handleRpcRequest(ctx(), {
      method: 'eth_sendTransaction',
      params: [{ to: TO, value: '0x1' }],
    });
    expect(sentTransaction(sink).to).toBe(TO);
  });

  it('T-RH-TX-007 解決済 port と chainId が transaction と接続先の両方に反映される', async () => {
    const sink = fakeAnvil();
    await handleRpcRequest(ctx(), { method: 'eth_sendTransaction', params: [{ to: TO }] });
    const tx = sentTransaction(sink);
    expect(tx.chainId).toBe(CHAIN_ID);
    expect(new Set(sink.urls)).toStrictEqual(new Set([`http://127.0.0.1:${ANVIL_PORT}/`]));
  });

  it('T-RH-TX-008 registry で解決した port が送信先になる', async () => {
    const sink = fakeAnvil();
    const c = ctx({
      chainRegistry: {
        current: [{ chainId: '0x7a69' as Hex, rpcUrls: ['http://127.0.0.1:8611'] }],
      },
    });
    await handleRpcRequest(c, { method: 'eth_sendTransaction', params: [{ to: TO }] });
    sentTransaction(sink);
    expect(new Set(sink.urls)).toStrictEqual(new Set(['http://127.0.0.1:8611/']));
  });
});

describe('eth_sendTransaction — contract account 経路', () => {
  function contractCtx(overrides: Partial<RpcContext> = {}): RpcContext {
    return ctx({
      contractAccount: {
        address: CONTRACT_ACCOUNT,
        executeAbi: DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI,
      },
      ...overrides,
    });
  }

  /** contract account 経由の transaction から execute(target, value, data) の引数を取り出す。 */
  function executeArgs(sink: FakeAnvil) {
    const tx = sentTransaction(sink);
    expect(tx.to, 'contract account 宛になっていない').toBe(CONTRACT_ACCOUNT);
    const decoded = decodeFunctionData({
      abi: parseAbi(DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI),
      data: tx.data as Hex,
    });
    expect(decoded.functionName).toBe('execute');
    // decode は address を checksum 表記に直すため、 比較は小文字に揃える。
    const [target, value, data] = decoded.args;
    return { args: [String(target).toLowerCase(), value, data], gas: tx.gas };
  }

  it('T-RH-TX-101 target / value / data が execute の引数に載る', async () => {
    const sink = fakeAnvil();
    await handleRpcRequest(contractCtx(), {
      method: 'eth_sendTransaction',
      params: [{ from: CONTRACT_ACCOUNT, to: TO, value: '0x64', data: '0xabcd' }],
    });
    expect(executeArgs(sink).args).toStrictEqual([TO, 100n, '0xabcd']);
  });

  it('T-RH-TX-102 value / data 未指定は 0 と 0x で埋める', async () => {
    const sink = fakeAnvil();
    await handleRpcRequest(contractCtx(), {
      method: 'eth_sendTransaction',
      params: [{ from: CONTRACT_ACCOUNT, to: TO }],
    });
    expect(executeArgs(sink).args).toStrictEqual([TO, 0n, '0x']);
  });

  it('T-RH-TX-103 gas を渡した時だけ execute の transaction に gas が載る', async () => {
    const sink = fakeAnvil();
    await handleRpcRequest(contractCtx(), {
      method: 'eth_sendTransaction',
      params: [{ from: CONTRACT_ACCOUNT, to: TO, gas: '0x7530' }],
    });
    expect(executeArgs(sink).gas).toBe(0x7530n);
  });

  it('T-RH-TX-104 gas 未指定なら estimate 値が使われる', async () => {
    const sink = fakeAnvil();
    await handleRpcRequest(contractCtx(), {
      method: 'eth_sendTransaction',
      params: [{ from: CONTRACT_ACCOUNT, to: TO }],
    });
    expect(executeArgs(sink).gas).toBe(ESTIMATED_GAS);
  });

  it('T-RH-TX-105 to を欠く場合は encoding error ではなく params error で止まる', async () => {
    fakeAnvil();
    await expect(
      handleRpcRequest(contractCtx(), {
        method: 'eth_sendTransaction',
        params: [{ from: CONTRACT_ACCOUNT, value: '0x1' }],
      }),
    ).rejects.toMatchObject({
      code: -32602,
      message:
        'invalid params: eth_sendTransaction for contract accounts requires ' +
        'a target address in `to`',
    });
  });

  it('T-RH-TX-106 executeAbi に execute が無ければ encoding failed になる', async () => {
    fakeAnvil();
    const c = contractCtx({
      contractAccount: {
        address: CONTRACT_ACCOUNT,
        executeAbi: ['function run(address target, uint256 value, bytes data) returns (bytes)'],
      },
    });
    await expect(
      handleRpcRequest(c, {
        method: 'eth_sendTransaction',
        params: [{ from: CONTRACT_ACCOUNT, to: TO }],
      }),
    ).rejects.toMatchObject({
      code: -32603,
      message: expect.stringContaining('contract account execute encoding failed'),
    });
  });

  it('T-RH-TX-107 contract account 時の eth_accounts は contract address だけを返す', async () => {
    await expect(
      handleRpcRequest(contractCtx(), { method: 'eth_accounts' }),
    ).resolves.toStrictEqual([CONTRACT_ACCOUNT]);
  });
});

describe('contract account の署名検証', () => {
  const typedDataJson = JSON.stringify({
    types: { Person: [{ name: 'name', type: 'string' }] },
    primaryType: 'Person',
    domain: { name: 'kiwa' },
    message: { name: 'hi' },
  });

  /** `eth_call` に固定の返り値を与える偽 anvil。 EIP-1271 の判定だけを切り替える。 */
  function stubEthCall(result: unknown): void {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: unknown, init?: { body?: string }) => {
        const req = JSON.parse(String(init?.body ?? '{}')) as { id?: number };
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ jsonrpc: '2.0', id: req.id ?? 1, result }),
        };
      }),
    );
  }

  function contractCtx(overrides: Partial<RpcContext> = {}): RpcContext {
    return ctx({
      contractAccount: {
        address: CONTRACT_ACCOUNT,
        executeAbi: DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI,
      },
      ...overrides,
    });
  }

  it('T-RH-TX-201 magic value が返れば署名を返す', async () => {
    stubEthCall(`0x1626ba7e${'0'.repeat(56)}`);
    const signature = await handleRpcRequest(contractCtx(), {
      method: 'eth_signTypedData_v4',
      params: [CONTRACT_ACCOUNT, typedDataJson],
    });
    expect(String(signature)).toMatch(/^0x[0-9a-f]{130}$/i);
  });

  it('T-RH-TX-202 magic value 以外が返れば -32000 で拒否する', async () => {
    stubEthCall(`0xffffffff${'0'.repeat(56)}`);
    await expect(
      handleRpcRequest(contractCtx(), {
        method: 'eth_signTypedData_v4',
        params: [CONTRACT_ACCOUNT, typedDataJson],
      }),
    ).rejects.toMatchObject({ code: -32000, message: 'EIP-1271 verification failed' });
  });

  it('T-RH-TX-203 personal_sign も同じ検証を通る', async () => {
    stubEthCall(`0xffffffff${'0'.repeat(56)}`);
    await expect(
      handleRpcRequest(contractCtx(), {
        method: 'personal_sign',
        params: ['hello', CONTRACT_ACCOUNT],
      }),
    ).rejects.toMatchObject({ code: -32000 });
  });

  it('T-RH-TX-204 anvilPort が無ければ検証できない旨の -32603 になる', async () => {
    stubEthCall('0x');
    const c = contractCtx({ anvilPort: undefined });
    await expect(
      handleRpcRequest(c, {
        method: 'eth_signTypedData_v4',
        params: [CONTRACT_ACCOUNT, typedDataJson],
      }),
    ).rejects.toMatchObject({
      code: -32603,
      message: 'contract account signing requires anvilPort in RpcContext to verify EIP-1271',
    });
  });
});
