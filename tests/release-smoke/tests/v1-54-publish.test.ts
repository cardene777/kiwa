// Behavior test for v1.54-4 publish PR。
// v1.54 = @kiwa-test/mobile v0.4 → v0.5 (spawn-driver stub、 pair 深度 5 段拡張 1 例目 candidate、 depth-5 pattern 新設)
// systematic root cause pattern SSOT 29th application.
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

describe('v1.54-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.54.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.54.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.54/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.54/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.54');
    }
  });

  it('VitePress config.mts wires v1.54 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.54');
    for (const link of [
      '/tutorials/114-mobile-real-cli',
      '/concepts/mobile-testing-real-cli',
      '/migrations/v1.53-to-v1.54',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/mobile package.json is v0.5.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/mobile/package.json');
    expect(pkg.name).toBe('@kiwa-test/mobile');
    expect(pkg.version).toBe('0.5.0');
  });

  it('spawn-driver.ts file exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/mobile/src/adapters/spawn-driver.ts'))).toBe(true);
  });

  it('release script filter contains @kiwa-test/mobile (29th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/mobile');
    expect(release).toContain('--filter @kiwa-test/mobile');
  });

  it('dogfood-mobile-real-cli-app exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'examples/dogfood-mobile-real-cli-app/src'))).toBe(true);
  });

  it('docs-tutorial-v1.54.test.ts snippet exists (32 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/mobile/tests/docs-tutorial-v1.54.test.ts'))).toBe(true);
  });
});
