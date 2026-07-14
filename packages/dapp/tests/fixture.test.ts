import { describe, expect, it, vi } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { createRpcHandler, dappE2eTest, verifySignature, waitForPendingRpcs } from '../src/index.js';
import { resolveWalletConfigs, validateWalletConfigs } from '../src/fixture.js';
import type { RpcContext } from '../src/rpc-handlers.js';
import type { Hex, WalletConfig } from '../src/types.js';

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

  it('T-FIX-004 DEBUG=kiwa:rpc で createRpcHandler が console.log を出す', async () => {
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
    process.env.DEBUG = 'kiwa:rpc';

    try {
      await rpcHandler({ method: 'eth_chainId' });
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[kiwa:rpc\] eth_chainId .*duration=/),
      );
    } finally {
      process.env.DEBUG = prevDebug;
      logSpy.mockRestore();
    }
  });

  it('T-FIX-004b createRpcHandler は handleRpcRequest の throw を error envelope に変換する', async () => {
    const ctx: RpcContext = {
      privateKey: PRIVATE_KEY,
      chainState: { current: 31337 },
    };
    const tracker = {
      pendingRpcs: new Map(),
      nextId: () => 1,
    };
    const rpcHandler = createRpcHandler(ctx, tracker);

    // eth_sign は BLOCKED_METHODS 内、 code 4200 で throw
    const result = await rpcHandler({ method: 'eth_sign', params: ['0x0', '0x'] });
    expect(result).toEqual({
      ok: false,
      error: {
        code: 4200,
        message: 'method not supported: eth_sign',
      },
    });
  });

  it('T-FIX-004c createRpcHandler は success path で ok:true envelope を返し tracker.pendingRpcs を空にする', async () => {
    const ctx: RpcContext = {
      privateKey: PRIVATE_KEY,
      chainState: { current: 31337 },
    };
    const tracker = {
      pendingRpcs: new Map(),
      nextId: (() => {
        let n = 0;
        return () => (n += 1);
      })(),
    };
    const rpcHandler = createRpcHandler(ctx, tracker);

    const result = await rpcHandler({ method: 'eth_chainId' });
    expect(result).toEqual({ ok: true, result: '0x7a69' });
    // finally 経路で 削除
    expect(tracker.pendingRpcs.size).toBe(0);
  });

  it('T-FIX-004d createRpcHandler は非 Error throw (string) でも fallback code -32603 で envelope を返す', async () => {
    const ctx: RpcContext = {
      privateKey: PRIVATE_KEY,
      chainState: { current: 31337 },
    };
    const tracker = {
      pendingRpcs: new Map(),
      nextId: () => 1,
    };
    const rpcHandler = createRpcHandler(ctx, tracker);

    // params 不足で throw させる (eth_sendTransaction は anvilPort 必要 → 内部で throw)
    const result = (await rpcHandler({
      method: 'eth_sendTransaction',
      params: [{ to: '0x0000000000000000000000000000000000000000', from: '0x0' }],
    })) as { ok: false; error: { code: number; message: string } };
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe(-32603);
  });

  it('T-FIX-006 pendingRpcs が最初から空なら waitForPendingRpcs は即解決する', async () => {
    const empty = new Map();
    const page = {
      evaluate: vi.fn().mockResolvedValue(undefined),
    } as unknown as Parameters<typeof waitForPendingRpcs>[0];
    await expect(waitForPendingRpcs(page, empty, 100)).resolves.toBeUndefined();
    // 内部で runPageScript(page, requestAnimationFrame chain) が evaluate 経由呼ばれる
    expect((page as unknown as { evaluate: ReturnType<typeof vi.fn> }).evaluate).toHaveBeenCalled();
  });

  it('T-FIX-007 pendingRpcs が途中で全 resolve すれば waitForPendingRpcs は解決する', async () => {
    const map = new Map<number, {
      request: { method: string; params?: unknown[] };
      startedAt: number;
      promise: Promise<unknown>;
    }>();
    let resolveInner: (() => void) | null = null;
    const promise = new Promise<void>((resolve) => {
      resolveInner = resolve;
    });
    map.set(1, {
      request: { method: 'eth_getBalance', params: ['0xabc'] },
      startedAt: Date.now(),
      promise,
    });
    const page = {
      evaluate: vi.fn().mockResolvedValue(undefined),
    } as unknown as Parameters<typeof waitForPendingRpcs>[0];

    const wait = waitForPendingRpcs(page, map, 5_000);
    setTimeout(() => {
      map.delete(1);
      resolveInner?.();
    }, 30);

    await expect(wait).resolves.toBeUndefined();
  });
});

