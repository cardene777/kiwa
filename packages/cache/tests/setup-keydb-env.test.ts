import { afterEach, describe, expect, it } from 'vitest';
import { setupKeyDBEnv, type KeyDBTestEnv } from '../src/index.js';

const envs: KeyDBTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupKeyDBEnv (defaults)', () => {
  it('T-KDB-001 defaults to stub backend when no mode is passed', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    expect(env.backend).toBe('stub');
    expect(env.mode).toBe('mock');
    expect(env.keydbUrl).toBeUndefined();
    expect(env.client).toBe('ioredis');
    expect(env.cluster).toEqual(['stub-master-0']);
  });

  it('T-KDB-002 accepts a custom client selector', async () => {
    const env = await setupKeyDBEnv({ client: 'node-redis' });
    envs.push(env);
    expect(env.client).toBe('node-redis');
  });

  it('T-KDB-003 accepts a multi-master cluster', async () => {
    const env = await setupKeyDBEnv({ cluster: ['m-a', 'm-b', 'm-c'] });
    envs.push(env);
    expect(env.cluster).toEqual(['m-a', 'm-b', 'm-c']);
  });

  it('T-KDB-004 rejects an unknown mode', async () => {
    await expect(
      setupKeyDBEnv({ mode: 'invalid' as unknown as 'stub' }),
    ).rejects.toThrow(/unknown mode/);
  });

  it('T-KDB-005 requires testcontainers.url for testcontainers mode (v0.2 scope)', async () => {
    await expect(setupKeyDBEnv({ mode: 'testcontainers' })).rejects.toThrow(
      /requires testcontainers\.url/,
    );
  });

  it('T-KDB-006 rejects testcontainers URL that is unreachable', async () => {
    await expect(
      setupKeyDBEnv({
        mode: 'testcontainers',
        testcontainers: { url: '127.0.0.1:1' },
      }),
    ).rejects.toThrow(/did not respond/);
  });
});

describe('setupKeyDBEnv (Redis-compatible surface)', () => {
  it('T-KDB-007 set then get returns the stored value', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    await env.set('k', 'v');
    expect(await env.get('k')).toBe('v');
  });

  it('T-KDB-008 get returns null for missing keys', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    expect(await env.get('missing')).toBeNull();
  });

  it('T-KDB-009 delete returns 1 for existing keys, 0 for missing', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    await env.set('k', 'v');
    expect(await env.delete('k')).toBe(1);
    expect(await env.delete('k')).toBe(0);
  });

  it('T-KDB-010 set rejects ttlSeconds <= 0', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    await expect(env.set('k', 'v', { ttlSeconds: 0 })).rejects.toThrow(/must be > 0/);
  });

  it('T-KDB-011 expire attaches TTL to an existing key', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    await env.set('k', 'v');
    expect(await env.expire('k', 60)).toBe(true);
    const ttl = await env.ttl('k');
    expect(ttl).toBeGreaterThanOrEqual(59);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it('T-KDB-012 expire returns false for missing keys', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    expect(await env.expire('missing', 60)).toBe(false);
  });

  it('T-KDB-013 ttl returns -1 for keys without expiry', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    await env.set('k', 'v');
    expect(await env.ttl('k')).toBe(-1);
  });

  it('T-KDB-014 ttl returns -2 for missing keys', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    expect(await env.ttl('missing')).toBe(-2);
  });

  it('T-KDB-015 keys expire once their TTL elapses', async () => {
    const env = await setupKeyDBEnv({ stub: { expiryTickMs: 5 } });
    envs.push(env);
    await env.set('k', 'v', { ttlSeconds: 0.05 });
    await new Promise((r) => setTimeout(r, 100));
    expect(await env.get('k')).toBeNull();
  });

  it('T-KDB-016 assertTTL bounded check succeeds within range', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    await env.set('k', 'v', { ttlSeconds: 100 });
    await env.assertTTL('k', { atLeast: 90, atMost: 100 });
  });

  it('T-KDB-017 assertTTL rejects when TTL is outside range', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    await env.set('k', 'v', { ttlSeconds: 10 });
    await expect(env.assertTTL('k', { atLeast: 100 })).rejects.toThrow(/expected TTL >=/);
  });
});

