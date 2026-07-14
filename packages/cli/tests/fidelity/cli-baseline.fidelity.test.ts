import { describe, expect, it } from 'vitest';
import { runInit, InitConflictError } from '../../src/index.js';
import { setupCliEnv } from '@kiwa-lab/cli-test';

describe('cli fidelity — runInit contract', () => {
  it('T-FID-D-001 runInit で 4 file scaffold', async () => {
    const env = await setupCliEnv();
    await runInit({ cwd: env.tempDir });
    const spec = await env.fileExists('e2e/connect.spec.ts');
    const config = await env.fileExists('playwright.config.ts');
    const tsconfig = await env.fileExists('tsconfig.json');
    const pkg = await env.fileExists('package.json');
    expect(spec && config && tsconfig && pkg).toBe(true);
    await env.stop();
  });

  it('T-FID-D-002 runInit 再実行で InitConflictError', async () => {
    const env = await setupCliEnv();
    await runInit({ cwd: env.tempDir });
    await expect(runInit({ cwd: env.tempDir })).rejects.toThrow(InitConflictError);
    await env.stop();
  });

  it('T-FID-D-003 --force で conflict なし上書き', async () => {
    const env = await setupCliEnv();
    await runInit({ cwd: env.tempDir });
    await expect(runInit({ cwd: env.tempDir, force: true })).resolves.toBeUndefined();
    await env.stop();
  });

  it('T-FID-D-004 InitConflictError は Error instance', async () => {
    const env = await setupCliEnv();
    await runInit({ cwd: env.tempDir });
    try {
      await runInit({ cwd: env.tempDir });
      expect.fail('expected InitConflictError');
    } catch (e) {
      expect(e).toBeInstanceOf(InitConflictError);
      expect(e).toBeInstanceOf(Error);
    }
    await env.stop();
  });

  it('T-FID-D-005 runInit idempotent under --force', async () => {
    const env = await setupCliEnv();
    await runInit({ cwd: env.tempDir });
    await runInit({ cwd: env.tempDir, force: true });
    await runInit({ cwd: env.tempDir, force: true });
    expect(await env.fileExists('e2e/connect.spec.ts')).toBe(true);
    await env.stop();
  });
});
