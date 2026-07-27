# Reuse expensive test resources

[日本語](/libraries/foundation/core/guides/reuse-expensive-resources)

In this guide, you use `createPool()` to reuse a resource across tests while allowing up to two simultaneous consumers. The resource can be anything. This example uses a custom worker with `reset()` and `stop()`.

## Create the pool

`size` must be a positive integer. `acquire()` is called `size` times while the pool is created.

```ts
import { createPool } from "@kiwa-lab/core";

type Worker = {
  run: (job: string) => Promise<void>;
  reset: () => Promise<void>;
  stop: () => Promise<void>;
};

declare function startWorker(): Promise<Worker>;

const pool = await createPool<Worker>({
  size: 2,
  acquire: () => startWorker(),
  reset: (worker) => worker.reset(),
  release: (worker) => worker.stop(),
});
```

## Always return the lease

`borrow()` returns `value` and `release()`. If no resource is available, it waits until another lease is returned. Because `release()` calls `reset()` before passing the slot to the next waiter, always call it in `finally`.

```ts
const lease = await pool.borrow();

try {
  await lease.value.run("rebuild-search-index");
} finally {
  await lease.release();
}
```

## Stop resources when the test suite ends

`stopAll()` calls `release()` for every slot when one is specified. Call it once from your test runner's suite-end hook.

```ts
afterAll(async () => {
  await pool.stopAll();
});
```

## Design notes

- You can omit `reset` for resources that do not need it. Returning a lease then only makes the slot available again.
- You can omit `release` for resources that do not need shutdown work. `stopAll()` still clears the pool slots, but does not stop those resources.
- Do not reuse a pool after `stopAll()`. Do not call `borrow()` afterward; use it as suite cleanup.

When you need an Anvil pool, use `createAnvilPool()` from `@kiwa-lab/dapp` instead of the general-purpose `createPool()`. It runs `anvil_reset` when a lease is returned.

Implementation basis: [`packages/core/src/pool.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/src/pool.ts).
