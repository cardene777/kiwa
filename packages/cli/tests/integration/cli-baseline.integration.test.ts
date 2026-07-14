import { describe, expect, it } from 'vitest';
import { runInit, runSpecToTest } from '../../src/index.js';
import { setupCliEnv } from '@kiwa-lab/cli-test';

describe('cli integration — CLI command workflow', () => {
  it('T-INT-D-001 runInit で scaffold 実行', async () => {
    const env = await setupCliEnv();
    await runInit({ cwd: env.tempDir });
    const hasSpec = await env.fileExists('e2e/connect.spec.ts');
    expect(hasSpec).toBe(true);
    await env.stop();
  });

  it('T-INT-D-002 runInit で playwright.config.ts 生成', async () => {
    const env = await setupCliEnv();
    await runInit({ cwd: env.tempDir });
    const hasConfig = await env.fileExists('playwright.config.ts');
    expect(hasConfig).toBe(true);
    await env.stop();
  });

  it('T-INT-D-003 runInit で tsconfig 生成', async () => {
    const env = await setupCliEnv();
    await runInit({ cwd: env.tempDir });
    const hasTsconfig = await env.fileExists('tsconfig.json');
    expect(hasTsconfig).toBe(true);
    await env.stop();
  });

  it('T-INT-D-004 runInit --force で 既存 file 上書き', async () => {
    const env = await setupCliEnv();
    await runInit({ cwd: env.tempDir });
    await runInit({ cwd: env.tempDir, force: true });
    const hasSpec = await env.fileExists('e2e/connect.spec.ts');
    expect(hasSpec).toBe(true);
    await env.stop();
  });

  it('T-INT-D-005 runSpecToTest で spec → test 変換', async () => {
    const env = await setupCliEnv();
    await env.writeFile('spec.md', `# Test\n\n- module: m\n- layer: unit\n\n| id | observation | given | when | then |\n|----|-------------|-------|------|------|\n| T-1 | ok | in | call | out |`);
    await runSpecToTest({ input: `${env.tempDir}/spec.md`, output: `${env.tempDir}/test.ts`, layer: 'unit' });
    const hasTest = await env.fileExists('test.ts');
    expect(hasTest).toBe(true);
    await env.stop();
  });
});
