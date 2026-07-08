// Behavior test for v1.59-4 publish PR。
// v1.59 = @kiwa-test/desktop v0.4 adapter layer (adapter interface + fidelity harness、 depth-4 record 5 例目)
// systematic root cause pattern SSOT 34th application. Mobile v1.53 rhythm 完全再現。
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

describe('v1.59-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.59.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.59.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.59/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.59/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.59');
    }
  });

  it('VitePress config.mts wires v1.59 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.59');
    for (const link of [
      '/tutorials/119-desktop-adapter-layer',
      '/concepts/desktop-adapter-layer',
      '/migrations/v1.58-to-v1.59',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/desktop package.json is v0.4.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/desktop/package.json');
    expect(pkg.name).toBe('@kiwa-test/desktop');
    expect(pkg.version).toBe('0.4.0');
  });

  it('v0.4 adapter layer 4 file 全存在 (types + mock-factory + fidelity-harness + index)', () => {
    for (const rel of [
      'packages/desktop/src/adapters/types.ts',
      'packages/desktop/src/adapters/mock-factory.ts',
      'packages/desktop/src/adapters/fidelity-harness.ts',
      'packages/desktop/src/adapters/index.ts',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
    }
  });

  it('release script filter contains @kiwa-test/desktop (34th application、 v1.58 継承)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/desktop');
    expect(release).toContain('--filter @kiwa-test/desktop');
  });

  it('dogfood-desktop-adapter-app has workflow runners + fidelity', () => {
    const workflow = readText('examples/dogfood-desktop-adapter-app/src/workflow.ts');
    for (const runner of [
      'runAllMockAdapters',
      'runAllRealAdapters',
      'runFullFidelityCheck',
      'ALL_AXES',
      'ALL_TARGETS',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v1.59.test.ts snippet exists (37 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/tests/docs-tutorial-v1.59.test.ts'))).toBe(true);
  });
});
