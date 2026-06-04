import net from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getFreePort,
  startAnvil,
  startAnvilCluster,
  type AnvilClusterHandle,
  type AnvilHandle,
} from '../src/index.js';

function checkPortListening(port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, timeoutMs);
    socket.once('connect', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

async function getChainId(port: number): Promise<number> {
  const res = await fetch(`http://127.0.0.1:${port}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_chainId',
      params: [],
    }),
  });
  const json = (await res.json()) as { result: string };
  return Number.parseInt(json.result, 16);
}

describe('getFreePort', () => {
  it('T-ANV-001 1024-65535 範囲内の port number を返す', async () => {
    // Given (no setup)
    // When
    const port = await getFreePort();
    // Then
    expect(port).toBeGreaterThanOrEqual(1024);
    expect(port).toBeLessThanOrEqual(65535);
  });

  it('T-ANV-002 並列で 2 回呼ぶと異なる port を返す (port 自動採番の不変条件)', async () => {
    // Given (race condition simulation)
    // When
    const [p1, p2] = await Promise.all([getFreePort(), getFreePort()]);
    // Then
    expect(p1).not.toBe(p2);
  });
});

// ローカル skip は `SKIP_ANVIL_TESTS=1 pnpm test` で。CI ではデフォルト実行。
describe.skipIf(process.env.SKIP_ANVIL_TESTS === '1')('startAnvil', () => {
  let handle: AnvilHandle | null = null;

  afterEach(async () => {
    if (handle) {
      await handle.stop().catch(() => undefined);
      handle = null;
    }
  });

  it('T-ANV-003 起動後に当該 port が TCP listen 状態である', async () => {
    // Given
    handle = await startAnvil();
    // When
    const listening = await checkPortListening(handle.port, 3000);
    // Then
    expect(listening).toBe(true);
  });

  it('T-ANV-004 stop() 後に port が解放される', async () => {
    // Given
    handle = await startAnvil();
    const port = handle.port;
    // When
    await handle.stop();
    handle = null;
    const stillListening = await checkPortListening(port, 1000);
    // Then
    expect(stillListening).toBe(false);
  });

});

describe.skipIf(process.env.SKIP_ANVIL_TESTS === '1')('startAnvilCluster', () => {
  let cluster: AnvilClusterHandle | null = null;

  afterEach(async () => {
    if (cluster) {
      await cluster.stopAll().catch(() => undefined);
      cluster = null;
    }
  });

  it('T-ANV-005 2 chain を起動し各 anvil が期待 chainId を返す', async () => {
    // Given
    const [port1, port2] = await Promise.all([getFreePort(), getFreePort()]);
    // When
    cluster = await startAnvilCluster({
      chains: [
        { chainId: 31337, port: port1 },
        { chainId: 31338, port: port2 },
      ],
    });
    const chainIds = await Promise.all(cluster.chains.map((chain) => getChainId(chain.port)));
    // Then
    expect(chainIds).toEqual([31337, 31338]);
  });

  it('T-ANV-006 stopAll() 後に cluster の全 port が解放される', async () => {
    // Given
    const [port1, port2] = await Promise.all([getFreePort(), getFreePort()]);
    cluster = await startAnvilCluster({
      chains: [
        { chainId: 31337, port: port1 },
        { chainId: 31338, port: port2 },
      ],
    });
    const ports = cluster.chains.map((chain) => chain.port);
    // When
    await cluster.stopAll();
    cluster = null;
    const listening = await Promise.all(ports.map((port) => checkPortListening(port, 1000)));
    // Then
    expect(listening).toEqual([false, false]);
  });

  it('T-ANV-007 handle に chainId metadata を保持する', async () => {
    // Given
    const [port1, port2] = await Promise.all([getFreePort(), getFreePort()]);
    // When
    cluster = await startAnvilCluster({
      chains: [
        { chainId: 11155111, port: port1 },
        { chainId: 8453, port: port2 },
      ],
    });
    // Then
    expect(cluster.chains.map(({ chainId, port }) => ({ chainId, port }))).toEqual([
      { chainId: 11155111, port: port1 },
      { chainId: 8453, port: port2 },
    ]);
  });
});
