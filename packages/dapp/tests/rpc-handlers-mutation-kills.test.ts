import { afterEach, describe, expect, it, vi } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import {
  handleRpcRequest,
  parseEip712TypedDataJson,
  verifyAnvilChainId,
  type RpcContext,
} from '../src/index.js';
import type { ChainConfig, Hex } from '../src/types.js';

/**
 * rpc-handlers の生存変異を殺すことを目的にした test。
 *
 * 既存の `rpc-handlers-branches.test.ts` は「reject されること」 までしか見ていない箇所が多く、
 * 分岐を反転させても同じ error code に落ちるため変異が生き残っていた。
 * 本 file は「どちらの経路を通ったか」 が結果から読み取れる観測点に assertion を置く。
 *
 * port 解決の観測点は **実際に fetch した URL**。 解決結果はそのまま
 * `http://127.0.0.1:<port>` になるため、 port 番号が経路を一意に示す。
 */

const PK1: Hex = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const PK2: Hex = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const ADDR1 = privateKeyToAccount(PK1).address;
const ADDR2 = privateKeyToAccount(PK2).address;
const CHAIN_ID = 31337;
const CHAIN_ID_HEX: Hex = '0x7a69';
/** registry 解決に失敗した時だけ使われる fallback。 registry 側の port と必ず別値にする。 */
const FALLBACK_PORT = 8545;

function ctx(overrides: Partial<RpcContext> = {}): RpcContext {
  return {
    privateKey: PK1,
    chainState: { current: CHAIN_ID },
    ...overrides,
  };
}

type RpcCall = { url: string; method: string; params: unknown[] };

type StubResponse = {
  ok?: boolean;
  status?: number;
  statusText?: string;
  /** JSON-RPC response body をそのまま差し替える。 未指定なら `{ result }` を返す。 */
  body?: unknown;
  /** `res.json()` を reject させる (非 JSON 応答の再現)。 */
  jsonError?: Error;
  /** `fetch` 自体を reject させる (transport 断の再現)。 */
  fetchError?: Error;
};

/**
 * anvil の JSON-RPC endpoint を差し替えて、 呼ばれた URL と method を記録する。
 * 戻り値の `calls` が「どの port へ向いたか」 の観測点になる。
 */
function stubAnvil(res: StubResponse | ((method: string) => StubResponse) = {}): {
  calls: RpcCall[];
} {
  const calls: RpcCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown, init?: { body?: string }) => {
      const parsed = JSON.parse(String(init?.body ?? '{}')) as {
        method?: string;
        params?: unknown[];
      };
      const method = parsed.method ?? '';
      calls.push({ url: String(input), method, params: parsed.params ?? [] });
      const spec = typeof res === 'function' ? res(method) : res;
      if (spec.fetchError) throw spec.fetchError;
      return {
        ok: spec.ok ?? true,
        status: spec.status ?? 200,
        statusText: spec.statusText ?? 'OK',
        json: async () => {
          if (spec.jsonError) throw spec.jsonError;
          return 'body' in spec ? spec.body : { jsonrpc: '2.0', id: 1, result: '0xfeed' };
        },
      };
    }),
  );
  return { calls };
}

