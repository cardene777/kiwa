// Behavior test for v1.47-6 publish PR。
// v1.47 = 1 package (security-devsecops v0.1 → v0.2 adapter 統合)
// systematic root cause pattern SSOT 22nd application.
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

describe('v1.47-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.47.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.47.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.47/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.47/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.47');
    }
  });

  it('VitePress config.mts wires v1.47 tutorial + migration', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.47');
    for (const link of [
      '/tutorials/105-security-adapter',
      '/migrations/v1.46-to-v1.47',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/security-devsecops package.json is v0.2.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/security-devsecops/package.json');
    expect(pkg.name).toBe('@kiwa-test/security-devsecops');
    expect(pkg.version).toBe('0.2.0');
  });

  it('6 adapter interface + 12 adapter file 全存在', () => {
    // interface + real-driver = 2 file、 6 mock + 6 real = 12 adapter
    for (const name of [
      'types.ts',
      'real-driver.ts',
      'sast-mock.ts',
      'sca-mock.ts',
      'secret-scan-mock.ts',
      'iac-scan-mock.ts',
      'dast-mock.ts',
      'container-security-mock.ts',
      'sast-real.ts',
      'sca-real.ts',
      'secret-scan-real.ts',
      'iac-scan-real.ts',
      'dast-real.ts',
      'container-security-real.ts',
      'index.ts',
    ]) {
      expect(
        existsSync(resolve(REPO_ROOT, `packages/security-devsecops/src/adapters/${name}`)),
        `missing adapter file: ${name}`,
      ).toBe(true);
    }
  });

  it('release script filter contains v1.47 package (22nd application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/security-devsecops');
    expect(release).toContain('--filter @kiwa-test/security-devsecops');
  });

  it('dogfood-security-devsecops-adapter-app exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'examples/dogfood-security-devsecops-adapter-app/src'))).toBe(true);
  });

  it('docs-tutorial-v1.47.test.ts snippet exists (25 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/security-devsecops/tests/docs-tutorial-v1.47.test.ts'))).toBe(true);
  });

  it('adapter fidelity + real-gate test files 存在', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/security-devsecops/tests/adapters/fidelity.test.ts'))).toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'packages/security-devsecops/tests/adapters/real-gate.test.ts'))).toBe(true);
  });
});
