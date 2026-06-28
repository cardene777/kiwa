import { afterEach, describe, expect, it } from 'vitest';
import { createAnvilPool, setupTestEnv, type AnvilPool } from '../src/index.js';

const pools: AnvilPool[] = [];

afterEach(async () => {
  while (pools.length > 0) {
    const pool = pools.pop();
    if (pool) await pool.stopAll();
  }
});

async function chainId(rpcUrl: string): Promise<number> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
  });
  const json = (await res.json()) as { result: string };
  return Number.parseInt(json.result, 16);
}

async function getBalance(rpcUrl: string, address: string): Promise<bigint> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }),
  });
  const json = (await res.json()) as { result: string };
  return BigInt(json.result);
}

async function setBalance(rpcUrl: string, address: string, balanceWei: bigint): Promise<void> {
  await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'anvil_setBalance',
      params: [address, `0x${balanceWei.toString(16)}`],
    }),
  });
}

describe('createAnvilPool', () => {
  it('spawns N anvil instances in parallel', async () => {
    const pool = await createAnvilPool({ size: 3 });
    pools.push(pool);
    expect(pool.size).toBe(3);
  });

  it('borrows distinct anvils up to pool size', async () => {
    const pool = await createAnvilPool({ size: 3 });
    pools.push(pool);
    const a = await pool.borrow();
    const b = await pool.borrow();
    const c = await pool.borrow();
    const ports = new Set([a.handle.port, b.handle.port, c.handle.port]);
    expect(ports.size).toBe(3);
    expect(await chainId(a.rpcUrl)).toBe(31337);
    expect(await chainId(b.rpcUrl)).toBe(31337);
    expect(await chainId(c.rpcUrl)).toBe(31337);
    await Promise.all([a.release(), b.release(), c.release()]);
  });

  it('queues borrowers when pool is exhausted and releases serve them', async () => {
    const pool = await createAnvilPool({ size: 1 });
    pools.push(pool);
    const lease = await pool.borrow();
    const waiter = pool.borrow();
    let waiterResolved = false;
    waiter.then(() => {
      waiterResolved = true;
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(waiterResolved).toBe(false);
    await lease.release();
    const second = await waiter;
    expect(second.handle.port).toBe(lease.handle.port);
    await second.release();
  });

  it('anvil_reset clears mutated state between leases', async () => {
    const pool = await createAnvilPool({ size: 1 });
    pools.push(pool);
    const target = '0x0000000000000000000000000000000000005678';
    const oneEth = 10n ** 18n;

    const a = await pool.borrow();
    expect(await getBalance(a.rpcUrl, target)).toBe(0n);
    await setBalance(a.rpcUrl, target, oneEth);
    expect(await getBalance(a.rpcUrl, target)).toBe(oneEth);
    await a.release();

    const b = await pool.borrow();
    expect(await getBalance(b.rpcUrl, target)).toBe(0n);
    await b.release();
  });

  it('integrates with setupTestEnv via pool option', async () => {
    const pool = await createAnvilPool({ size: 2 });
    pools.push(pool);
    const envs = await Promise.all([setupTestEnv({ pool }), setupTestEnv({ pool })]);
    expect(envs[0]?.mode).toBe('anvil');
    expect(envs[1]?.mode).toBe('anvil');
    expect(envs[0]?.port).not.toBe(envs[1]?.port);
    await Promise.all(envs.map((env) => env?.stop()));
  });

  it('rejects when anvil + pool are passed together', async () => {
    const pool = await createAnvilPool({ size: 1 });
    pools.push(pool);
    await expect(setupTestEnv({ anvil: true, pool })).rejects.toThrow(/mutually exclusive/);
  });

  it('rejects non-positive pool size', async () => {
    await expect(createAnvilPool({ size: 0 })).rejects.toThrow(/positive integer/);
  });
});