/** `void verifyAnvilChainId(...)` のような fire-and-forget を待つ。 */
async function flushMicrotasks(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function registry(...chains: ChainConfig[]): { current: ChainConfig[] } {
  return { current: chains };
}

/** proxyToAnvil 経路を通して、 実際に解決された anvil port を返す。 */
async function resolvedPort(c: RpcContext): Promise<number> {
  const { calls } = stubAnvil();
  await handleRpcRequest(c, { method: 'eth_getBlockByNumber', params: ['latest'] });
  expect(calls, 'anvil への fetch が 1 度も起きていない (観測点が成立していない)').toHaveLength(1);
  const url = new URL(calls[0]!.url);
  return Number.parseInt(url.port, 10);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('resolveRegistryAnvilPort — 解決された port そのものを観測する', () => {
  it('T-RH-M-001 active chain の registry entry の port が使われる (fallback ではない)', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      chainRegistry: registry(
        { chainId: '0x1' as Hex, rpcUrls: ['http://127.0.0.1:8001'] },
        { chainId: CHAIN_ID_HEX, rpcUrls: ['http://127.0.0.1:8002'] },
      ),
    });
    expect(await resolvedPort(c)).toBe(8002);
  });

  it('T-RH-M-002 registry の chainId 大文字表記でも active chain として一致する', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      chainRegistry: registry({ chainId: '0x7A69' as Hex, rpcUrls: ['http://127.0.0.1:8010'] }),
    });
    expect(await resolvedPort(c)).toBe(8010);
  });

  it('T-RH-M-003 https + localhost も解決対象 (protocol / hostname の両方の許可枝)', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      chainRegistry: registry({ chainId: CHAIN_ID_HEX, rpcUrls: ['https://localhost:8003'] }),
    });
    expect(await resolvedPort(c)).toBe(8003);
  });

  it('T-RH-M-004 http 以外の protocol は解決せず fallback に降りる', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      chainRegistry: registry({ chainId: CHAIN_ID_HEX, rpcUrls: ['ws://127.0.0.1:8004'] }),
    });
    expect(await resolvedPort(c)).toBe(FALLBACK_PORT);
  });

  it('T-RH-M-005 localhost 以外の hostname は port が書いてあっても解決しない', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      chainRegistry: registry({ chainId: CHAIN_ID_HEX, rpcUrls: ['http://example.com:8005'] }),
    });
    expect(await resolvedPort(c)).toBe(FALLBACK_PORT);
  });

  it('T-RH-M-006 port 0 は有効 port として扱わない (0 を返すと解決済と誤認される)', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      chainRegistry: registry({ chainId: CHAIN_ID_HEX, rpcUrls: ['http://127.0.0.1:0'] }),
    });
    expect(await resolvedPort(c)).toBe(FALLBACK_PORT);
  });

  it('T-RH-M-007 port 未指定の URL は解決しない', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      chainRegistry: registry({ chainId: CHAIN_ID_HEX, rpcUrls: ['http://127.0.0.1/'] }),
    });
    expect(await resolvedPort(c)).toBe(FALLBACK_PORT);
  });

  it('T-RH-M-008 rpcUrls の非 string 要素は読み飛ばして後続の string を採る', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      chainRegistry: registry({
        chainId: CHAIN_ID_HEX,
        rpcUrls: [42 as unknown as string, 'http://127.0.0.1:8006'],
      }),
    });
    expect(await resolvedPort(c)).toBe(8006);
  });

  it('T-RH-M-009 active chain が registry に無い場合は throw せず fallback に降りる', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      chainRegistry: registry({ chainId: '0x1' as Hex, rpcUrls: ['http://127.0.0.1:8007'] }),
    });
    expect(await resolvedPort(c)).toBe(FALLBACK_PORT);
  });

  it('T-RH-M-010 registry entry に rpcUrls が無い場合も throw せず fallback に降りる', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      chainRegistry: registry({ chainId: CHAIN_ID_HEX }),
    });
    expect(await resolvedPort(c)).toBe(FALLBACK_PORT);
  });

  it('T-RH-M-011 chainRegistry 自体が無ければ ctx.anvilPort が使われる', async () => {
    expect(await resolvedPort(ctx({ anvilPort: FALLBACK_PORT }))).toBe(FALLBACK_PORT);
  });

  it('T-RH-M-012 URL として解釈できない rpcUrls は fallback に降りる', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      chainRegistry: registry({ chainId: CHAIN_ID_HEX, rpcUrls: ['not a url'] }),
    });
    expect(await resolvedPort(c)).toBe(FALLBACK_PORT);
  });
});

