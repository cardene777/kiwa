import { startAnvil, type AnvilHandle, type StartAnvilOptions } from './anvil.js';
import { ANVIL_DEFAULT_PRIVATE_KEYS } from './anvil-default-keys.js';
import type { AnvilPool } from './anvil-pool.js';

export type AnvilModeOption = boolean | (StartAnvilOptions & { enabled?: boolean });

export interface SetupTestEnvOptions {
  /**
   * anvil 起動方針。
   * - 未指定 / false ... anvil を起動しない (mock 経路)
   * - true ... clean chain で anvil を起動
   * - object ... StartAnvilOptions を全て透過 (loadState / dumpState / chainId / port 等)
   */
  anvil?: AnvilModeOption;
  /**
   * Anvil pool を指定すると spawn ではなく pool.borrow() で取得し、
   * stop() で pool.release() (anvil_reset) を呼んで再利用する。
   * anvil option と排他、 pool 指定時は pool が anvil 起動を担う。
   */
  pool?: AnvilPool;
}

export interface MockTestEnv {
  mode: 'mock';
  rpcUrl: null;
  port: null;
  anvil: null;
  privateKeys: readonly string[];
  stop: () => Promise<void>;
}

export interface AnvilTestEnv {
  mode: 'anvil';
  rpcUrl: string;
  port: number;
  anvil: AnvilHandle;
  privateKeys: readonly string[];
  stop: () => Promise<void>;
}

export type TestEnv = MockTestEnv | AnvilTestEnv;

function resolveAnvilOptions(mode: AnvilModeOption | undefined): StartAnvilOptions | null {
  if (mode === undefined || mode === false) return null;
  if (mode === true) return {};
  const { enabled, ...rest } = mode;
  if (enabled === false) return null;
  return rest;
}

export async function setupTestEnv(opts: SetupTestEnvOptions = {}): Promise<TestEnv> {
  if (opts.pool) {
    if (opts.anvil) {
      throw new Error('setupTestEnv: anvil and pool options are mutually exclusive');
    }
    const lease = await opts.pool.borrow();
    return {
      mode: 'anvil',
      rpcUrl: lease.rpcUrl,
      port: lease.handle.port,
      anvil: lease.handle,
      privateKeys: ANVIL_DEFAULT_PRIVATE_KEYS,
      stop: () => lease.release(),
    };
  }

  const anvilOpts = resolveAnvilOptions(opts.anvil);
  if (anvilOpts === null) {
    return {
      mode: 'mock',
      rpcUrl: null,
      port: null,
      anvil: null,
      privateKeys: ANVIL_DEFAULT_PRIVATE_KEYS,
      stop: async () => undefined,
    };
  }

  const handle = await startAnvil(anvilOpts);
  return {
    mode: 'anvil',
    rpcUrl: `http://127.0.0.1:${handle.port}`,
    port: handle.port,
    anvil: handle,
    privateKeys: ANVIL_DEFAULT_PRIVATE_KEYS,
    stop: () => handle.stop(),
  };
}

export interface WithAnvilLifecycle {
  env: () => TestEnv;
}

export function withAnvil(opts: SetupTestEnvOptions = {}): WithAnvilLifecycle {
  let current: TestEnv | null = null;
  const lifecycle = (globalThis as Record<string, unknown>) as {
    beforeAll?: (fn: () => Promise<void>) => void;
    afterAll?: (fn: () => Promise<void>) => void;
  };
  if (typeof lifecycle.beforeAll !== 'function' || typeof lifecycle.afterAll !== 'function') {
    throw new Error('withAnvil must be called inside a vitest test file (beforeAll / afterAll missing)');
  }
  lifecycle.beforeAll(async () => {
    current = await setupTestEnv(opts);
  });
  lifecycle.afterAll(async () => {
    if (current) {
      await current.stop();
      current = null;
    }
  });
  return {
    env: () => {
      if (!current) throw new Error('withAnvil env() called before beforeAll resolved');
      return current;
    },
  };
}