describe('resolveWalletConfigs (normalizeWalletConfigs branches)', () => {
  const PK: Hex =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  it('T-RWC-001 wallets 未指定 (undefined) は default MetaMask 1 件を返す', () => {
    const result = resolveWalletConfigs(PK, 31337, undefined);
    expect(result).toHaveLength(1);
    expect(result[0]!.rdns).toBe('io.metamask');
    expect(result[0]!.chainId).toBe(31337);
  });

  it('T-RWC-002 wallets = [] (空 array) も default MetaMask 1 件を返す', () => {
    const result = resolveWalletConfigs(PK, 31337, []);
    expect(result).toHaveLength(1);
    expect(result[0]!.rdns).toBe('io.metamask');
  });

  it('T-RWC-003 wallets が単一 object (Array でない) でも 1 件配列に normalize される', () => {
    const config = {
      name: 'Rabby',
      rdns: 'io.rabby',
      icon: 'data:,',
      privateKey: PK,
    } satisfies WalletConfig;
    const result = resolveWalletConfigs(PK, 31337, config as unknown as WalletConfig[]);
    expect(result).toHaveLength(1);
    expect(result[0]!.rdns).toBe('io.rabby');
  });

  it('T-RWC-004 wallets が [Array, ...] (nested) の場合、 内側 array に normalize される', () => {
    const inner: WalletConfig[] = [
      { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: PK },
    ];
    const result = resolveWalletConfigs(PK, 31337, [inner] as unknown as WalletConfig[]);
    expect(result).toHaveLength(1);
    expect(result[0]!.rdns).toBe('io.metamask');
  });

  it('T-RWC-005 wallet.chainId 未指定なら top-level chainId が使われる', () => {
    const wallets: WalletConfig[] = [
      { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: PK },
    ];
    const result = resolveWalletConfigs(PK, 8453, wallets);
    expect(result[0]!.chainId).toBe(8453);
  });

  it('T-RWC-006 wallet.chainId 指定時は per-wallet の値が優先される', () => {
    const wallets: WalletConfig[] = [
      { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: PK, chainId: 137 },
    ];
    const result = resolveWalletConfigs(PK, 8453, wallets);
    expect(result[0]!.chainId).toBe(137);
  });

  it('T-RWC-007 sanitize 後の rdns 衝突は throw する', () => {
    // "io.metamask" と "io-metamask" は sanitize 後 "io_metamask" で衝突
    const wallets: WalletConfig[] = [
      { name: 'MM 1', rdns: 'io.metamask', icon: 'data:,', privateKey: PK },
      { name: 'MM 2', rdns: 'io-metamask', icon: 'data:,', privateKey: PK },
    ];
    expect(() => resolveWalletConfigs(PK, 31337, wallets)).toThrow(/rdns collision/);
  });

  it('T-RWC-008 validateWalletConfigs は null 要素を非 object として throw する', () => {
    expect(() =>
      validateWalletConfigs([null as unknown as WalletConfig]),
    ).toThrow(/must be an object/);
  });

  it('T-RWC-008b validateWalletConfigs は array 要素を非 object として throw する', () => {
    expect(() =>
      validateWalletConfigs([[] as unknown as WalletConfig]),
    ).toThrow(/must be an object/);
  });

  it('T-RWC-009 wallet.name が空文字列は throw する', () => {
    const wallets: WalletConfig[] = [
      { name: '', rdns: 'io.metamask', icon: 'data:,', privateKey: PK },
    ];
    expect(() => resolveWalletConfigs(PK, 31337, wallets)).toThrow(/name.*non-empty/);
  });

  it('T-RWC-010 wallet.rdns が RDNS pattern 外は throw する', () => {
    const wallets: WalletConfig[] = [
      { name: 'X', rdns: 'invalid rdns spaces', icon: 'data:,', privateKey: PK },
    ];
    expect(() => resolveWalletConfigs(PK, 31337, wallets)).toThrow(/rdns.*reverse-DNS/);
  });

  it('T-RWC-011 wallet.icon が data: 以外は throw する', () => {
    const wallets: WalletConfig[] = [
      { name: 'X', rdns: 'io.x', icon: 'https://example.com/icon.svg', privateKey: PK },
    ];
    expect(() => resolveWalletConfigs(PK, 31337, wallets)).toThrow(/icon.*data URI/);
  });

  it('T-RWC-012 wallet.isContractAccount が boolean 以外は throw する', () => {
    const wallets: WalletConfig[] = [
      {
        name: 'X',
        rdns: 'io.x',
        icon: 'data:,',
        privateKey: PK,
        isContractAccount: 'yes' as unknown as boolean,
      },
    ];
    expect(() => resolveWalletConfigs(PK, 31337, wallets)).toThrow(/isContractAccount.*boolean/);
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
        /\[kiwa:rpc\] eth_call /.test(error.message) &&
        /pending for 12\.\ds/.test(error.message) &&
        /"to":"0xabc"/.test(error.message),
    );
  });
});