describe('anvilProxy — 応答の形ごとに別の error が出ることを見る', () => {
  it('T-RH-M-101 transport 断は -32603 の transport error として包まれる', async () => {
    stubAnvil({ fetchError: new Error('connect ECONNREFUSED') });
    await expect(
      handleRpcRequest(ctx({ anvilPort: FALLBACK_PORT }), { method: 'eth_getBlockByNumber' }),
    ).rejects.toMatchObject({
      code: -32603,
      message: 'anvil RPC transport error: connect ECONNREFUSED',
    });
  });

  it('T-RH-M-102 非 200 応答は status を含む non-200 error になる (body は読まない)', async () => {
    stubAnvil({ ok: false, status: 503, statusText: 'Service Unavailable' });
    await expect(
      handleRpcRequest(ctx({ anvilPort: FALLBACK_PORT }), { method: 'eth_getBlockByNumber' }),
    ).rejects.toMatchObject({
      code: -32603,
      message: 'anvil RPC non-200 response: 503 Service Unavailable',
    });
  });

  it('T-RH-M-103 JSON として読めない応答は non-JSON error になる', async () => {
    stubAnvil({ jsonError: new Error('Unexpected token <') });
    await expect(
      handleRpcRequest(ctx({ anvilPort: FALLBACK_PORT }), { method: 'eth_getBlockByNumber' }),
    ).rejects.toMatchObject({
      code: -32603,
      message: 'anvil RPC non-JSON response: Unexpected token <',
    });
  });

  it('T-RH-M-104 応答が string なら shape error に got string が入る', async () => {
    stubAnvil({ body: 'plain text' });
    await expect(
      handleRpcRequest(ctx({ anvilPort: FALLBACK_PORT }), { method: 'eth_getBlockByNumber' }),
    ).rejects.toMatchObject({
      code: -32603,
      message: 'anvil RPC invalid response shape: expected object, got string',
    });
  });

  it('T-RH-M-105 応答が null なら shape error に got null が入る', async () => {
    stubAnvil({ body: null });
    await expect(
      handleRpcRequest(ctx({ anvilPort: FALLBACK_PORT }), { method: 'eth_getBlockByNumber' }),
    ).rejects.toMatchObject({
      code: -32603,
      message: 'anvil RPC invalid response shape: expected object, got null',
    });
  });

  it('T-RH-M-106 応答が array なら shape error に got array が入る', async () => {
    stubAnvil({ body: [{ result: '0x1' }] });
    await expect(
      handleRpcRequest(ctx({ anvilPort: FALLBACK_PORT }), { method: 'eth_getBlockByNumber' }),
    ).rejects.toMatchObject({
      code: -32603,
      message: 'anvil RPC invalid response shape: expected object, got array',
    });
  });

  it('T-RH-M-107 JSON-RPC error 応答は anvil 側の code と message をそのまま伝える', async () => {
    stubAnvil({ body: { jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'header not found' } } });
    await expect(
      handleRpcRequest(ctx({ anvilPort: FALLBACK_PORT }), { method: 'eth_getBlockByNumber' }),
    ).rejects.toMatchObject({ code: -32000, message: 'header not found' });
  });

  it('T-RH-M-108 正常応答は result をそのまま返す', async () => {
    stubAnvil({ body: { jsonrpc: '2.0', id: 1, result: '0xdeadbeef' } });
    await expect(
      handleRpcRequest(ctx({ anvilPort: FALLBACK_PORT }), { method: 'eth_getBlockByNumber' }),
    ).resolves.toBe('0xdeadbeef');
  });
});

