import { startAnvil, type AnvilHandle, type StartAnvilOptions } from './anvil.js';

export interface AnvilPoolOptions {
  /** number of anvil instances to pre-spawn */
  size: number;
  /** options applied to every anvil in the pool */
  anvil?: Omit<StartAnvilOptions, 'port'>;
}

export interface AnvilLease {
  handle: AnvilHandle;
  rpcUrl: string;
  /** return this anvil to the pool (anvil_reset is invoked before reuse) */
  release: () => Promise<void>;
}

export interface AnvilPool {
  size: number;
  /** take an anvil out of the pool, waiting if none are free */
  borrow: () => Promise<AnvilLease>;
  /** stop every anvil and clear the pool */
  stopAll: () => Promise<void>;
}

interface PoolSlot {
  handle: AnvilHandle;
  inUse: boolean;
}

async function resetAnvil(handle: AnvilHandle): Promise<void> {
  await fetch(`http://127.0.0.1:${handle.port}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'anvil_reset', params: [] }),
  });
}

export async function createAnvilPool(opts: AnvilPoolOptions): Promise<AnvilPool> {
  if (!Number.isInteger(opts.size) || opts.size < 1) {
    throw new Error(`createAnvilPool: size must be a positive integer, got ${opts.size}`);
  }

  const handles = await Promise.all(
    Array.from({ length: opts.size }, () => startAnvil(opts.anvil ?? {})),
  );
  const slots: PoolSlot[] = handles.map((handle) => ({ handle, inUse: false }));
  const waiters: Array<(slot: PoolSlot) => void> = [];

  function takeSlot(): PoolSlot | null {
    for (const slot of slots) {
      if (!slot.inUse) {
        slot.inUse = true;
        return slot;
      }
    }
    return null;
  }

  async function borrow(): Promise<AnvilLease> {
    const immediate = takeSlot();
    const slot = immediate ?? (await new Promise<PoolSlot>((resolve) => waiters.push(resolve)));
    return {
      handle: slot.handle,
      rpcUrl: `http://127.0.0.1:${slot.handle.port}`,
      release: async () => {
        try {
          await resetAnvil(slot.handle);
        } finally {
          slot.inUse = false;
          const next = waiters.shift();
          if (next) {
            slot.inUse = true;
            next(slot);
          }
        }
      },
    };
  }

  async function stopAll(): Promise<void> {
    while (waiters.length) {
      const waiter = waiters.shift();
      if (waiter) waiter({ handle: slots[0]!.handle, inUse: true });
    }
    await Promise.all(slots.map((slot) => slot.handle.stop()));
    slots.length = 0;
  }

  return { size: opts.size, borrow, stopAll };
}
