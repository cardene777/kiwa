import { afterEach, describe, expect, it } from 'vitest';
import { setupKeyDBEnv, type KeyDBTestEnv } from '../src/index.js';

const envs: KeyDBTestEnv[] = [];
afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('stub-keydb defensive branches — expiry + subscribe', () => {
  it('expire throws when ttlSeconds <= 0', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    await env.set('k', 'v');
    await expect(env.expire('k', 0)).rejects.toThrow(
      /ttlSeconds must be > 0/,
    );
    await expect(env.expire('k', -5)).rejects.toThrow(
      /ttlSeconds must be > 0/,
    );
  });

  it('expire returns false for a missing key', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    const result = await env.expire('nonexistent', 10);
    expect(result).toBe(false);
  });

  it('get returns null for a key whose entry has expired at read time', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    await env.set('short-lived', 'v', { ttlSeconds: 1 });
    await new Promise((r) => setTimeout(r, 1100));
    const result = await env.get('short-lived');
    expect(result).toBeNull();
  });

  it('publish with no subscribers returns 0 delivered', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    const delivered = await env.publish('empty-chan', 'msg');
    expect(delivered).toBe(0);
  });

  it('publish with 2 subscribers returns 2 delivered', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    const sub1 = await env.subscribe('multi-chan');
    const sub2 = await env.subscribe('multi-chan');
    const delivered = await env.publish('multi-chan', 'hello');
    expect(delivered).toBe(2);
    await sub1.close();
    await sub2.close();
  });

  it('subscribe.next resolves from history when cursor < history length', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    const sub = await env.subscribe('cursor-chan');
    await env.publish('cursor-chan', 'first');
    const msg = await sub.next({ timeoutMs: 500 });
    expect(msg).toMatchObject({ channel: 'cursor-chan' });
    await sub.close();
  });

  it('subscribe.next times out when no message arrives', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    const sub = await env.subscribe('quiet-chan');
    await expect(
      sub.next({ timeoutMs: 30 }),
    ).rejects.toThrow(/timeout waiting for message/);
    await sub.close();
  });

  it('subscribe.close cleans up the channel when last subscriber leaves', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    const sub = await env.subscribe('cleanup-chan');
    await sub.close();
    const delivered = await env.publish('cleanup-chan', 'orphan');
    expect(delivered).toBe(0);
  });

  it('assertKey returns null for expired key at read time', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    await env.set('permanent', 'v');
    await env.set('expiring', 'v', { ttlSeconds: 1 });
    await new Promise((r) => setTimeout(r, 1100));
    expect(await env.get('permanent')).toBe('v');
    expect(await env.get('expiring')).toBeNull();
  });
});
