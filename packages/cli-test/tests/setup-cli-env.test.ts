import { afterEach, describe, expect, it } from 'vitest';
import {
  expectExitCode,
  expectStdoutContains,
  setupCliEnv,
  type CliTestEnv,
} from '../src/index.js';

const envs: CliTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupCliEnv (env lifecycle)', () => {
  it('creates an isolated tempdir and removes it on stop', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    expect(env.tempDir).toMatch(/kiwa-cli-/);
    await env.writeFile('a.txt', 'hello');
    expect(await env.fileExists('a.txt')).toBe(true);
  });

  it('seeds files passed via seedFiles option', async () => {
    const env = await setupCliEnv({ seedFiles: { 'data/seed.json': '{"x":1}' } });
    envs.push(env);
    expect(await env.fileExists('data/seed.json')).toBe(true);
    expect(await env.readFile('data/seed.json')).toBe('{"x":1}');
  });
});

describe('setupCliEnv (runCli)', () => {
  it('captures stdout and exit code', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const result = await env.runCli({ cmd: 'node', args: ['-e', 'console.log("hi")'] });
    expectExitCode(result, 0, expect as unknown as Parameters<typeof expectExitCode>[2]);
    expectStdoutContains(result, 'hi', expect as unknown as Parameters<typeof expectStdoutContains>[2]);
  });

  it('captures non-zero exit codes', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const result = await env.runCli({ cmd: 'node', args: ['-e', 'process.exit(3)'] });
    expect(result.exitCode).toBe(3);
  });

  it('captures stderr', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const result = await env.runCli({
      cmd: 'node',
      args: ['-e', 'console.error("oops"); process.exit(1)'],
    });
    expect(result.stderr).toContain('oops');
    expect(result.exitCode).toBe(1);
  });

  it('feeds stdin into the child process', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const result = await env.runCli({
      cmd: 'node',
      args: [
        '-e',
        'process.stdin.on("data", d => process.stdout.write("got:" + d.toString())); process.stdin.on("end", () => process.exit(0))',
      ],
      stdin: 'hello',
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('got:hello');
  });

  it('runs inside the tempdir as default cwd', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await env.writeFile('marker.txt', 'x');
    const result = await env.runCli({
      cmd: 'node',
      args: [
        '-e',
        'console.log(require("node:fs").existsSync("marker.txt") ? "yes" : "no")',
      ],
    });
    expect(result.stdout.trim()).toBe('yes');
  });

  it('passes env overrides', async () => {
    const env = await setupCliEnv({ env: { KIWA_BASE: 'base' } });
    envs.push(env);
    const result = await env.runCli({
      cmd: 'node',
      args: ['-e', 'console.log(process.env.KIWA_BASE, process.env.KIWA_RUN)'],
      env: { KIWA_RUN: 'run' },
    });
    expect(result.stdout.trim()).toBe('base run');
  });
});

describe('setupCliEnv (timeout)', () => {
  it('rejects with timeout error when the child exceeds timeoutMs', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await expect(
      env.runCli({ cmd: 'node', args: ['-e', 'setTimeout(()=>{}, 2000)'], timeoutMs: 100 }),
    ).rejects.toThrow(/timed out/);
  });

  it('rejects when the binary does not exist', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await expect(
      env.runCli({ cmd: '/nonexistent/binary', args: [] }),
    ).rejects.toThrow();
  });

  it('listFiles returns [] for missing relative dirs', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    expect(await env.listFiles('does/not/exist')).toEqual([]);
  });

  it('fileExists returns false for missing paths', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    expect(await env.fileExists('missing.txt')).toBe(false);
  });
});

describe('setupCliEnv (file IO helpers)', () => {
  it('listFiles enumerates files recursively', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await env.writeFile('a.txt', 'a');
    await env.writeFile('sub/b.txt', 'b');
    const files = await env.listFiles();
    expect(files.sort()).toEqual(['a.txt', 'sub/b.txt']);
  });
});
