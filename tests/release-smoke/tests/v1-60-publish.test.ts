// Behavior test for v1.60-4 publish PR。
// v1.60 = @kiwa-test/desktop v0.5 spawn stub 契約層 (depth-5 pattern 2 例目 candidate)
// systematic root cause pattern SSOT 35th application. Mobile v1.54 rhythm 完全再現。
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

describe('v1.60-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.60.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.60.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.60/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.60/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.60');
    }
  });

  it('VitePress config.mts wires v1.60 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.60');
    for (const link of [
      '/tutorials/120-desktop-spawn-stub',
      '/concepts/desktop-spawn-stub',
      '/migrations/v1.59-to-v1.60',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/desktop package.json is v0.5.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/desktop/package.json');
    expect(pkg.name).toBe('@kiwa-test/desktop');
    expect(pkg.version).toBe('0.5.0');
  });

  it('v0.5 spawn-driver file 存在', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/src/adapters/spawn-driver.ts'))).toBe(true);
  });

  it('release script filter contains @kiwa-test/desktop (35th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/desktop');
    expect(release).toContain('--filter @kiwa-test/desktop');
  });

  it('dogfood-desktop-spawn-app has workflow runners', () => {
    const workflow = readText('examples/dogfood-desktop-spawn-app/src/workflow.ts');
    for (const runner of [
      'runAllCliStubs',
      'runAxisBackedCliChain',
      'listNonCliAxes',
      'ALL_CLIS',
      'CLI_BACKED_AXES',
      'NON_CLI_AXES',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v1.60.test.ts snippet exists (38 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/tests/docs-tutorial-v1.60.test.ts'))).toBe(true);
  });
});
