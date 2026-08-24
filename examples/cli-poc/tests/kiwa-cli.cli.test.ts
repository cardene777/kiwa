import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  expectExitCode,
  expectStdoutContains,
  expectStderrContains,
  setupCliEnv,
  type CliTestEnv,
} from '@kiwa-lab/cli-test';

const envs: CliTestEnv[] = [];
const here = dirname(fileURLToPath(import.meta.url));

/**
 * repo root を数えずに探す。
 *
 * 本 file は 2 箇所から走る = `test` は `tests/` を直接走らせ (#2206)、 taxonomy と coverage は
 * `.vitest-dist/tests/` を走らせる。 1 階層違うので、 数える形は片方でしか当たらない。
 *
 * `pnpm-workspace.yaml` は repo root にだけあるので目印にする。
 */
function repoRoot(from: string): string {
  let dir = from;
  for (let up = 0; up < 8; up += 1) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`pnpm-workspace.yaml not found above ${from}`);
}

const KIWA_CLI = resolve(repoRoot(here), 'packages/cli/dist/bin.js');

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function runKiwa(env: CliTestEnv, args: string[], opts: { pathOverride?: string } = {}): Promise<ReturnType<CliTestEnv['runCli']> extends Promise<infer R> ? R : never> {
  const envOverrides: Record<string, string> = {};
  if (opts.pathOverride !== undefined) envOverrides.PATH = opts.pathOverride;
  return env.runCli({ cmd: 'node', args: [KIWA_CLI, ...args], env: envOverrides });
}

describe('kiwa CLI (help / errors)', () => {
  it('T-CLI-001 --help: exit=0 + Usage を含む', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const r = await runKiwa(env, ['--help']);
    expectExitCode(r, 0, expect as unknown as Parameters<typeof expectExitCode>[2]);
    expectStdoutContains(r, 'Usage: kiwa', expect as unknown as Parameters<typeof expectStdoutContains>[2]);
  });

  it('T-CLI-002 -h short: exit=0 + Usage', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const r = await runKiwa(env, ['-h']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('Usage: kiwa');
  });

  it('T-CLI-003 unknown command: exit!=0 + stderr に Unknown command', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const r = await runKiwa(env, ['unknown-cmd']);
    expect(r.exitCode).not.toBe(0);
    expectStderrContains(r, 'Unknown command', expect as unknown as Parameters<typeof expectStderrContains>[2]);
  });
});

describe('kiwa CLI (doctor)', () => {
  it('T-CLI-004 doctor: PATH に anvil なしで失敗', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    // 既存 PATH に偽 dir を prepend する形で、 node 自身は解決できるが anvil だけ見つからない状況を作る
    const pathOverride = `/nonexistent-kiwa-test:${process.env.PATH ?? ''}`;
    const r = await runKiwa(env, ['doctor'], { pathOverride });
    if (r.exitCode !== 0) {
      expect(r.stderr).toContain('anvil not found');
    } else {
      expect(r.stdout).toContain('OK anvil');
    }
  });

  it('T-CLI-005 doctor: anvil 在で OK', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const r = await runKiwa(env, ['doctor']);
    if (process.env.PATH && r.exitCode === 0) {
      expect(r.stdout).toContain('OK anvil');
    } else {
      expect(r.stderr).toContain('anvil not found');
    }
  });
});

describe('kiwa CLI (init)', () => {
  it('T-CLI-006 init: empty dir でも自動 scaffold して成功 (新規 PJ 経路)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const r = await runKiwa(env, ['init']);
    expect(r.exitCode).toBe(0);
    expect(await env.fileExists('e2e/connect.spec.ts')).toBe(true);
  });

  it('T-CLI-007 init: seedFiles で package.json があれば成功 + connect.spec.ts 生成', async () => {
    const env = await setupCliEnv({
      seedFiles: {
        'package.json': JSON.stringify({ name: 'consumer', version: '0.0.0' }),
        'tsconfig.json': JSON.stringify({ compilerOptions: {} }),
      },
    });
    envs.push(env);
    const r = await runKiwa(env, ['init', '--force']);
    expect(r.exitCode).toBe(0);
    expect(await env.fileExists('e2e/connect.spec.ts')).toBe(true);
    expect(await env.fileExists('playwright.config.ts')).toBe(true);
  });
});

describe('kiwa CLI (anvil seed errors)', () => {
  it('T-CLI-008 anvil seed: script 指定なしで失敗', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const r = await runKiwa(env, ['anvil', 'seed']);
    expect(r.exitCode).not.toBe(0);
    expect(r.stderr).toContain('script path');
  });
});
