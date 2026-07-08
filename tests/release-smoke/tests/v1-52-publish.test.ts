// Behavior test for v1.52-4 publish PR。
// v1.52 = @kiwa-test/mobile v0.2 → v0.3 (advanced III、 pair 深度 3 段拡張達成 5 例目 pair 深度 3 段記録)
// systematic root cause pattern SSOT 27th application.
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

describe('v1.52-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.52.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.52.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.52/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.52/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.52');
    }
  });

  it('VitePress config.mts wires v1.52 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.52');
    for (const link of [
      '/tutorials/112-mobile-new-architecture',
      '/concepts/mobile-testing-advanced-III',
      '/migrations/v1.51-to-v1.52',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/mobile package.json is v0.3.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/mobile/package.json');
    expect(pkg.name).toBe('@kiwa-test/mobile');
    expect(pkg.version).toBe('0.3.0');
  });

  it('4 new advanced III axis file 全存在', () => {
    for (const rel of [
      'packages/mobile/src/semantics/fabric.ts',
      'packages/mobile/src/semantics/turbo-modules.ts',
      'packages/mobile/src/semantics/codegen.ts',
      'packages/mobile/src/semantics/new-architecture.ts',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
    }
  });

  it('release script filter contains @kiwa-test/mobile (27th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/mobile');
    expect(release).toContain('--filter @kiwa-test/mobile');
  });

  it('dogfood-mobile-new-arch-app exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'examples/dogfood-mobile-new-arch-app/src'))).toBe(true);
  });

  it('docs-tutorial-v1.52.test.ts snippet exists (30 milestone streak 突入)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/mobile/tests/docs-tutorial-v1.52.test.ts'))).toBe(true);
  });
});
