// Behavior test for v1.53-4 publish PR。
// v1.53 = @kiwa-test/mobile v0.3 → v0.4 (real driver adapter、 pair 深度 4 段拡張達成 4 例目 depth-4 record)
// systematic root cause pattern SSOT 28th application.
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

describe('v1.53-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.53.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.53.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.53/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.53/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.53');
    }
  });

  it('VitePress config.mts wires v1.53 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.53');
    for (const link of [
      '/tutorials/113-mobile-real-driver',
      '/concepts/mobile-testing-real-driver',
      '/migrations/v1.52-to-v1.53',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/mobile package.json is v0.4.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/mobile/package.json');
    expect(pkg.name).toBe('@kiwa-test/mobile');
    expect(pkg.version).toBe('0.4.0');
  });

  it('adapter files 全存在 (types + mock-factory + fidelity-harness)', () => {
    for (const rel of [
      'packages/mobile/src/adapters/types.ts',
      'packages/mobile/src/adapters/mock-factory.ts',
      'packages/mobile/src/adapters/fidelity-harness.ts',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
    }
  });

  it('release script filter contains @kiwa-test/mobile (28th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/mobile');
    expect(release).toContain('--filter @kiwa-test/mobile');
  });

  it('dogfood-mobile-real-driver-app exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'examples/dogfood-mobile-real-driver-app/src'))).toBe(true);
  });

  it('docs-tutorial-v1.53.test.ts snippet exists (31 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/mobile/tests/docs-tutorial-v1.53.test.ts'))).toBe(true);
  });
});
