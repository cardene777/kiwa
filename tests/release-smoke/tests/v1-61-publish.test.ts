// Behavior test for v1.61-4 publish PR。
// v1.61 = @kiwa-test/desktop v0.6 実 child_process.spawn 実行 (depth-5 pattern 2 例目確定 + depth-6 pattern 新設 = kiwa milestone 史上初)
// systematic root cause pattern SSOT 36th application. Mobile v1.55 rhythm 完全再現。
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

describe('v1.61-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.61.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.61.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.61/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.61/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.61');
    }
  });

  it('VitePress config.mts wires v1.61 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.61');
    for (const link of [
      '/tutorials/121-desktop-v06-spawn',
      '/concepts/desktop-v06-spawn',
      '/migrations/v1.60-to-v1.61',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/desktop package.json is v0.6.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/desktop/package.json');
    expect(pkg.name).toBe('@kiwa-test/desktop');
    expect(pkg.version).toBe('0.6.0');
  });

  it('v0.6 spawn-executor file 存在', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/src/adapters/spawn-executor.ts'))).toBe(true);
  });

  it('release script filter contains @kiwa-test/desktop (36th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/desktop');
    expect(release).toContain('--filter @kiwa-test/desktop');
  });

  it('dogfood-desktop-v06-spawn-app has 3 pattern workflow runners', () => {
    const workflow = readText('examples/dogfood-desktop-v06-spawn-app/src/workflow.ts');
    for (const runner of ['runDryRunWorkflow', 'runWithInjectedSpawn', 'sanitizeEnvForCommand']) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v1.61.test.ts snippet exists (39 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/tests/docs-tutorial-v1.61.test.ts'))).toBe(true);
  });
});
