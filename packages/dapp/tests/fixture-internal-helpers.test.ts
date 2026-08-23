import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEventEmitter } from '../src/event-emitter.js';
import type { RpcContext } from '../src/rpc-handlers.js';
import type { Hex } from '../src/types.js';

// fixture.ts の非 export helper (emitPageEvent / getRpcBridgeName / normalizeAddressKey /
// getRequiredValue) は Playwright fixture body からしか呼ばれないため、 vitest からは
// fixture body 自体を起動しない限り 1 度も走らない。
//
// そこで外部依存である @playwright/test だけを差し替え、 base.extend に渡された
// fixture 定義そのものを捕まえる。 定義は素の async function なので、 依存 (page /
// _rpcContexts 等) を構造的な fake で与えれば実 browser も実 anvil もなしで起動できる。
const hoisted = vi.hoisted(() => ({
  fixtureDefs: {} as Record<
    string,
    (deps: Record<string, unknown>, use: (value: unknown) => Promise<void>) => Promise<void>
  >,
}));

vi.mock('@playwright/test', () => ({
  test: {
    extend: (defs: Record<string, unknown>) => {
      Object.assign(hoisted.fixtureDefs, defs);
      return { extend: () => ({}) };
    },
  },
}));

const PK_A: Hex = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const PK_B: Hex = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const ICON = 'data:image/svg+xml,%3Csvg%3E%3C/svg%3E';

interface EmittedEvent {
  target: string;
  evt: string;
  payload: unknown[];
}

/** page.evaluate に渡された関数を実際に実行する fake。 実 browser は使わない。 */
function makeFakePage(evaluated: Array<{ arg: unknown }>) {
  return {
    evaluate: vi.fn(async (fn: (arg?: unknown) => unknown, arg?: unknown) => {
      evaluated.push({ arg });
      return arg === undefined ? await (fn as () => unknown)() : await fn(arg);
    }),
    exposeFunction: vi.fn(async () => undefined),
    addInitScript: vi.fn(async () => undefined),
    goto: vi.fn(async () => undefined),
  };
}

function makeWallet(rdns: string, privateKey: Hex) {
  return { name: `wallet-${rdns}`, rdns, icon: ICON, privateKey, chainId: 31337 };
}

function makeRpcContext(privateKey: Hex, extra: Partial<RpcContext> = {}): RpcContext {
  return {
    privateKey,
    chainState: { current: 31337 },
    approvalPolicy: { current: { default: 'approve' } },
    anvilPort: 8545,
    emitter: createEventEmitter(),
    rejectConnect: { current: false },
    ...extra,
  } as RpcContext;
}

function makeTracker() {
  let counter = 0;
  return {
    pendingRpcs: new Map<
      number,
      { request: { method: string; params?: unknown[] }; startedAt: number; promise: Promise<unknown> }
    >(),
    nextId: () => ++counter,
  };
}