describe('verifyAnvilChainId — warn を出すかどうかで枝を見分ける', () => {
  it('T-RH-M-201 chainId が食い違う時だけ warn する', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    stubAnvil({ body: { result: '0x1' } });
    await verifyAnvilChainId(FALLBACK_PORT, CHAIN_ID);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toBe(
      `[kiwa] wallet_switchEthereumChain to ${CHAIN_ID} but anvil reports 1`,
    );
  });

  it('T-RH-M-202 chainId が一致していれば warn しない', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    stubAnvil({ body: { result: CHAIN_ID_HEX } });
    await verifyAnvilChainId(FALLBACK_PORT, CHAIN_ID);
    expect(warn).not.toHaveBeenCalled();
  });

  it('T-RH-M-203 result が無い応答では比較せず warn しない', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    stubAnvil({ body: { jsonrpc: '2.0', id: 1 } });
    await verifyAnvilChainId(FALLBACK_PORT, CHAIN_ID);
    expect(warn).not.toHaveBeenCalled();
  });

  it('T-RH-M-204 非 200 応答は body を読まずに戻る (warn しない)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    stubAnvil({ ok: false, status: 500, body: { result: '0x1' } });
    await verifyAnvilChainId(FALLBACK_PORT, CHAIN_ID);
    expect(warn).not.toHaveBeenCalled();
  });

  it('T-RH-M-205 transport 断は握り潰して warn しない', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    stubAnvil({ fetchError: new Error('fetch failed') });
    await expect(verifyAnvilChainId(FALLBACK_PORT, CHAIN_ID)).resolves.toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('wallet_switchEthereumChain — 入力検証の error を message まで見る', () => {
  it('T-RH-M-301 param が undefined なら chainId is required', async () => {
    await expect(
      handleRpcRequest(ctx(), { method: 'wallet_switchEthereumChain', params: [] }),
    ).rejects.toMatchObject({ code: -32602, message: 'invalid params: chainId is required' });
  });

  it('T-RH-M-302 param が null なら chainId is required', async () => {
    await expect(
      handleRpcRequest(ctx(), { method: 'wallet_switchEthereumChain', params: [null] }),
    ).rejects.toMatchObject({ code: -32602, message: 'invalid params: chainId is required' });
  });

  it('T-RH-M-303 chainId を欠く object も chainId is required (invalid chainId ではない)', async () => {
    await expect(
      handleRpcRequest(ctx(), { method: 'wallet_switchEthereumChain', params: [{}] }),
    ).rejects.toMatchObject({ code: -32602, message: 'invalid params: chainId is required' });
  });

  it('T-RH-M-304 object でない値は chainId プロパティを持っていても拒否する', async () => {
    const notAnObject = Object.assign(() => undefined, { chainId: CHAIN_ID_HEX });
    await expect(
      handleRpcRequest(ctx(), {
        method: 'wallet_switchEthereumChain',
        params: [notAnObject as unknown],
      }),
    ).rejects.toMatchObject({ code: -32602, message: 'invalid params: chainId is required' });
  });

  it('T-RH-M-305 先頭が 0x でない chainId は invalid chainId として拒否する', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: 'zz0x1' }],
      }),
    ).rejects.toMatchObject({ code: -32602, message: 'invalid params: invalid chainId zz0x1' });
  });

  it('T-RH-M-306 末尾に非 hex が付く chainId も invalid chainId として拒否する', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1zz' }],
      }),
    ).rejects.toMatchObject({ code: -32602, message: 'invalid params: invalid chainId 0x1zz' });
  });

  it('T-RH-M-307 registry 未登録の chain は 4902 と案内文を返す', async () => {
    const c = ctx({ chainRegistry: registry({ chainId: '0x1' as Hex }) });
    await expect(
      handleRpcRequest(c, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_ID_HEX }],
      }),
    ).rejects.toMatchObject({
      code: 4902,
      message:
        `Unrecognized Chain ID "${CHAIN_ID_HEX}". ` +
        'Try adding the chain via wallet_addEthereumChain first.',
    });
  });

  it('T-RH-M-308 registry に 1 件でも一致すれば switch できる (全件一致は要求しない)', async () => {
    const c = ctx({
      chainState: { current: 1 },
      chainRegistry: registry({ chainId: '0x1' as Hex }, { chainId: CHAIN_ID_HEX }),
    });
    await expect(
      handleRpcRequest(c, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_ID_HEX }],
      }),
    ).resolves.toBeNull();
    expect(c.chainState.current).toBe(CHAIN_ID);
  });

  it('T-RH-M-309 anvilPort があれば switch 後に chainId 確認の RPC を投げる', async () => {
    const { calls } = stubAnvil({ body: { result: CHAIN_ID_HEX } });
    const c = ctx({ chainState: { current: 1 }, anvilPort: FALLBACK_PORT });
    await handleRpcRequest(c, {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX }],
    });
    await flushMicrotasks();
    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe('eth_chainId');
    expect(calls[0]?.url).toBe(`http://127.0.0.1:${FALLBACK_PORT}`);
  });

  it('T-RH-M-310 anvilPort が無ければ確認 RPC を投げない', async () => {
    const { calls } = stubAnvil();
    const c = ctx({ chainState: { current: 1 } });
    await handleRpcRequest(c, {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX }],
    });
    await flushMicrotasks();
    expect(calls).toEqual([]);
  });
});