describe('setupKeyDBEnv (Pub/Sub)', () => {
  it('T-KDB-018 publish delivers to a subscribed channel', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    const sub = await env.subscribe('chan');
    await env.publish('chan', 'hello');
    const msg = await sub.next();
    expect(msg.channel).toBe('chan');
    expect(msg.message).toBe('hello');
    await sub.close();
  });

  it('T-KDB-019 publish returns the number of subscribers that received it', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    const sub1 = await env.subscribe('chan');
    const sub2 = await env.subscribe('chan');
    const delivered = await env.publish('chan', 'x');
    expect(delivered).toBe(2);
    await sub1.close();
    await sub2.close();
  });

  it('T-KDB-020 publish records the originating master', async () => {
    const env = await setupKeyDBEnv({ cluster: ['m-a', 'm-b'] });
    envs.push(env);
    const sub = await env.subscribe('chan');
    await env.publish('chan', 'from-b', { master: 'm-b' });
    const msg = await sub.next();
    expect(msg.master).toBe('m-b');
    await sub.close();
  });

  it('T-KDB-021 assertPublished matches a string payload', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    setTimeout(() => {
      void env.publish('chan', 'target');
    }, 20);
    const msg = await env.assertPublished('chan', { match: 'target', timeoutMs: 500 });
    expect(msg.message).toBe('target');
  });

  it('T-KDB-022 assertPublished matches a regex payload', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    setTimeout(() => {
      void env.publish('chan', 'user-42 signed in');
    }, 20);
    const msg = await env.assertPublished('chan', {
      match: /^user-\d+ signed in$/,
      timeoutMs: 500,
    });
    expect(msg.message).toBe('user-42 signed in');
  });

  it('T-KDB-023 assertPublished rejects on timeout when nothing matches', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    await expect(
      env.assertPublished('chan', { match: 'nope', timeoutMs: 100 }),
    ).rejects.toThrow(/no message on "chan" matched/);
  });

  it('T-KDB-024 subscribe historical messages replay on next()', async () => {
    const env = await setupKeyDBEnv();
    envs.push(env);
    const sub = await env.subscribe('chan');
    await env.publish('chan', 'first');
    await env.publish('chan', 'second');
    const m1 = await sub.next();
    const m2 = await sub.next();
    expect(m1.message).toBe('first');
    expect(m2.message).toBe('second');
    await sub.close();
  });
});

describe('setupKeyDBEnv (multi-master replication)', () => {
  it('T-KDB-025 writes on one master replicate to every other master (synchronous)', async () => {
    const env = await setupKeyDBEnv({ cluster: ['m-a', 'm-b', 'm-c'] });
    envs.push(env);
    await env.set('k', 'v', { master: 'm-a' });
    expect(await env.get('k', { master: 'm-a' })).toBe('v');
    expect(await env.get('k', { master: 'm-b' })).toBe('v');
    expect(await env.get('k', { master: 'm-c' })).toBe('v');
  });

  it('T-KDB-026 replication lag delays visibility on other masters', async () => {
    const env = await setupKeyDBEnv({
      cluster: ['m-a', 'm-b'],
      stub: { replicationLagMs: 50 },
    });
    envs.push(env);
    await env.set('k', 'v', { master: 'm-a' });
    expect(await env.get('k', { master: 'm-a' })).toBe('v');
    // m-b lags — value not yet visible.
    expect(await env.get('k', { master: 'm-b' })).toBeNull();
    await new Promise((r) => setTimeout(r, 80));
    expect(await env.get('k', { master: 'm-b' })).toBe('v');
  });

  it('T-KDB-027 rejects a master that is not part of the cluster', async () => {
    const env = await setupKeyDBEnv({ cluster: ['m-a'] });
    envs.push(env);
    await expect(env.set('k', 'v', { master: 'm-unknown' })).rejects.toThrow(
      /not part of the cluster/,
    );
  });

  it('T-KDB-028 listEntries surfaces every replica across masters', async () => {
    const env = await setupKeyDBEnv({ cluster: ['m-a', 'm-b'] });
    envs.push(env);
    await env.set('k', 'v');
    const entries = env.listEntries();
    // Each master sees the key — 2 entries.
    expect(entries).toHaveLength(2);
    const masters = new Set(entries.map((e) => e.master));
    expect(masters).toEqual(new Set(['m-a', 'm-b']));
  });
});

describe('setupKeyDBEnv (flushAll + lifecycle)', () => {
  it('T-KDB-029 flushAll wipes every key on every master', async () => {
    const env = await setupKeyDBEnv({ cluster: ['m-a', 'm-b'] });
    envs.push(env);
    await env.set('k1', 'v1');
    await env.set('k2', 'v2');
    await env.flushAll();
    expect(env.listEntries()).toHaveLength(0);
    expect(await env.get('k1')).toBeNull();
  });

  it('T-KDB-030 stop() prevents further operations and clears state', async () => {
    const env = await setupKeyDBEnv();
    await env.set('k', 'v');
    await env.stop();
    await expect(env.set('k', 'v2')).rejects.toThrow(/cannot use env after stop/);
  });
});
