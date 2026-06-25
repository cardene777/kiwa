import type { Lease, Pool } from './types.js';

export interface PoolFactoryOptions<T> {
  size: number;
  acquire: () => Promise<T>;
  reset?: (value: T) => Promise<void>;
  release?: (value: T) => Promise<void>;
}

interface Slot<T> {
  value: T;
  inUse: boolean;
}

export async function createPool<T>(opts: PoolFactoryOptions<T>): Promise<Pool<T>> {
  if (!Number.isInteger(opts.size) || opts.size < 1) {
    throw new Error(`createPool: size must be a positive integer, got ${opts.size}`);
  }
  const values = await Promise.all(
    Array.from({ length: opts.size }, () => opts.acquire()),
  );
  const slots: Slot<T>[] = values.map((value) => ({ value, inUse: false }));
  const waiters: Array<(slot: Slot<T>) => void> = [];

  function takeFree(): Slot<T> | null {
    for (const slot of slots) {
      if (!slot.inUse) {
        slot.inUse = true;
        return slot;
      }
    }
    return null;
  }

  async function borrow(): Promise<Lease<T>> {
    const immediate = takeFree();
    const slot = immediate ?? (await new Promise<Slot<T>>((resolve) => waiters.push(resolve)));
    return {
      value: slot.value,
      release: async () => {
        try {
          if (opts.reset) await opts.reset(slot.value);
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
    while (waiters.length) waiters.shift();
    await Promise.all(
      slots.map(async (slot) => {
        if (opts.release) await opts.release(slot.value);
      }),
    );
    slots.length = 0;
  }

  return { size: opts.size, borrow, stopAll };
}