describe('wallet_addEthereumChain — registry に入った内容そのものを見る', () => {
  it('T-RH-M-401 有効な config は非 string 要素を除いた形で registry に入る', async () => {
    const reg = registry();
    const c = ctx({ chainRegistry: reg });
    await handleRpcRequest(c, {
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: CHAIN_ID_HEX,
          chainName: 'Anvil',
          rpcUrls: ['http://127.0.0.1:8545', 42],
          blockExplorerUrls: ['http://explorer.local', null],
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        },
      ],
    });
    expect(reg.current).toStrictEqual([
      {
        chainId: CHAIN_ID_HEX,
        chainName: 'Anvil',
        rpcUrls: ['http://127.0.0.1:8545'],
        blockExplorerUrls: ['http://explorer.local'],
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      },
    ]);
  });

  it('T-RH-M-402 chainName が非 string なら registry に載せない', async () => {
    const reg = registry();
    await handleRpcRequest(ctx({ chainRegistry: reg }), {
      method: 'wallet_addEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX, chainName: 42 }],
    });
    expect(reg.current).toStrictEqual([{ chainId: CHAIN_ID_HEX }]);
  });

  it('T-RH-M-403 nativeCurrency が null なら throw せず載せない', async () => {
    const reg = registry();
    await handleRpcRequest(ctx({ chainRegistry: reg }), {
      method: 'wallet_addEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX, nativeCurrency: null }],
    });
    expect(reg.current).toStrictEqual([{ chainId: CHAIN_ID_HEX }]);
  });

  it('T-RH-M-404 nativeCurrency.decimals が非 number なら 3 field すべて載せない', async () => {
    const reg = registry();
    await handleRpcRequest(ctx({ chainRegistry: reg }), {
      method: 'wallet_addEthereumChain',
      params: [
        { chainId: CHAIN_ID_HEX, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: '18' } },
      ],
    });
    expect(reg.current).toStrictEqual([{ chainId: CHAIN_ID_HEX }]);
  });

  it('T-RH-M-405 nativeCurrency.name が非 string なら 3 field すべて載せない', async () => {
    const reg = registry();
    await handleRpcRequest(ctx({ chainRegistry: reg }), {
      method: 'wallet_addEthereumChain',
      params: [
        { chainId: CHAIN_ID_HEX, nativeCurrency: { name: 42, symbol: 'ETH', decimals: 18 } },
      ],
    });
    expect(reg.current).toStrictEqual([{ chainId: CHAIN_ID_HEX }]);
  });

  it('T-RH-M-406 nativeCurrency.symbol が非 string なら 3 field すべて載せない', async () => {
    const reg = registry();
    await handleRpcRequest(ctx({ chainRegistry: reg }), {
      method: 'wallet_addEthereumChain',
      params: [
        { chainId: CHAIN_ID_HEX, nativeCurrency: { name: 'Ether', symbol: 42, decimals: 18 } },
      ],
    });
    expect(reg.current).toStrictEqual([{ chainId: CHAIN_ID_HEX }]);
  });

  it('T-RH-M-407 param が null なら TypeError ではなく -32602 で拒否する', async () => {
    await expect(
      handleRpcRequest(ctx(), { method: 'wallet_addEthereumChain', params: [null] }),
    ).rejects.toMatchObject({
      code: -32602,
      message: 'invalid params: chain config object is required',
    });
  });

  it('T-RH-M-408 chainId が非 string なら hex に見える文字列化をしても拒否する', async () => {
    const looksHex = { toString: () => CHAIN_ID_HEX };
    await expect(
      handleRpcRequest(ctx(), {
        method: 'wallet_addEthereumChain',
        params: [{ chainId: looksHex }],
      }),
    ).rejects.toMatchObject({
      code: -32602,
      message: `invalid params: chainId must be 0x-prefixed hex, got ${CHAIN_ID_HEX}`,
    });
  });

  it('T-RH-M-409 先頭が 0x でない chainId は拒否する', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'wallet_addEthereumChain',
        params: [{ chainId: 'zz0x1' }],
      }),
    ).rejects.toMatchObject({
      code: -32602,
      message: 'invalid params: chainId must be 0x-prefixed hex, got zz0x1',
    });
  });

  it('T-RH-M-410 末尾に非 hex が付く chainId は拒否する', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'wallet_addEthereumChain',
        params: [{ chainId: '0x1zz' }],
      }),
    ).rejects.toMatchObject({
      code: -32602,
      message: 'invalid params: chainId must be 0x-prefixed hex, got 0x1zz',
    });
  });

  it('T-RH-M-411 未登録 chain は既存 entry を書き換えず末尾に足す', async () => {
    const reg = registry(
      { chainId: '0x1' as Hex, chainName: 'mainnet' },
      { chainId: '0x2' as Hex, chainName: 'other' },
    );
    await handleRpcRequest(ctx({ chainRegistry: reg }), {
      method: 'wallet_addEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX, chainName: 'anvil' }],
    });
    expect(reg.current).toStrictEqual([
      { chainId: '0x1', chainName: 'mainnet' },
      { chainId: '0x2', chainName: 'other' },
      { chainId: CHAIN_ID_HEX, chainName: 'anvil' },
    ]);
  });

  it('T-RH-M-412 登録済 chain は同じ位置で置き換える', async () => {
    const reg = registry(
      { chainId: '0x1' as Hex, chainName: 'mainnet' },
      { chainId: CHAIN_ID_HEX, chainName: 'old' },
    );
    await handleRpcRequest(ctx({ chainRegistry: reg }), {
      method: 'wallet_addEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX, chainName: 'new' }],
    });
    expect(reg.current).toStrictEqual([
      { chainId: '0x1', chainName: 'mainnet' },
      { chainId: CHAIN_ID_HEX, chainName: 'new' },
    ]);
  });
});

