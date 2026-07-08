// Behavior test for v1.46-7 publish PR。
// v1.46 = 3 package (perf-harness v0.3 + quality-metrics v0.4 + security-devsecops v0.1 new)
// systematic root cause pattern SSOT 21st application.
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

describe('v1.46-7 publish artefacts', () => {
  it('plugin.json version bumped to 1.46.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.46.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.46/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.46/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.46');
    }
  });

  it('VitePress config.mts wires v1.46 tutorials + concepts + migration', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.46');
    for (const link of [
      '/tutorials/103-security-devsecops',
      '/tutorials/104-perf-strict',
      '/concepts/security-devsecops-library-integration',
      '/migrations/v1.45-to-v1.46',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/perf-harness package.json is v0.3.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/perf-harness/package.json');
    expect(pkg.name).toBe('@kiwa-test/perf-harness');
    expect(pkg.version).toBe('0.3.0');
  });

  it('@kiwa-test/quality-metrics package.json is v0.4.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/quality-metrics/package.json');
    expect(pkg.name).toBe('@kiwa-test/quality-metrics');
    expect(pkg.version).toBe('0.4.0');
  });

  it('@kiwa-test/security-devsecops v0.1 exists', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/security-devsecops/package.json');
    expect(pkg.name).toBe('@kiwa-test/security-devsecops');
    expect(pkg.version).toBe('0.1.0');
    expect(existsSync(resolve(REPO_ROOT, 'packages/security-devsecops/src/semantics'))).toBe(true);
  });

  it('release script filter contains 3 v1.46 packages (21st application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    for (const name of ['@kiwa-test/perf-harness', '@kiwa-test/quality-metrics', '@kiwa-test/security-devsecops']) {
      expect(release, `missing -F ${name}`).toContain(`-F ${name}`);
      expect(release, `missing --filter ${name}`).toContain(`--filter ${name}`);
    }
  });

  it('dogfood-security-devsecops-app exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'examples/dogfood-security-devsecops-app/src'))).toBe(true);
  });

  it('docs-tutorial-v1.46.test.ts snippet exists (24 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/security-devsecops/tests/docs-tutorial-v1.46.test.ts'))).toBe(true);
  });
});
