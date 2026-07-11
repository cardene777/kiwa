import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ANVIL_DEFAULT_PRIVATE_KEYS, setupTestEnv, withAnvil, type TestEnv } from '../src/index.js';

const envs: TestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function getChainId(rpcUrl: string): Promise<number> {
  const res = await fetch(rpcUrl, {
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

describe('setupTestEnv (mock mode)', () => {
  it('returns mock env when anvil option is omitted', async () => {
    const env = await setupTestEnv();
    envs.push(env);
    expect(env.mode).toBe('mock');
    expect(env.rpcUrl).toBeNull();
    expect(env.port).toBeNull();
    expect(env.anvil).toBeNull();
    expect(env.privateKeys).toBe(ANVIL_DEFAULT_PRIVATE_KEYS);
  });

  it('returns mock env when anvil: false', async () => {
    const env = await setupTestEnv({ anvil: false });
    envs.push(env);
    expect(env.mode).toBe('mock');
  });

  it('returns mock env when anvil.enabled: false', async () => {
    const env = await setupTestEnv({ anvil: { enabled: false, chainId: 31337 } });
    envs.push(env);
    expect(env.mode).toBe('mock');
  });

  it('mock env stop() is a no-op', async () => {
    const env = await setupTestEnv();
    await expect(env.stop()).resolves.toBeUndefined();
  });
});

describe('setupTestEnv (anvil mode)', () => {
  it('boots a clean anvil when anvil: true', async () => {
    const env = await setupTestEnv({ anvil: true });
    envs.push(env);
    expect(env.mode).toBe('anvil');
    if (env.mode !== 'anvil') return;
    expect(env.rpcUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    expect(env.port).toBeGreaterThan(0);
    const chainId = await getChainId(env.rpcUrl);
    expect(chainId).toBe(31337);
  });

  it('respects custom chainId', async () => {
    const env = await setupTestEnv({ anvil: { chainId: 1234 } });
    envs.push(env);
    if (env.mode !== 'anvil') throw new Error('expected anvil mode');
    const chainId = await getChainId(env.rpcUrl);
    expect(chainId).toBe(1234);
  });

  it('withAnvil throws immediately when beforeAll/afterAll are missing', async () => {
    const holder = globalThis as unknown as {
      beforeAll?: unknown;
      afterAll?: unknown;
    };
    const prevBeforeAll = holder.beforeAll;
    const prevAfterAll = holder.afterAll;
    try {
      holder.beforeAll = undefined;
      holder.afterAll = undefined;
      expect(() => withAnvil()).toThrow(/beforeAll \/ afterAll missing/);
    } finally {
      holder.beforeAll = prevBeforeAll;
      holder.afterAll = prevAfterAll;
    }
  });

  it('withAnvil returns a lifecycle whose env() throws before beforeAll runs', async () => {
    // vitest global beforeAll/afterAll は describe scope 内でのみ register される。
    // ここでは lifecycle 側 register を no-op で hijack して env() の pre-boot エラーだけを検証する。
    const holder = globalThis as unknown as {
      beforeAll?: (fn: () => Promise<void>) => void;
      afterAll?: (fn: () => Promise<void>) => void;
    };
    const prevBeforeAll = holder.beforeAll;
    const prevAfterAll = holder.afterAll;
    try {
      holder.beforeAll = () => undefined;
      holder.afterAll = () => undefined;
      const lifecycle = withAnvil();
      expect(() => lifecycle.env()).toThrow(/env\(\) called before beforeAll resolved/);
    } finally {
      holder.beforeAll = prevBeforeAll;
      holder.afterAll = prevAfterAll;
    }
  });

  it('withAnvil beforeAll boots + env() resolves + afterAll stops', async () => {
    let beforeFn: (() => Promise<void>) | undefined;
    let afterFn: (() => Promise<void>) | undefined;
    const holder = globalThis as unknown as {
      beforeAll?: (fn: () => Promise<void>) => void;
      afterAll?: (fn: () => Promise<void>) => void;
    };
    const prevBeforeAll = holder.beforeAll;
    const prevAfterAll = holder.afterAll;
    try {
      holder.beforeAll = (fn) => {
        beforeFn = fn;
      };
      holder.afterAll = (fn) => {
        afterFn = fn;
      };
      const lifecycle = withAnvil();
      expect(beforeFn).toBeDefined();
      expect(afterFn).toBeDefined();
      await beforeFn!();
      const env = lifecycle.env();
      expect(env.mode).toBe('mock');
      await afterFn!();
      // 停止後は env() が再び失敗する
      expect(() => lifecycle.env()).toThrow(/env\(\) called before beforeAll resolved/);
    } finally {
      holder.beforeAll = prevBeforeAll;
      holder.afterAll = prevAfterAll;
    }
  });

  it('writes state file when dumpState is set and loads it back', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'kiwa-state-'));
    const statePath = join(tmp, 'state.json');
    try {
      const seedEnv = await setupTestEnv({ anvil: { dumpState: statePath } });
      const seedChainId = seedEnv.mode === 'anvil' ? await getChainId(seedEnv.rpcUrl) : 0;
      expect(seedChainId).toBe(31337);
      await seedEnv.stop();
      expect(existsSync(statePath)).toBe(true);

      const loadEnv = await setupTestEnv({ anvil: { loadState: statePath } });
      envs.push(loadEnv);
      if (loadEnv.mode !== 'anvil') throw new Error('expected anvil mode');
      const loadChainId = await getChainId(loadEnv.rpcUrl);
      expect(loadChainId).toBe(31337);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
