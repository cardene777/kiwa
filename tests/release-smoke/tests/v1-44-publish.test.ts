// Behavior test for v1.44-6 publish PR.
// v1.44 = @kiwa-test/auth v0.5.0 → v0.6.0 minor bump. Pair 第 1 pair 3 段拡張達成
// (v1.21 → v1.22 → v1.44)。 systematic root cause pattern SSOT 19th application.
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

describe('v1.44-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.44.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.44.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.44/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.44/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.44');
    }
  });

  it('VitePress config.mts wires the Auth Passwordless UX III (v1.44) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.44');
    for (const link of [
      '/tutorials/97-passwordless-ux',
      '/tutorials/98-step-up-mfa',
      '/tutorials/99-risk-based-auth',
      '/concepts/auth-advanced-III-testing',
      '/migrations/v1.43-to-v1.44',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/auth package.json is v0.6.0', () => {
    const auth = readJson<{ name: string; version: string }>('packages/auth/package.json');
    expect(auth.name).toBe('@kiwa-test/auth');
    expect(auth.version).toBe('0.6.0');
    expect(existsSync(resolve(REPO_ROOT, 'packages/auth/src/semantics')), 'missing auth semantics/').toBe(true);
  });

  it('release script filter contains @kiwa-test/auth in both build and publish halves (19th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/auth');
    expect(release).toContain('--filter @kiwa-test/auth');
  });

  it('3 dogfood apps for v1.44 exist', () => {
    for (const app of [
      'examples/dogfood-auth-passwordless-ux-app',
      'examples/dogfood-auth-step-up-mfa-app',
      'examples/dogfood-auth-risk-based-app',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, app)), `missing: ${app}`).toBe(true);
      expect(existsSync(resolve(REPO_ROOT, `${app}/src/adapters/interface.ts`))).toBe(true);
    }
  });

  it('docs-tutorial-v1.44.test.ts snippet validation exists (22 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/auth/tests/docs-tutorial-v1.44.test.ts'))).toBe(true);
  });
});
