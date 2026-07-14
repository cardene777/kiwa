import { describe, expect, it } from 'vitest';
import { setupCliEnv } from '../../src/index.js';

describe('cli-test fidelity — setupCliEnv contract', () => {
  it('T-FID-D-001 tempDir は unique per setup', async () => {
    const env1 = await setupCliEnv();
    const env2 = await setupCliEnv();
    expect(env1.tempDir).not.toBe(env2.tempDir);
    await env1.stop();
    await env2.stop();
  });

  it('T-FID-D-002 writeFile idempotent (同 path で上書き)', async () => {
    const env = await setupCliEnv();
    await env.writeFile('a.txt', 'v1');
    await env.writeFile('a.txt', 'v2');
    const content = await env.readFile('a.txt');
    expect(content).toBe('v2');
    await env.stop();
  });

  it('T-FID-D-003 fileExists で存在確認正確', async () => {
    const env = await setupCliEnv();
    await env.writeFile('exists.txt', 'x');
    expect(await env.fileExists('exists.txt')).toBe(true);
    expect(await env.fileExists('missing.txt')).toBe(false);
    await env.stop();
  });

  it('T-FID-D-004 readFile で存在しない file は throw', async () => {
    const env = await setupCliEnv();
    await expect(env.readFile('missing.txt')).rejects.toThrow();
    await env.stop();
  });

  it('T-FID-D-005 stop で cleanup (tempDir 削除)', async () => {
    const env = await setupCliEnv();
    await env.writeFile('a.txt', 'x');
    await env.stop();
    // stop 後は fileExists が false or throw を期待
    let exists = false;
    try {
      exists = await env.fileExists('a.txt');
    } catch {
      exists = false;
    }
    expect(exists).toBe(false);
  });
});
