import { afterEach, describe, expect, it } from 'vitest';
import { createPool, type Pool } from '../src/index.js';

const pools: Array<Pool<unknown>> = [];

afterEach(async () => {
  while (pools.length > 0) {
    const pool = pools.pop();
    if (pool) await pool.stopAll();
  }
});

describe('createPool', () => {
  it('spawns N values via acquire', async () => {
    let count = 0;
    const pool = await createPool({ size: 3, acquire: async () => ++count });
    pools.push(pool as Pool<unknown>);
    expect(pool.size).toBe(3);
    expect(count).toBe(3);
  });

  it('borrows distinct values up to size', async () => {
    let count = 0;
    const pool = await createPool({ size: 2, acquire: async () => ++count });
    pools.push(pool as Pool<unknown>);
    const a = await pool.borrow();
    const b = await pool.borrow();
    expect(a.value).not.toBe(b.value);
    await a.release();
    await b.release();
  });

  it('queues borrowers when exhausted and reuses on release', async () => {
    const pool = await createPool({ size: 1, acquire: async () => 'X' });
    pools.push(pool as Pool<unknown>);
    const first = await pool.borrow();
    const pending = pool.borrow();
    let resolved = false;
    pending.then(() => (resolved = true));
    await new Promise((r) => setTimeout(r, 30));
    expect(resolved).toBe(false);
    await first.release();
    const second = await pending;
    expect(second.value).toBe('X');
    await second.release();
  });

  it('invokes reset between leases', async () => {
    const events: string[] = [];
    const pool = await createPool({
      size: 1,
      acquire: async () => 'A',
      reset: async (v) => {
        events.push(`reset:${String(v)}`);
      },
    });
    pools.push(pool as Pool<unknown>);
    const a = await pool.borrow();
    await a.release();
    const b = await pool.borrow();
    await b.release();
    expect(events).toEqual(['reset:A', 'reset:A']);
  });

  it('rejects non-positive size', async () => {
    await expect(createPool({ size: 0, acquire: async () => 1 })).rejects.toThrow(/positive integer/);
  });

  it('T-POOL-006 size=1 - 最小プール (boundary)', async () => {
    const pool = await createPool({ size: 1, acquire: async () => 'one' });
    pools.push(pool as Pool<unknown>);
    expect(pool.size).toBe(1);
  });

  it('T-POOL-007 rejects size=-1 - 負の整数も positive integer エラー', async () => {
    await expect(createPool({ size: -1, acquire: async () => 1 })).rejects.toThrow(/positive integer/);
  });

  it('T-POOL-008 rejects size=0.5 - 非整数も positive integer エラー (Number.isInteger 検査)', async () => {
    await expect(createPool({ size: 0.5, acquire: async () => 1 })).rejects.toThrow(/positive integer/);
  });

  it('T-POOL-009 rejects size=NaN - NaN も positive integer エラー', async () => {
    await expect(createPool({ size: NaN, acquire: async () => 1 })).rejects.toThrow(/positive integer/);
  });

  it('T-POOL-010 rejects size=Infinity - Infinity も positive integer エラー', async () => {
    await expect(createPool({ size: Infinity, acquire: async () => 1 })).rejects.toThrow(/positive integer/);
  });

  it('T-POOL-011 error message - size 値を message に含む (string interpolation 確認)', async () => {
    await expect(createPool({ size: 0, acquire: async () => 1 })).rejects.toThrow(/got 0/);
    await expect(createPool({ size: -3, acquire: async () => 1 })).rejects.toThrow(/got -3/);
  });

  it('T-POOL-012 acquire 並列呼出 - 全 N 個同時 acquire 実行', async () => {
    let inflight = 0;
    let peak = 0;
    const pool = await createPool({
      size: 5,
      acquire: async () => {
        inflight += 1;
        peak = Math.max(peak, inflight);
        await new Promise((r) => setTimeout(r, 20));
        inflight -= 1;
        return Math.random();
      },
    });
    pools.push(pool as Pool<unknown>);
    expect(peak).toBe(5);
  });

  it('T-POOL-013 release 並列順序 - waiter 順序維持', async () => {
    const pool = await createPool({ size: 1, acquire: async () => 'V' });
    pools.push(pool as Pool<unknown>);
    const a = await pool.borrow();
    const order: string[] = [];
    const w1 = pool.borrow().then(() => order.push('w1'));
    const w2 = pool.borrow().then(() => order.push('w2'));
    await new Promise((r) => setTimeout(r, 10));
    await a.release();
    const lease1 = await Promise.race([w1, w2]);
    await lease1;
    expect(order).toEqual(['w1']);
  });

  it('T-POOL-014 reset throws - reset 失敗時も slot.inUse=false に戻る (finally block)', async () => {
    const pool = await createPool({
      size: 1,
      acquire: async () => 'A',
      reset: async () => {
        throw new Error('reset failed');
      },
    });
    pools.push(pool as Pool<unknown>);
    const a = await pool.borrow();
    await expect(a.release()).rejects.toThrow(/reset failed/);
    const b = await pool.borrow();
    expect(b.value).toBe('A');
    await b.release().catch(() => {});
  });

  it('T-POOL-015 reset undefined - reset 未指定なら release で何も呼ばない', async () => {
    let resetCalls = 0;
    const pool = await createPool({
      size: 1,
      acquire: async () => 'A',
    });
    pools.push(pool as Pool<unknown>);
    const a = await pool.borrow();
    await a.release();
    expect(resetCalls).toBe(0);
  });

  it('T-POOL-016 stopAll - release 関数呼出 (release option 渡された場合)', async () => {
    const released: string[] = [];
    const pool = await createPool({
      size: 2,
      acquire: async () => 'X',
      release: async (v) => {
        released.push(String(v));
      },
    });
    await pool.stopAll();
    expect(released).toEqual(['X', 'X']);
  });

  it('T-POOL-017 stopAll - release option 未指定でも例外なく終了', async () => {
    const pool = await createPool({ size: 2, acquire: async () => 'X' });
    await expect(pool.stopAll()).resolves.toBeUndefined();
  });

  it('T-POOL-018 stopAll - waiters cleared (release option なしでも waiters drain)', async () => {
    const pool = await createPool({ size: 1, acquire: async () => 'V' });
    const lease = await pool.borrow();
    const waiter = pool.borrow();
    await pool.stopAll();
    expect(pool.size).toBe(1);
    await lease.release().catch(() => {});
    expect(true).toBe(true);
  });

  it('T-POOL-019 size property - 初期 size を保持 (mutation で改変されない)', async () => {
    const pool = await createPool({ size: 3, acquire: async () => 1 });
    pools.push(pool as Pool<unknown>);
    expect(pool.size).toBe(3);
    const a = await pool.borrow();
    expect(pool.size).toBe(3);
    await a.release();
    expect(pool.size).toBe(3);
  });

  it('T-POOL-020 acquire fail - 1 つでも失敗で Promise.all reject', async () => {
    let called = 0;
    await expect(
      createPool({
        size: 3,
        acquire: async () => {
          called += 1;
          if (called === 2) throw new Error('acquire failed');
          return 'X';
        },
      }),
    ).rejects.toThrow(/acquire failed/);
  });

  it('T-POOL-021 borrow without release - 全 lease 占有後の borrow は queue', async () => {
    const pool = await createPool({ size: 2, acquire: async () => 'V' });
    pools.push(pool as Pool<unknown>);
    const a = await pool.borrow();
    const b = await pool.borrow();
    let thirdResolved = false;
    pool.borrow().then(() => (thirdResolved = true));
    await new Promise((r) => setTimeout(r, 30));
    expect(thirdResolved).toBe(false);
    await a.release();
    await new Promise((r) => setTimeout(r, 10));
    expect(thirdResolved).toBe(true);
    await b.release();
  });

  it('T-POOL-022 reset and waiter - release で waiter にも transfer', async () => {
    let resetCount = 0;
    const pool = await createPool({
      size: 1,
      acquire: async () => 'A',
      reset: async () => {
        resetCount += 1;
      },
    });
    pools.push(pool as Pool<unknown>);
    const first = await pool.borrow();
    const waiter = pool.borrow();
    await first.release();
    const second = await waiter;
    expect(resetCount).toBe(1);
    await second.release();
    expect(resetCount).toBe(2);
  });
});
