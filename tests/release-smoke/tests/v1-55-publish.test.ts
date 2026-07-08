// Behavior test for v1.55-4 publish PR。
// v1.55 = @kiwa-test/mobile v0.5 → v0.6 (実 child_process.spawn 実行、 depth-5 pattern 実装完成)
// systematic root cause pattern SSOT 30th application (30 度突入).
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

describe('v1.55-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.55.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.55.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.55/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.55/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.55');
    }
  });

  it('VitePress config.mts wires v1.55 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.55');
    for (const link of [
      '/tutorials/115-mobile-v06-spawn',
      '/concepts/mobile-testing-v06-spawn',
      '/migrations/v1.54-to-v1.55',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/mobile package.json is v0.6.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/mobile/package.json');
    expect(pkg.name).toBe('@kiwa-test/mobile');
    expect(pkg.version).toBe('0.6.0');
  });

  it('spawn-executor.ts file exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/mobile/src/adapters/spawn-executor.ts'))).toBe(true);
  });

  it('release script filter contains @kiwa-test/mobile (30th application、 30 度突入)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/mobile');
    expect(release).toContain('--filter @kiwa-test/mobile');
  });

  it('dogfood-mobile-v06-spawn-app exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'examples/dogfood-mobile-v06-spawn-app/src'))).toBe(true);
  });

  it('docs-tutorial-v1.55.test.ts snippet exists (33 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/mobile/tests/docs-tutorial-v1.55.test.ts'))).toBe(true);
  });
});