describe('parseEip712TypedDataJson — detail の作り方まで見る', () => {
  const validTypedData = {
    types: { Person: [{ name: 'name', type: 'string' }] },
    primaryType: 'Person',
    domain: { name: 'kiwa' },
    message: { name: 'hi' },
  };

  it('T-RH-M-501 path を持つ issue は "path: message" 形式で detail に載る', () => {
    const { primaryType: _drop, ...withoutPrimaryType } = validTypedData;
    let caught: unknown;
    try {
      parseEip712TypedDataJson(JSON.stringify(withoutPrimaryType));
    } catch (e) {
      caught = e;
    }
    const message = (caught as { message: string }).message;
    expect(caught).toMatchObject({ code: -32602 });
    expect(message.startsWith('invalid params: primaryType: ')).toBe(true);
    expect(message.length).toBeGreaterThan('invalid params: primaryType: '.length);
  });

  it('T-RH-M-502 path を持たない issue は入力ごとに変わる message を detail にする', () => {
    /** 例外が出なければ観測が成立していないので失敗させる。 */
    const detailOf = (json: string): string => {
      try {
        parseEip712TypedDataJson(json);
      } catch (e) {
        return (e as { message: string }).message;
      }
      throw new Error(`例外が出ていない: ${json}`);
    };
    const forNumber = detailOf('123');
    const forString = detailOf('"abc"');
    for (const message of [forNumber, forString]) {
      expect(message.startsWith('invalid params: ')).toBe(true);
      // path 無しの issue なので `path: message` 形式にはしない。
      expect(message).not.toContain('undefined:');
    }
    // 固定文言に潰れていると 2 つが同じ文字列になる。 入力の型が detail に出ることを見る。
    expect(forNumber).toContain('number');
    expect(forString).toContain('string');
  });

  it('T-RH-M-503 JSON として壊れている入力は -32700 になる', () => {
    expect(() => parseEip712TypedDataJson('{ not json')).toThrow(
      expect.objectContaining({ code: -32700 }),
    );
  });

  it('T-RH-M-504 domain に無い field は key ごと省く (undefined を置かない)', () => {
    const result = parseEip712TypedDataJson(JSON.stringify(validTypedData));
    expect(result.domain).toStrictEqual({ name: 'kiwa' });
  });

  it('T-RH-M-511 domain に name が無ければ key ごと省く', () => {
    const { domain: _drop, ...rest } = validTypedData;
    const result = parseEip712TypedDataJson(
      JSON.stringify({ ...rest, domain: { version: '1' } }),
    );
    expect(result.domain).toStrictEqual({ version: '1' });
  });

  it('T-RH-M-505 domain の全 field を与えると全部が normalize されて載る', () => {
    const result = parseEip712TypedDataJson(
      JSON.stringify({
        ...validTypedData,
        domain: {
          name: 'kiwa',
          version: '1',
          chainId: '0x7a69',
          verifyingContract: '0xabababababababababababababababababababab',
          salt: '0xdeadbeef',
        },
      }),
    );
    expect(result.domain).toStrictEqual({
      name: 'kiwa',
      version: '1',
      chainId: CHAIN_ID,
      verifyingContract: '0xabababababababababababababababababababab',
      salt: '0xdeadbeef',
    });
  });

  it('T-RH-M-506 verifyingContract が不正なら field 名が message に出る', () => {
    expect(() =>
      parseEip712TypedDataJson(
        JSON.stringify({ ...validTypedData, domain: { verifyingContract: 'zz' } }),
      ),
    ).toThrow(
      expect.objectContaining({
        code: -32602,
        message: 'invalid params: domain.verifyingContract must be a 0x-prefixed hex string',
      }),
    );
  });

  it('T-RH-M-507 salt が不正なら field 名が message に出る', () => {
    expect(() =>
      parseEip712TypedDataJson(JSON.stringify({ ...validTypedData, domain: { salt: 'zz' } })),
    ).toThrow(
      expect.objectContaining({
        code: -32602,
        message: 'invalid params: domain.salt must be a 0x-prefixed hex string',
      }),
    );
  });

  it('T-RH-M-508 先頭が 0x でない hex 値は拒否する (末尾一致では通さない)', () => {
    expect(() =>
      parseEip712TypedDataJson(
        JSON.stringify({ ...validTypedData, domain: { salt: 'zz0x12' } }),
      ),
    ).toThrow(expect.objectContaining({ code: -32602 }));
  });

  it('T-RH-M-509 末尾に非 hex が付く値は拒否する (先頭一致では通さない)', () => {
    expect(() =>
      parseEip712TypedDataJson(
        JSON.stringify({ ...validTypedData, domain: { salt: '0x12zz' } }),
      ),
    ).toThrow(expect.objectContaining({ code: -32602 }));
  });

  it('T-RH-M-510 EIP712Domain は types から取り除かれる', () => {
    const result = parseEip712TypedDataJson(
      JSON.stringify({
        ...validTypedData,
        types: {
          EIP712Domain: [{ name: 'name', type: 'string' }],
          Person: [{ name: 'name', type: 'string' }],
        },
      }),
    );
    expect(Object.keys(result.types)).toStrictEqual(['Person']);
  });
});

