import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// getFreePort は OS に port を割り当てさせる helper で、 失敗側 3 経路
// (address() が port を返さない / close が失敗する / 空き port を引けず試行を使い切る)
// は実 OS では起こせない。 外部依存である node:net だけを差し替えて再現する。
// 実 socket は 1 つも開かない。
vi.mock('node:net', () => ({
  createServer: vi.fn(),
}));

type ServerBehavior = {
  /** listen callback 内で address() が返す値 */
  address: unknown;
  /** close callback に渡す error (無ければ成功) */
  closeError?: Error;
};

async function loadAnvil() {
  return await import('../src/anvil.js');
}
async function loadNet() {
  return await import('node:net');
}

/** net.Server の構造だけを真似た fake。 listen は同期的に callback を呼ぶ。 */
function makeFakeServer(behavior: ServerBehavior) {
  return {
    unref: () => undefined,
    on: () => undefined,
    listen: (_port: number, _host: string, cb: () => void) => {
      cb();
    },
    address: () => behavior.address,
    close: (cb?: (error?: Error) => void) => {
      cb?.(behavior.closeError);
    },
  };
}

async function setServerBehavior(behavior: ServerBehavior) {
  const net = await loadNet();
  (net.createServer as unknown as ReturnType<typeof vi.fn>).mockImplementation(() =>
    makeFakeServer(behavior),
  );
}

describe('getFreePort の失敗経路 (mocked node:net)', () => {
  beforeEach(async () => {
    const net = await loadNet();
    (net.createServer as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('T-ANV-201 address() が port を持たなければ port 特定不能として reject する', async () => {
    // unix socket 等で address() が string を返す状況
    await setServerBehavior({ address: '/tmp/some.sock' });
    const anvil = await loadAnvil();

    await expect(anvil.getFreePort()).rejects.toThrow('Could not determine free port');
  });

  it('T-ANV-202 close が失敗したら port を返さず close error を伝播する', async () => {
    await setServerBehavior({
      address: { port: 45001, family: 'IPv4', address: '127.0.0.1' },
      closeError: new Error('close failed'),
    });
    const anvil = await loadAnvil();

    await expect(anvil.getFreePort()).rejects.toThrow('close failed');
  });

  it('T-ANV-203 OS が同じ port しか返さなければ試行を使い切って reject する', async () => {
    // OS が常に同一 port を返す = 2 回目以降は必ず予約済で衝突し続ける状況
    await setServerBehavior({ address: { port: 45002, family: 'IPv4', address: '127.0.0.1' } });
    const anvil = await loadAnvil();
    const net = await loadNet();

    // 1 回目は予約されて成功する
    await expect(anvil.getFreePort()).resolves.toBe(45002);

    const callsBefore = (net.createServer as unknown as ReturnType<typeof vi.fn>).mock.calls
      .length;
    // 2 回目は同じ port が返り続けるため上限まで retry して諦める
    await expect(anvil.getFreePort()).rejects.toThrow('Could not determine free port');
    const retries =
      (net.createServer as unknown as ReturnType<typeof vi.fn>).mock.calls.length - callsBefore;
    expect(retries).toBe(50);
  });

  it('T-ANV-204 予約済 port を跨いでも別 port が空いていれば解決する', async () => {
    // 1 回目に返した port は予約済なので、 2 回目に別 port を返せば skip して解決する
    const ports = [45003, 45003, 45004];
    let index = 0;
    const net = await loadNet();
    (net.createServer as unknown as ReturnType<typeof vi.fn>).mockImplementation(() =>
      makeFakeServer({
        address: {
          port: ports[Math.min(index++, ports.length - 1)],
          family: 'IPv4',
          address: '127.0.0.1',
        },
      }),
    );
    const anvil = await loadAnvil();

    await expect(anvil.getFreePort()).resolves.toBe(45003);
    await expect(anvil.getFreePort()).resolves.toBe(45004);
  });
});