// -------------------------------------------------------------------
// CAR-1528 段階 1: fixture.ts 未 cover 分岐に対する real behavior 追加 test。
// 対象 = createRpcHandler DEBUG log 経路の helper 群 (formatRpcParams /
// formatRpcValue / inspectForRpc / formatCompletedRpcEntry) と、
// waitForPendingRpcs timeout 経路の formatPendingRpcEntry / formatDurationMs、
// および validateWalletConfigs の未 cover 検証 branch (chainId 範囲 /
// contractAccountAddress format / contractAccountExecuteAbi form /
// isContractAccount+address 相関) を対象とする。
// -------------------------------------------------------------------

describe('createRpcHandler DEBUG log helper coverage', () => {
  it('T-FIX-008 params 未指定 (undefined) は formatRpcParams が "[]" として整形する', async () => {
    const ctx: RpcContext = {
      privateKey: PRIVATE_KEY,
      chainState: { current: 31337 },
    };
    const tracker = {
      pendingRpcs: new Map(),
      nextId: () => 1,
    };
    const rpcHandler = createRpcHandler(ctx, tracker);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const prevDebug = process.env.DEBUG;
    process.env.DEBUG = 'kiwa:rpc';

    try {
      // eth_chainId は params 不要 → formatRpcParams(undefined) が "[]" 分岐に入る
      await rpcHandler({ method: 'eth_chainId' });
      // finally の debug log は microtask 経由で fire、 await 完了後に flush する
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[kiwa:rpc\] eth_chainId \[\] start_time=/),
      );
    } finally {
      process.env.DEBUG = prevDebug;
      logSpy.mockRestore();
    }
  });

  it('T-FIX-009 params.length >= 2 は formatRpcParams が array 全体を JSON 化して整形する', async () => {
    const ctx: RpcContext = {
      privateKey: PRIVATE_KEY,
      chainState: { current: 31337 },
    };
    const tracker = {
      pendingRpcs: new Map(),
      nextId: () => 1,
    };
    const rpcHandler = createRpcHandler(ctx, tracker);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const prevDebug = process.env.DEBUG;
    process.env.DEBUG = 'kiwa:rpc';

    try {
      // eth_sign は BLOCKED_METHODS で throw、 debug log は finally 経由で出る。
      // params 2 個 → formatRpcParams が formatRpcValue(array) 分岐に入る。
      await rpcHandler({
        method: 'eth_sign',
        params: ['0xdeadbeef', '0xabc'],
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[kiwa:rpc\] eth_sign \["0xdeadbeef","0xabc"\]/),
      );
    } finally {
      process.env.DEBUG = prevDebug;
      logSpy.mockRestore();
    }
  });

  it('T-FIX-010 bigint param は inspectForRpc が "n" 接尾辞付き文字列に変換する', async () => {
    const ctx: RpcContext = {
      privateKey: PRIVATE_KEY,
      chainState: { current: 31337 },
    };
    const tracker = {
      pendingRpcs: new Map(),
      nextId: () => 1,
    };
    const rpcHandler = createRpcHandler(ctx, tracker);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const prevDebug = process.env.DEBUG;
    process.env.DEBUG = 'kiwa:rpc';

    try {
      // BLOCKED_METHODS で即 throw、 finally で debug log を出す。
      // inspectForRpc の replacer が bigint → "12345n" (string) に変換する。
      await rpcHandler({ method: 'eth_sign', params: [12345n] });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('"12345n"'),
      );
    } finally {
      process.env.DEBUG = prevDebug;
      logSpy.mockRestore();
    }
  });
});

