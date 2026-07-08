// Behavior test for v1.51-4 publish PR。
// v1.51 = @kiwa-test/mobile v0.1 → v0.2 (advanced II、 pair 第 13 の 2 段目 Phase 2)
// systematic root cause pattern SSOT 26th application.
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

describe('v1.51-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.51.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.51.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.51/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.51/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.51');
    }
  });

  it('VitePress config.mts wires v1.51 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.51');
    for (const link of [
      '/tutorials/111-mobile-advanced',
      '/concepts/mobile-testing-advanced',
      '/migrations/v1.50-to-v1.51',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/mobile package.json is v0.2.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/mobile/package.json');
    expect(pkg.name).toBe('@kiwa-test/mobile');
    expect(pkg.version).toBe('0.2.0');
  });

  it('4 new axis file + real-driver adapter 全存在', () => {
    for (const rel of [
      'packages/mobile/src/semantics/navigation.ts',
      'packages/mobile/src/semantics/reanimated.ts',
      'packages/mobile/src/semantics/async-storage.ts',
      'packages/mobile/src/semantics/secure-storage.ts',
      'packages/mobile/src/adapters/real-driver.ts',
      'packages/mobile/src/adapters/index.ts',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
    }
  });

  it('release script filter contains @kiwa-test/mobile (26th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/mobile');
    expect(release).toContain('--filter @kiwa-test/mobile');
  });

  it('dogfood-mobile-advanced-app exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'examples/dogfood-mobile-advanced-app/src'))).toBe(true);
  });

  it('docs-tutorial-v1.51.test.ts snippet exists (29 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/mobile/tests/docs-tutorial-v1.51.test.ts'))).toBe(true);
  });
});
