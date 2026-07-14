import { describe, expect, it } from 'vitest';
import { setupCliEnv } from '../../src/index.js';

describe('cli-test integration — setupCliEnv workflow', () => {
  it('T-INT-D-001 setupCliEnv で tempDir 作成', async () => {
    const env = await setupCliEnv();
    expect(env.tempDir).toBeDefined();
    expect(typeof env.tempDir).toBe('string');
    await env.stop();
  });

  it('T-INT-D-002 writeFile + readFile round-trip', async () => {
    const env = await setupCliEnv();
    await env.writeFile('a.txt', 'hello');
    const content = await env.readFile('a.txt');
    expect(content).toBe('hello');
    await env.stop();
  });

  it('T-INT-D-003 fileExists で 判定', async () => {
    const env = await setupCliEnv();
    await env.writeFile('exists.txt', 'x');
    expect(await env.fileExists('exists.txt')).toBe(true);
    expect(await env.fileExists('missing.txt')).toBe(false);
    await env.stop();
  });

  it('T-INT-D-004 listFiles で file 列挙', async () => {
    const env = await setupCliEnv();
    await env.writeFile('f1.txt', 'x');
    await env.writeFile('f2.txt', 'y');
    const files = await env.listFiles();
    expect(files.length).toBeGreaterThanOrEqual(2);
    await env.stop();
  });

  it('T-INT-D-005 runCli で echo 実行', async () => {
    const env = await setupCliEnv();
    const result = await env.runCli({ cmd: 'echo', args: ['hello'] });
    expect(result.stdout).toContain('hello');
    expect(result.exitCode).toBe(0);
    await env.stop();
  });
});