describe('waitForPendingRpcs timeout formatting coverage', () => {
  it('T-FIX-011 複数 pending RPC は formatPendingRpcEntry を " | " で結合する', async () => {
    const now = Date.now();
    const pendingRpcs = new Map([
      [
        1,
        {
          request: { method: 'eth_call', params: [{ to: '0xabc', data: '0x1234' }] },
          startedAt: now - 500,
          promise: new Promise<never>(() => {}),
        },
      ],
      [
        2,
        {
          request: { method: 'eth_getBalance', params: ['0xdef', 'latest'] },
          startedAt: now - 200,
          promise: new Promise<never>(() => {}),
        },
      ],
    ]);

    await expect(waitForPendingRpcs({} as never, pendingRpcs, 10)).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof Error &&
        /2 pending RPCs:/.test(error.message) &&
        /eth_call.*\|.*eth_getBalance/.test(error.message),
    );
  });

  it('T-FIX-012 sub-second 経過は formatDurationMs が "Xms" 形式で出力する', async () => {
    const pendingRpcs = new Map([
      [
        1,
        {
          request: { method: 'eth_call' },
          // 250ms 経過 (< 1000ms) → formatDurationMs が ms 分岐に入る
          startedAt: Date.now() - 250,
          promise: new Promise<never>(() => {}),
        },
      ],
    ]);

    await expect(waitForPendingRpcs({} as never, pendingRpcs, 10)).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof Error &&
        /pending for \d+ms/.test(error.message) &&
        // 秒表示 (x.xs) は出ない = ms 分岐が選ばれた証拠
        !/pending for \d+\.\ds/.test(error.message),
    );
  });
});

describe('validateWalletConfigs uncovered branches', () => {
  const PK: Hex =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  it('T-RWC-013 wallet.chainId が 0 は positive integer 制約違反で throw する', () => {
    const wallets: WalletConfig[] = [
      { name: 'X', rdns: 'io.x', icon: 'data:,', privateKey: PK, chainId: 0 },
    ];
    expect(() => resolveWalletConfigs(PK, 31337, wallets)).toThrow(/chainId.*positive integer/);
  });

  it('T-RWC-014 wallet.chainId が 非整数 (1.5) は throw する', () => {
    const wallets: WalletConfig[] = [
      { name: 'X', rdns: 'io.x', icon: 'data:,', privateKey: PK, chainId: 1.5 },
    ];
    expect(() => resolveWalletConfigs(PK, 31337, wallets)).toThrow(/chainId.*positive integer/);
  });

  it('T-RWC-015 wallet.contractAccountAddress が 40-char hex address でなければ throw する', () => {
    const wallets: WalletConfig[] = [
      {
        name: 'X',
        rdns: 'io.x',
        icon: 'data:,',
        privateKey: PK,
        isContractAccount: true,
        contractAccountAddress: '0xdeadbeef' as `0x${string}`,
      },
    ];
    expect(() => resolveWalletConfigs(PK, 31337, wallets)).toThrow(
      /contractAccountAddress.*40-char address/,
    );
  });

  it('T-RWC-016 wallet.contractAccountExecuteAbi が array でなければ throw する', () => {
    const wallets: WalletConfig[] = [
      {
        name: 'X',
        rdns: 'io.x',
        icon: 'data:,',
        privateKey: PK,
        contractAccountExecuteAbi: 'function foo()' as unknown as string[],
      },
    ];
    expect(() => resolveWalletConfigs(PK, 31337, wallets)).toThrow(
      /contractAccountExecuteAbi.*non-empty string\[\]/,
    );
  });

  it('T-RWC-017 isContractAccount=true で contractAccountAddress 未指定は throw する', () => {
    const wallets: WalletConfig[] = [
      {
        name: 'X',
        rdns: 'io.x',
        icon: 'data:,',
        privateKey: PK,
        isContractAccount: true,
      },
    ];
    expect(() => resolveWalletConfigs(PK, 31337, wallets)).toThrow(
      /contractAccountAddress.*required when isContractAccount=true/,
    );
  });
});

