import { describe, expect, it, vi } from 'vitest';

// startAnvilCluster の failure path (1 chain fail → 全 stop → throw) をカバー。
// startAnvil を mock して 1 個目 success / 2 個目 reject にする。
vi.mock('../src/anvil.js', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('../src/anvil.js');
  return {
    ...actual,
    startAnvil: vi.fn(),
  };
});

async function loadClusterModule() {
  return await import('../src/anvil-cluster.js');
}
async function loadAnvilModule() {
  return await import('../src/anvil.js');
}

describe('startAnvilCluster failure path', () => {
  it('T-CLU-001 1 chain が reject したら成功した chain を stop して throw する', async () => {
    const anvil = await loadAnvilModule();
    const startAnvil = anvil.startAnvil as unknown as ReturnType<typeof vi.fn>;
    startAnvil.mockReset();
    const stopMock = vi.fn().mockResolvedValue(undefined);
    startAnvil
      .mockResolvedValueOnce({ port: 8600, pid: 1, stop: stopMock })
      .mockRejectedValueOnce(new Error('anvil failed to listen'));

    const cluster = await loadClusterModule();
    await expect(
      cluster.startAnvilCluster({
        chains: [
          { chainId: 31337, port: 8600 },
          { chainId: 31338, port: 8601 },
        ],
      }),
    ).rejects.toThrow(/anvil failed to listen/);

    // 成功した chain の stop() が呼ばれる
    expect(stopMock).toHaveBeenCalledTimes(1);
  });

  it('T-CLU-002 全 chain が success なら chains + stopAll を返す', async () => {
    const anvil = await loadAnvilModule();
    const startAnvil = anvil.startAnvil as unknown as ReturnType<typeof vi.fn>;
    startAnvil.mockReset();
    const stop1 = vi.fn().mockResolvedValue(undefined);
    const stop2 = vi.fn().mockResolvedValue(undefined);
    startAnvil
      .mockResolvedValueOnce({ port: 8700, pid: 1, stop: stop1 })
      .mockResolvedValueOnce({ port: 8701, pid: 2, stop: stop2 });

    const cluster = await loadClusterModule();
    const handle = await cluster.startAnvilCluster({
      chains: [
        { chainId: 1, port: 8700 },
        { chainId: 2, port: 8701 },
      ],
    });
    expect(handle.chains).toHaveLength(2);
    expect(handle.chains[0]!.chainId).toBe(1);
    expect(handle.chains[1]!.chainId).toBe(2);

    await handle.stopAll();
    expect(stop1).toHaveBeenCalledTimes(1);
    expect(stop2).toHaveBeenCalledTimes(1);
  });
});
