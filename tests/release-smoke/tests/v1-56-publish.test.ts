// Behavior test for v1.56-4 publish PR。
// v1.56 = @kiwa-test/desktop v0.1 新規 (new-base pair 第 14、 42 package 到達)
// systematic root cause pattern SSOT 31st application.
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

describe('v1.56-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.56.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.56.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.56/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.56/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.56');
    }
  });

  it('VitePress config.mts wires v1.56 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.56');
    for (const link of [
      '/tutorials/116-desktop-testing',
      '/concepts/desktop-testing-baseline',
      '/migrations/v1.55-to-v1.56',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/desktop package.json is v0.1.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/desktop/package.json');
    expect(pkg.name).toBe('@kiwa-test/desktop');
    expect(pkg.version).toBe('0.1.0');
  });

  it('3 axis semantics file 全存在 (electron + tauri + webview + fidelity + types)', () => {
    for (const rel of [
      'packages/desktop/src/semantics/electron.ts',
      'packages/desktop/src/semantics/tauri.ts',
      'packages/desktop/src/semantics/webview.ts',
      'packages/desktop/src/semantics/fidelity.ts',
      'packages/desktop/src/semantics/types.ts',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
    }
  });

  it('release script filter contains v1.56 package (31st application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/desktop');
    expect(release).toContain('--filter @kiwa-test/desktop');
  });

  it('dogfood-desktop-electron-app exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'examples/dogfood-desktop-electron-app/src'))).toBe(true);
  });

  it('docs-tutorial-v1.56.test.ts snippet exists (34 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/tests/docs-tutorial-v1.56.test.ts'))).toBe(true);
  });
});
