import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// CAR-1528 段階 5 = fixture.ts の追加 export (verifySignature / createRpcHandler) を
// 直接 unit test で cover する。 段階 1-4 で fixture.ts helper + anvil.ts SIGTERM 系を
// cover 済。 本 stage は fixture.ts の non-callback export の残に focus、
// fixture body callback + 非 export internal function は段階 6+ の Playwright harness
// or src export 化検討 (Scope Boundary Check pre-verify 経路) に譲る。

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem');
  return {
    ...actual,
    verifyMessage: vi.fn(),
  };
});

vi.mock('../src/rpc-handlers.js', async () => {
  const actual = await vi.importActual<typeof import('../src/rpc-handlers.js')>(
    '../src/rpc-handlers.js',
  );
  return {
    ...actual,
    handleRpcRequest: vi.fn(),
  };
});

async function loadFixture() {
  return await import('../src/fixture.js');
}

async function loadViem() {
  return await import('viem');
}

async function loadRpcHandlers() {
  return await import('../src/rpc-handlers.js');
}

describe('verifySignature (fixture export)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('T-VSG-001 valid signature で true を返す', async () => {
    const { verifySignature } = await loadFixture();
    const viem = await loadViem();
    vi.mocked(viem.verifyMessage).mockResolvedValueOnce(true);

    const result = await verifySignature(
      '0x0000000000000000000000000000000000000001' as `0x${string}`,
      '0xabcd' as `0x${string}`,
      'hello',
    );
    expect(result).toBe(true);
    expect(vi.mocked(viem.verifyMessage)).toHaveBeenCalledWith({
      address: '0x0000000000000000000000000000000000000001',
      signature: '0xabcd',
      message: 'hello',
    });
  });

  it('T-VSG-002 invalid signature で false を返す', async () => {
    const { verifySignature } = await loadFixture();
    const viem = await loadViem();
    vi.mocked(viem.verifyMessage).mockResolvedValueOnce(false);

    const result = await verifySignature(
      '0x0000000000000000000000000000000000000002' as `0x${string}`,
      '0xdead' as `0x${string}`,
      'wrong',
    );
    expect(result).toBe(false);
  });

  it('T-VSG-003 raw message ({ raw: Hex }) 経路も verifyMessage に forward', async () => {
    const { verifySignature } = await loadFixture();
    const viem = await loadViem();
    vi.mocked(viem.verifyMessage).mockResolvedValueOnce(true);

    await verifySignature(
      '0x0000000000000000000000000000000000000003' as `0x${string}`,
      '0xbeef' as `0x${string}`,
      { raw: '0x1234' as `0x${string}` },
    );
    const call = vi.mocked(viem.verifyMessage).mock.calls[0]![0];
    expect(call.message).toEqual({ raw: '0x1234' });
  });
});

describe('createRpcHandler (fixture export)', () => {
  const nowSpy = vi.spyOn(Date, 'now');

  beforeEach(() => {
    vi.clearAllMocks();
    nowSpy.mockReturnValue(1_700_000_000_000);
    delete process.env.KIWA_RPC_DEBUG;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.KIWA_RPC_DEBUG;
  });

  function makeTracker() {
    let id = 0;
    return {
      nextId: () => ++id,
      pendingRpcs: new Map<number, unknown>(),
    };
  }

  it('T-RPC-001 正常経路: handleRpcRequest 成功 → ok:true + result 返却', async () => {
    const { createRpcHandler } = await loadFixture();
    const rpc = await loadRpcHandlers();
    vi.mocked(rpc.handleRpcRequest).mockResolvedValue('0x42');

    const tracker = makeTracker();
    const handler = createRpcHandler({} as unknown as Parameters<typeof createRpcHandler>[0], tracker as unknown as Parameters<typeof createRpcHandler>[1]);
    const result = await handler({ method: 'eth_chainId', params: [] });

    expect(result).toEqual({ ok: true, result: '0x42' });
    // pending tracker は promise finally で delete、 handler 完了時点で削除済
    expect(tracker.pendingRpcs.size).toBe(0);
  });

  it('T-RPC-002 handleRpcRequest throw → ok:false + err.code + err.message mapping', async () => {
    const { createRpcHandler } = await loadFixture();
    const rpc = await loadRpcHandlers();
    const err = new Error('rpc failed') as Error & { code?: number };
    err.code = -32000;
    vi.mocked(rpc.handleRpcRequest).mockRejectedValue(err);

    const tracker = makeTracker();
    const handler = createRpcHandler({} as unknown as Parameters<typeof createRpcHandler>[0], tracker as unknown as Parameters<typeof createRpcHandler>[1]);
    const result = await handler({ method: 'eth_call', params: [] });

    expect(result).toEqual({
      ok: false,
      error: { code: -32000, message: 'rpc failed' },
    });
  });

  it('T-RPC-003 handleRpcRequest throw + err.code なし → default code -32603', async () => {
    const { createRpcHandler } = await loadFixture();
    const rpc = await loadRpcHandlers();
    vi.mocked(rpc.handleRpcRequest).mockRejectedValue(new Error('unknown'));

    const tracker = makeTracker();
    const handler = createRpcHandler({} as unknown as Parameters<typeof createRpcHandler>[0], tracker as unknown as Parameters<typeof createRpcHandler>[1]);
    const result = await handler({ method: 'anything' });

    expect(result).toEqual({
      ok: false,
      error: { code: -32603, message: 'unknown' },
    });
  });

  it('T-RPC-004 DEBUG=kiwa:rpc で完了時 console.log emit', async () => {
    process.env.DEBUG = 'kiwa:rpc';
    const { createRpcHandler } = await loadFixture();
    const rpc = await loadRpcHandlers();
    vi.mocked(rpc.handleRpcRequest).mockResolvedValue('0x0');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const tracker = makeTracker();
    const handler = createRpcHandler({} as unknown as Parameters<typeof createRpcHandler>[0], tracker as unknown as Parameters<typeof createRpcHandler>[1]);
    await handler({ method: 'eth_chainId', params: [] });
    // finally 内 log emit は microtask で遅延、 flush
    await new Promise((r) => queueMicrotask(() => r(undefined)));
    await new Promise((r) => setTimeout(r, 0));

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
    delete process.env.DEBUG;
  });
});
