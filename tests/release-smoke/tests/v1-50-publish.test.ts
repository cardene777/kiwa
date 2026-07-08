// Behavior test for v1.50-4 publish PR。
// v1.50 = @kiwa-test/mobile v0.1 新規 (new-base pair 第 13、 41 package 到達)
// systematic root cause pattern SSOT 25th application.
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

describe('v1.50-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.50.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.50.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.50/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.50/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.50');
    }
  });

  it('VitePress config.mts wires v1.50 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.50');
    for (const link of [
      '/tutorials/110-mobile-testing',
      '/concepts/mobile-testing-baseline',
      '/migrations/v1.49-to-v1.50',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/mobile package.json is v0.1.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/mobile/package.json');
    expect(pkg.name).toBe('@kiwa-test/mobile');
    expect(pkg.version).toBe('0.1.0');
  });

  it('3 axis semantics file 全存在 (react-native + expo + metro + fidelity)', () => {
    for (const rel of [
      'packages/mobile/src/semantics/react-native.ts',
      'packages/mobile/src/semantics/expo.ts',
      'packages/mobile/src/semantics/metro.ts',
      'packages/mobile/src/semantics/fidelity.ts',
      'packages/mobile/src/semantics/types.ts',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
    }
  });

  it('release script filter contains v1.50 package (25th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/mobile');
    expect(release).toContain('--filter @kiwa-test/mobile');
  });

  it('dogfood-mobile-rn-app exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'examples/dogfood-mobile-rn-app/src'))).toBe(true);
  });

  it('docs-tutorial-v1.50.test.ts snippet exists (28 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/mobile/tests/docs-tutorial-v1.50.test.ts'))).toBe(true);
  });
});