describe('署名系 — 認可 error の message まで見る', () => {
  const typedDataJson = JSON.stringify({
    types: { Person: [{ name: 'name', type: 'string' }] },
    primaryType: 'Person',
    domain: { name: 'kiwa' },
    message: { name: 'hi' },
  });

  it('T-RH-M-601 signer 不一致は label 付きの 4100 message になる', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'eth_signTypedData_v4',
        params: [ADDR2, typedDataJson],
      }),
    ).rejects.toMatchObject({
      code: 4100,
      message: `unauthorized: requested signer ${ADDR2} does not match active account ${ADDR1}`,
    });
  });

  it('T-RH-M-602 signer が string でない場合も TypeError ではなく 4100 になる', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'eth_signTypedData_v4',
        params: [undefined, typedDataJson],
      }),
    ).rejects.toMatchObject({ code: 4100 });
  });

  it('T-RH-M-603 personal_sign の address 不一致も 4100 message を出す', async () => {
    await expect(
      handleRpcRequest(ctx(), { method: 'personal_sign', params: ['hello', ADDR2] }),
    ).rejects.toMatchObject({
      code: 4100,
      message: `unauthorized: requested address ${ADDR2} does not match active account ${ADDR1}`,
    });
  });

  it('T-RH-M-604 0x 始まりで hex でない message は -32602 で拒否する', async () => {
    await expect(
      handleRpcRequest(ctx(), { method: 'personal_sign', params: ['0xzz0x12', ADDR1] }),
    ).rejects.toMatchObject({
      code: -32602,
      message: expect.stringContaining('non-hex characters or odd length'),
    });
  });

  it('T-RH-M-605 有効な hex message は署名できる', async () => {
    const signature = await handleRpcRequest(ctx(), {
      method: 'personal_sign',
      params: ['0xdeadbeef', ADDR1],
    });
    expect(String(signature)).toMatch(/^0x[0-9a-f]{130}$/i);
  });
});

describe('eth_sendTransaction — from 検証の枝', () => {
  it('T-RH-M-701 from が active と違えば network に出る前に 4100 になる', async () => {
    const { calls } = stubAnvil();
    await expect(
      handleRpcRequest(ctx({ anvilPort: FALLBACK_PORT }), {
        method: 'eth_sendTransaction',
        params: [{ from: ADDR2, to: ADDR1, value: '0x1' }],
      }),
    ).rejects.toMatchObject({
      code: 4100,
      message: `unauthorized: from ${ADDR2} does not match active account ${ADDR1}`,
    });
    expect(calls, 'from 不一致なのに anvil へ出ている').toEqual([]);
  });

  it('T-RH-M-702 anvilPort が解決できない場合は method 名入りの -32603 になる', async () => {
    await expect(
      handleRpcRequest(ctx(), {
        method: 'eth_sendTransaction',
        params: [{ from: ADDR1, to: ADDR2 }],
      }),
    ).rejects.toMatchObject({
      code: -32603,
      message:
        "RPC method 'eth_sendTransaction' requires anvilPort in RpcContext " +
        '(not provided for live anvil tests)',
    });
  });
});

