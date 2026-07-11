import { describe, expect, it, vi } from 'vitest';

// anvil-fork.ts は startAnvilProcess を委譲するだけの薄い wrapper。
// 実 anvil を fork RPC 付きで起動すると外部依存が必要になるため、
// startAnvilProcess を mock して「引数構築 + option 透過 + 委譲返却」 をカバーする。
vi.mock('../src/anvil.js', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('../src/anvil.js');
  return {
    ...actual,
    startAnvilProcess: vi.fn(),
  };
});

// dynamic import で mock 反映後の module を取得
async function loadForkModule() {
  return await import('../src/anvil-fork.js');
}
async function loadAnvilModule() {
  return await import('../src/anvil.js');
}

describe('startAnvilFork (mocked startAnvilProcess)', () => {
  it('T-FRK-001 forkUrl のみ指定で --fork-url extraArg + requirePristineChain:false が渡る', async () => {
    const fork = await loadForkModule();
    const anvil = await loadAnvilModule();
    const spawn = anvil.startAnvilProcess as unknown as ReturnType<typeof vi.fn>;
    spawn.mockClear();
    const fakeHandle = { port: 9999, pid: 12345, stop: async () => undefined };
    spawn.mockResolvedValue(fakeHandle);

    const handle = await fork.startAnvilFork({
      forkUrl: 'https://eth-mainnet.example.com/rpc',
    });

    expect(handle).toBe(fakeHandle);
    expect(spawn).toHaveBeenCalledTimes(1);
    const args = spawn.mock.calls[0]![0]!;
    expect(args.extraArgs).toEqual(['--fork-url', 'https://eth-mainnet.example.com/rpc']);
    expect(args.requirePristineChain).toBe(false);
    // port option 未指定は spread されない
    expect('port' in args).toBe(false);
  });

  it('T-FRK-002 forkBlockNumber 指定時に --fork-block-number extraArg が追加される', async () => {
    const fork = await loadForkModule();
    const anvil = await loadAnvilModule();
    const spawn = anvil.startAnvilProcess as unknown as ReturnType<typeof vi.fn>;
    spawn.mockClear();
    spawn.mockResolvedValue({ port: 8546, pid: 1, stop: async () => undefined });

    await fork.startAnvilFork({
      forkUrl: 'https://arb1.example.com',
      forkBlockNumber: 12_345_678n,
    });

    const args = spawn.mock.calls[0]![0]!;
    expect(args.extraArgs).toEqual([
      '--fork-url',
      'https://arb1.example.com',
      '--fork-block-number',
      '12345678',
    ]);
  });

  it('T-FRK-003 port option 指定時は spread されて startAnvilProcess に渡る', async () => {
    const fork = await loadForkModule();
    const anvil = await loadAnvilModule();
    const spawn = anvil.startAnvilProcess as unknown as ReturnType<typeof vi.fn>;
    spawn.mockClear();
    spawn.mockResolvedValue({ port: 8600, pid: 2, stop: async () => undefined });

    await fork.startAnvilFork({
      forkUrl: 'http://127.0.0.1:9999',
      port: 8600,
    });

    const args = spawn.mock.calls[0]![0]!;
    expect(args.port).toBe(8600);
    expect(args.requirePristineChain).toBe(false);
  });
});