describe('waitForPendingRpcs final page.evaluate branches', () => {
  it('T-FIX-013 waitForPendingRpcs の final page.evaluate reject はそのまま propagate する', async () => {
    const page = {
      evaluate: vi.fn().mockRejectedValue(new Error('evaluate boom')),
    } as unknown as Parameters<typeof waitForPendingRpcs>[0];

    await expect(waitForPendingRpcs(page, new Map(), 100)).rejects.toThrow(/evaluate boom/);
  });

  it('T-FIX-014 page.evaluate が unavailable なら waitForPendingRpcs は専用 error で reject する', async () => {
    const page = {
      evaluate: undefined,
    } as unknown as Parameters<typeof waitForPendingRpcs>[0];

    await expect(waitForPendingRpcs(page, new Map(), 100)).rejects.toThrow(
      /page script runner is unavailable/,
    );
  });
});

describe('validateWalletConfigs additional uncovered branches', () => {
  const PK: Hex =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  it('T-RWC-018 validateWalletConfigs は rdns: \'\' を reverse-DNS 制約違反で throw する', () => {
    expect(() =>
      validateWalletConfigs([
        { name: 'X', rdns: '', icon: 'data:,', privateKey: PK },
      ]),
    ).toThrow(/rdns.*reverse-DNS/);
  });

  it('T-RWC-019 validateWalletConfigs は contractAccountExecuteAbi: [] を reject する', () => {
    expect(() =>
      validateWalletConfigs([
        {
          name: 'X',
          rdns: 'io.x',
          icon: 'data:,',
          privateKey: PK,
          contractAccountExecuteAbi: [],
        },
      ]),
    ).toThrow(/contractAccountExecuteAbi.*non-empty string\[\]/);
  });

  it('T-RWC-020 validateWalletConfigs は non-string ABI entry を reject する', () => {
    expect(() =>
      validateWalletConfigs([
        {
          name: 'X',
          rdns: 'io.x',
          icon: 'data:,',
          privateKey: PK,
          contractAccountExecuteAbi: ['function foo()', 123 as unknown as string],
        },
      ]),
    ).toThrow(/contractAccountExecuteAbi.*non-empty string\[\]/);
  });

  it('T-RWC-021 validateWalletConfigs は icon: 123 を data URI 制約違反で throw する', () => {
    expect(() =>
      validateWalletConfigs([
        {
          name: 'X',
          rdns: 'io.x',
          icon: 123 as unknown as string,
          privateKey: PK,
        },
      ]),
    ).toThrow(/icon.*data URI/);
  });

  it('T-RWC-022 validateWalletConfigs は privateKey: 123 を 32 bytes 制約違反で throw する', () => {
    expect(() =>
      validateWalletConfigs([
        {
          name: 'X',
          rdns: 'io.x',
          icon: 'data:,',
          privateKey: 123 as unknown as `0x${string}`,
        },
      ]),
    ).toThrow(/privateKey.*32 bytes/);
  });
});
