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
});
