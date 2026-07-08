// Behavior test for v1.48-4 publish PR。
// v1.48 = 1 package (security-devsecops v0.2 → v0.3 Phase 3 orchestrator)
// systematic root cause pattern SSOT 23rd application.
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

describe('v1.48-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.48.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.48.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.48/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.48/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.48');
    }
  });

  it('VitePress config.mts wires v1.48 tutorial + migration', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.48');
    for (const link of [
      '/tutorials/106-security-orchestrator',
      '/migrations/v1.47-to-v1.48',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/security-devsecops package.json is v0.3.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/security-devsecops/package.json');
    expect(pkg.name).toBe('@kiwa-test/security-devsecops');
    expect(pkg.version).toBe('0.3.0');
  });

  it('orchestrator 5 file 全存在 (types + preset + run-audit + summary + index)', () => {
    for (const name of ['types.ts', 'preset.ts', 'run-audit.ts', 'summary.ts', 'index.ts']) {
      expect(
        existsSync(resolve(REPO_ROOT, `packages/security-devsecops/src/orchestrator/${name}`)),
        `missing orchestrator file: ${name}`,
      ).toBe(true);
    }
  });

  it('release script filter contains v1.48 package (23rd application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/security-devsecops');
    expect(release).toContain('--filter @kiwa-test/security-devsecops');
  });

  it('dogfood-security-devsecops-orchestrator-app exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'examples/dogfood-security-devsecops-orchestrator-app/src'))).toBe(true);
  });

  it('docs-tutorial-v1.48.test.ts snippet exists (26 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/security-devsecops/tests/docs-tutorial-v1.48.test.ts'))).toBe(true);
  });

  it('orchestrator run-audit test file 存在', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/security-devsecops/tests/orchestrator/run-audit.test.ts'))).toBe(true);
  });
});
