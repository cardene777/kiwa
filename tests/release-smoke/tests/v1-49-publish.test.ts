// Behavior test for v1.49-6 publish PR。
// v1.49 = 2 package pair minor bump (component v0.3→v0.4 + nextjs v1.2→v1.3)
// systematic root cause pattern SSOT 24th application.
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

describe('v1.49-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.49.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.49.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.49/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.49/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.49');
    }
  });

  it('VitePress config.mts wires v1.49 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.49');
    for (const link of [
      '/tutorials/107-rsc-server-actions-v2',
      '/tutorials/108-view-transitions-concurrent',
      '/tutorials/109-islands-turbopack-hmr',
      '/concepts/frontend-advanced-III-testing',
      '/migrations/v1.48-to-v1.49',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/component package.json is v0.4.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/component/package.json');
    expect(pkg.name).toBe('@kiwa-test/component');
    expect(pkg.version).toBe('0.4.0');
  });

  it('@kiwa-test/nextjs package.json is v1.3.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/nextjs/package.json');
    expect(pkg.name).toBe('@kiwa-test/nextjs');
    expect(pkg.version).toBe('1.3.0');
  });

  it('4 new axis file 全存在 (component 2 + nextjs 2)', () => {
    for (const rel of [
      'packages/component/src/semantics/react-19-actions.ts',
      'packages/component/src/semantics/islands-architecture.ts',
      'packages/nextjs/src/semantics/turbopack-hmr.ts',
      'packages/nextjs/src/semantics/concurrent-transitions.ts',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
    }
  });

  it('release script filter contains both v1.49 packages (24th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    for (const name of ['@kiwa-test/component', '@kiwa-test/nextjs']) {
      expect(release, `missing -F ${name}`).toContain(`-F ${name}`);
      expect(release, `missing --filter ${name}`).toContain(`--filter ${name}`);
    }
  });

  it('3 dogfood app 全存在', () => {
    for (const rel of [
      'examples/dogfood-frontend-rsc-advanced-app/src',
      'examples/dogfood-frontend-view-transitions-app/src',
      'examples/dogfood-frontend-islands-turbopack-app/src',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
    }
  });

  it('snippet v1.49 test 全存在 (27 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/component/tests/docs-tutorial-v1.49.test.ts'))).toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/nextjs/tests/docs-tutorial-v1.49.test.ts'))).toBe(true);
  });
});
