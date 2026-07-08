// Behavior test for v1.64-4 publish PR。
// v1.64 = @kiwa-test/desktop v0.9 実 native binding 呼出 (depth-9 pattern 新設 candidate)
// systematic root cause pattern SSOT 39th application.
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

describe('v1.64-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.64.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.64.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.64/', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      const rel = `docs/announcements/v1.64/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.64');
    }
  });

  it('VitePress config.mts wires v1.64 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.64');
    for (const link of [
      '/tutorials/124-desktop-native-invoke',
      '/concepts/desktop-native-invoke',
      '/migrations/v1.63-to-v1.64',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/desktop package.json is v0.9.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/desktop/package.json');
    expect(pkg.name).toBe('@kiwa-test/desktop');
    expect(pkg.version).toBe('0.9.0');
  });

  it('v0.9 native-invoke file 存在', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/src/adapters/native-invoke.ts'))).toBe(true);
  });

  it('release script filter contains @kiwa-test/desktop (39th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    expect(pkg.scripts.release).toContain('-F @kiwa-test/desktop');
  });

  it('dogfood-desktop-native-invoke-app has 4 pattern workflow runners', () => {
    const workflow = readText('examples/dogfood-desktop-native-invoke-app/src/workflow.ts');
    for (const runner of [
      'invokeSingleAxis',
      'invokeAllAxes',
      'generateStatusReport',
      'extractInvokedSpawnResults',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v1.64.test.ts snippet exists (42 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/tests/docs-tutorial-v1.64.test.ts'))).toBe(true);
  });
});