describe('fixture body callbacks (fake Playwright fixture 経由)', () => {
  let emitted: EmittedEvent[];
  let evaluated: Array<{ arg: unknown }>;

  beforeEach(async () => {
    // fixture.ts の import 時に base.extend が走って定義が捕まる
    await import('../src/fixture.js');
    emitted = [];
    evaluated = [];
    // page 側 script が触る browser global を構造的に再現する
    vi.stubGlobal('window', {
      __dappE2eEmitters: new Proxy(
        {},
        {
          get:
            (_target, prop: string) =>
            (evt: string, ...args: unknown[]) => {
              emitted.push({ target: prop, evt, payload: args });
            },
        },
      ),
    });
    vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('T-FIX-201 wallet fixture は先頭 wallet config の private key から account を導く', async () => {
    let received: { address?: string } | undefined;
    await hoisted.fixtureDefs.wallet!(
      { _walletConfigs: [makeWallet('io.metamask', PK_A)] },
      async (value) => {
        received = value as { address?: string };
      },
    );

    expect(received?.address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  });

  it('T-FIX-202 wallet config が 1 件も無ければ「何が欠けているか」 を示して throw する', async () => {
    await expect(
      hoisted.fixtureDefs.wallet!({ _walletConfigs: [] }, async () => undefined),
    ).rejects.toThrow('kiwa: missing wallet config');
  });

  it('T-FIX-203 _rpcContext fixture は先頭 rpc context をそのまま渡す', async () => {
    const ctx = makeRpcContext(PK_A);
    let received: unknown;
    await hoisted.fixtureDefs._rpcContext!({ _rpcContexts: [ctx] }, async (value) => {
      received = value;
    });

    expect(received).toBe(ctx);
  });

  it('T-FIX-204 _rpcContext fixture は rpc context が空なら throw する', async () => {
    await expect(
      hoisted.fixtureDefs._rpcContext!({ _rpcContexts: [] }, async () => undefined),
    ).rejects.toThrow('kiwa: missing rpc context');
  });

  it('T-FIX-205 dappE2e の各 helper が rdns から導いた bridge 名宛に page event を送る', async () => {
    const page = makeFakePage(evaluated);
    const ctx = makeRpcContext(PK_A, {
      accounts: [PK_A, PK_B],
      activeIndex: { current: 0 },
    });
    const api = await useDappE2e(page, [makeWallet('io.metamask', PK_A)], [ctx]);

    await api.connect();
    await api.triggerEvent('accountsChanged', ['0xabc']);
    await api.switchChain('0x1');
    await api.disconnect();

    // bridge 名は rdns の非英数字を _ に潰した固定形式
    expect(emitted.map((e) => e.target)).toEqual([
      '__dappE2eRpc_io_metamask',
      '__dappE2eRpc_io_metamask',
      '__dappE2eRpc_io_metamask',
      '__dappE2eRpc_io_metamask',
    ]);
    expect(emitted.map((e) => e.evt)).toEqual([
      'connect',
      'accountsChanged',
      'chainChanged',
      'disconnect',
    ]);
    // connect は現在の chainId を hex で載せる
    expect(emitted[0]?.payload[0]).toEqual({ chainId: '0x7a69' });
    // switchChain は rpc context 側の chain も進める
    expect(ctx.chainState.current).toBe(1);
    expect(emitted[2]?.payload[0]).toBe('0x1');
    expect(emitted[3]?.payload[0]).toEqual({ code: 4900, message: 'Disconnected' });
  });

  it('T-FIX-206 setApprovalModeForToken は token address を小文字に正規化して policy を引く', async () => {
    const page = makeFakePage(evaluated);
    const ctx = makeRpcContext(PK_A);
    const api = await useDappE2e(page, [makeWallet('io.metamask', PK_A)], [ctx]);

    const mixedCase = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa' as Hex;
    await api.setApprovalModeForToken(mixedCase, { mode: 'reject', limit: 5n });

    const perToken = ctx.approvalPolicy?.current.perToken ?? {};
    // 大文字混じりの key ではなく小文字 key で引ける = normalizeAddressKey が効いている
    expect(Object.keys(perToken)).toEqual([mixedCase.toLowerCase()]);
    expect(perToken[mixedCase.toLowerCase() as Hex]).toEqual({ mode: 'reject', limit: 5n });
  });

  it('T-FIX-207 setActiveAccount は index 切替後の address を page へ通知する', async () => {
    const page = makeFakePage(evaluated);
    const activeIndex = { current: 0 };
    const ctx = makeRpcContext(PK_A, { accounts: [PK_A, PK_B], activeIndex });
    const api = await useDappE2e(page, [makeWallet('io.metamask', PK_A)], [ctx]);

    await api.setActiveAccount(1);

    expect(activeIndex.current).toBe(1);
    expect(emitted.at(-1)).toEqual({
      target: '__dappE2eRpc_io_metamask',
      evt: 'accountsChanged',
      payload: [['0x70997970C51812dc3A010C7d01b50e0d17dc79C8']],
    });
  });

  it('T-FIX-208 wallet が 2 件なら rdns 引きの wallets record が生え、未知 rdns で throw する', async () => {
    const page = makeFakePage(evaluated);
    const wallets = [makeWallet('io.metamask', PK_A), makeWallet('com.example.other', PK_B)];
    const contexts = [makeRpcContext(PK_A), makeRpcContext(PK_B)];
    const api = await useDappE2e(page, wallets, contexts);

    expect(Object.keys(api.wallets ?? {})).toEqual(['io.metamask', 'com.example.other']);
    await api.wallets!['com.example.other']!.connect();
    expect(emitted.at(-1)?.target).toBe('__dappE2eRpc_com_example_other');
    expect(() => api.wallets!['io.unknown']).toThrow(/unknown wallet rdns/);
  });

  it('T-FIX-209 waitForRpcIdle は pending 解消後に page 側 frame 待ちを 1 度だけ流す', async () => {
    const page = makeFakePage(evaluated);
    const api = await useDappE2e(page, [makeWallet('io.metamask', PK_A)], [makeRpcContext(PK_A)]);

    await api.waitForRpcIdle(1_000);

    // 引数なしの page script = requestAnimationFrame chain。 fake page が実行するので
    // stub した requestAnimationFrame が 2 段呼ばれて resolve する
    expect(evaluated.filter((e) => e.arg === undefined)).toHaveLength(1);
  });

  it('T-FIX-210 page fixture は wallet ごとの bridge を expose し、emitter event を page へ転送する', async () => {
    const page = makeFakePage(evaluated);
    const ctx = makeRpcContext(PK_A);
    const tracker = makeTracker();

    await hoisted.fixtureDefs.page!(
      {
        page,
        _walletConfigs: [makeWallet('io.metamask', PK_A)],
        _rpcContexts: [ctx],
        _rpcTracker: tracker,
      },
      async () => {
        // fixture body が emitter に張った転送 handler を通す
        ctx.emitter?.emit('chainChanged', '0x1');
        await Promise.resolve();
      },
    );

    const exposed = page.exposeFunction.mock.calls.map((call) => call[0]);
    expect(exposed).toEqual(['__dappE2eRpc_io_metamask', '__dappE2eRpc']);
    expect(page.addInitScript).toHaveBeenCalledTimes(1);
    expect(page.goto).toHaveBeenCalledWith('about:blank');
    expect(emitted).toContainEqual({
      target: '__dappE2eRpc_io_metamask',
      evt: 'chainChanged',
      payload: ['0x1'],
    });
  });
});

/**
 * dappE2e fixture を起動して use に渡された api を取り出す。
 * fixture 本体は use の解決を待って戻るため、 api は use の中で取り出す。
 */
async function useDappE2e(
  page: ReturnType<typeof makeFakePage>,
  walletConfigs: ReturnType<typeof makeWallet>[],
  rpcContexts: RpcContext[],
): Promise<{
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  triggerEvent(event: string, ...args: unknown[]): Promise<void>;
  switchChain(chainIdHex: Hex): Promise<void>;
  setApprovalModeForToken(
    token: Hex,
    policy: { mode: string; limit?: bigint },
  ): Promise<void>;
  setActiveAccount(index: number): Promise<void>;
  waitForRpcIdle(timeoutMs?: number): Promise<void>;
  wallets?: Record<string, { connect(): Promise<void> }>;
}> {
  let api: unknown;
  await hoisted.fixtureDefs.dappE2e!(
    {
      page,
      anvilPort: 8545,
      _walletConfigs: walletConfigs,
      _rpcContexts: rpcContexts,
      _rpcTracker: makeTracker(),
    },
    async (value) => {
      api = value;
    },
  );
  return api as Awaited<ReturnType<typeof useDappE2e>>;
}
