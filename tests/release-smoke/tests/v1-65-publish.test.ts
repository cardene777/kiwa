// Behavior test for v1.65-4 publish PR。
// v1.65 = @kiwa-test/quality-metrics v0.5 historical trend + drift detection (depth-5 pattern 3 例目確定)
// systematic root cause pattern SSOT 40th application.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

function readText(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

function readJson<T = unknown>(rel: string): T {
  return JSON.parse(readText(rel)) as T;
}

describe('v1.65-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.65.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.65.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.65/', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      const rel = `docs/announcements/v1.65/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.65');
    }
  });

  it('VitePress config.mts wires v1.65 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.65');
    for (const link of [
      '/tutorials/125-quality-metrics-history',
      '/concepts/quality-metrics-history',
      '/migrations/v1.64-to-v1.65',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/quality-metrics package.json is v0.5.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/quality-metrics/package.json');
    expect(pkg.name).toBe('@kiwa-test/quality-metrics');
    expect(pkg.version).toBe('0.5.0');
  });

  it('v0.5 history.ts file 存在', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/quality-metrics/src/history.ts'))).toBe(true);
  });

  it('release script filter contains @kiwa-test/quality-metrics (40th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    expect(pkg.scripts.release).toContain('-F @kiwa-test/quality-metrics');
  });

  it('dogfood-quality-metrics-history-app has 4 pattern workflow runners', () => {
    const workflow = readText('examples/dogfood-quality-metrics-history-app/src/workflow.ts');
    for (const runner of [
      'captureReleaseSnapshot',
      'verifyNoRegression',
      'generateReleaseTrend',
      'findRegressions',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v1.65.test.ts snippet exists (43 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/quality-metrics/tests/docs-tutorial-v1.65.test.ts'))).toBe(true);
  });
});