describe('approvalPolicy — limit の境界', () => {
  // viem が address として受理する形にする (checksum 不一致の混在表記は送信前に弾かれ、
  // limit 判定を通過したことを network 到達で確かめられなくなる)。
  const TOKEN: Hex = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
  /** approve(spender=0xabab..., amount=1000) */
  const APPROVE_1000: Hex =
    ('0x095ea7b3000000000000000000000000abababababababababababababababababababab' +
      '00000000000000000000000000000000000000000000000000000000000003e8') as Hex;

  it('T-RH-M-801 limit 0n は「上限なし」 として扱い reject しない', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      approvalPolicy: {
        current: {
          default: 'approve',
          perToken: { [TOKEN.toLowerCase() as Hex]: { mode: 'approve', limit: 0n } },
        },
      },
    });
    const { calls } = stubAnvil({ fetchError: new Error('connect ECONNREFUSED') });
    // limit 判定を通過したことは「送信に進んだ」 でしか観測できない。
    // reject 側の 4001 は network に出ないため、 anvil への到達有無が枝を一意に示す。
    await expect(
      handleRpcRequest(c, {
        method: 'eth_sendTransaction',
        params: [{ from: ADDR1, to: TOKEN, data: APPROVE_1000 }],
      }),
    ).rejects.toMatchObject({ code: -32603 });
    expect(calls.length, 'limit 0n を上限として扱い送信前に止めている').toBeGreaterThan(0);
  });

  it('T-RH-M-802 limit 超過は amount と limit を含む 4001 message になる', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      approvalPolicy: {
        current: {
          default: 'approve',
          perToken: { [TOKEN.toLowerCase() as Hex]: { mode: 'approve', limit: 100n } },
        },
      },
    });
    await expect(
      handleRpcRequest(c, {
        method: 'eth_sendTransaction',
        params: [{ from: ADDR1, to: TOKEN, data: APPROVE_1000 }],
      }),
    ).rejects.toMatchObject({
      code: 4001,
      message: `User rejected the request: approve amount 1000 exceeds limit 100 for token ${TOKEN}.`,
    });
  });

  it('T-RH-M-803 approve 以外の tx は token 別 message ではなく汎用 message で reject する', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      approvalPolicy: { current: { default: 'reject' } },
    });
    await expect(
      handleRpcRequest(c, {
        method: 'eth_sendTransaction',
        params: [{ from: ADDR1, to: TOKEN, value: '0x1' }],
      }),
    ).rejects.toMatchObject({ code: 4001, message: 'User rejected the request.' });
  });

  it('T-RH-M-805 to が非 string なら approve calldata でも token 別判定に入らない', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      approvalPolicy: { current: { default: 'reject' } },
    });
    // to が address でない時点で ERC20 approve として解釈してはいけない。
    // 汎用 message になることで、token 別経路に落ちていないと分かる。
    await expect(
      handleRpcRequest(c, {
        method: 'eth_sendTransaction',
        params: [{ from: ADDR1, to: 123, data: APPROVE_1000 }],
      }),
    ).rejects.toMatchObject({ code: 4001, message: 'User rejected the request.' });
  });

  it('T-RH-M-804 approve tx の reject は token address 入りの message になる', async () => {
    const c = ctx({
      anvilPort: FALLBACK_PORT,
      approvalPolicy: {
        current: {
          default: 'approve',
          perToken: { [TOKEN.toLowerCase() as Hex]: { mode: 'reject' } },
        },
      },
    });
    await expect(
      handleRpcRequest(c, {
        method: 'eth_sendTransaction',
        params: [{ from: ADDR1, to: TOKEN, data: APPROVE_1000 }],
      }),
    ).rejects.toMatchObject({
      code: 4001,
      message: `User rejected the request for ERC20 approve on token ${TOKEN}.`,
    });
  });
});

describe('account 解決とブロック済 method', () => {
  it('T-RH-M-901 activeIndex 範囲外は internal error code -32603 を持つ', async () => {
    await expect(
      handleRpcRequest(ctx({ accounts: [PK1], activeIndex: { current: 5 } }), {
        method: 'eth_chainId',
      }),
    ).rejects.toMatchObject({
      code: -32603,
      message: 'internal: activeIndex 5 out of bounds for accounts length 1',
    });
  });

  it('T-RH-M-902 accounts はあるが activeIndex が無い場合は先頭を active にする', async () => {
    const result = await handleRpcRequest(ctx({ accounts: [PK2, PK1] }), {
      method: 'eth_accounts',
    });
    expect(result).toStrictEqual([ADDR2, ADDR1]);
  });

  it('T-RH-M-903 activeIndex 指定時は active を先頭に並べ替える', async () => {
    const result = await handleRpcRequest(
      ctx({ accounts: [PK2, PK1], activeIndex: { current: 1 } }),
      { method: 'eth_accounts' },
    );
    expect(result).toStrictEqual([ADDR1, ADDR2]);
  });

  it.each([
    'eth_subscribe',
    'eth_unsubscribe',
    'wallet_requestPermissions',
    'wallet_getPermissions',
    'eth_sign',
  ])('T-RH-M-904 %s は 4200 で拒否する', async (method) => {
    await expect(
      handleRpcRequest(ctx({ anvilPort: FALLBACK_PORT }), { method }),
    ).rejects.toMatchObject({ code: 4200, message: `method not supported: ${method}` });
  });

  it('T-RH-M-905 net_version は 10 進数の文字列を返す', async () => {
    await expect(handleRpcRequest(ctx(), { method: 'net_version' })).resolves.toBe('31337');
  });

  it('T-RH-M-906 eth_chainId は 0x 表記を返す', async () => {
    await expect(handleRpcRequest(ctx(), { method: 'eth_chainId' })).resolves.toBe(CHAIN_ID_HEX);
  });
});
