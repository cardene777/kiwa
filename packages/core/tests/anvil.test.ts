import net from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { getFreePort, startAnvil, type AnvilHandle } from '../src/index.js';

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
