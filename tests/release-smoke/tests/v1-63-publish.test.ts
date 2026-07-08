// Behavior test for v1.63-4 publish PR。
// v1.63 = @kiwa-test/desktop v0.8 native binding availability probe + skip 経路 (depth-8 pattern 新設 candidate)
// systematic root cause pattern SSOT 38th application.
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

describe('v1.63-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.63.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.63.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.63/', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      const rel = `docs/announcements/v1.63/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.63');
    }
  });

  it('VitePress config.mts wires v1.63 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.63');
    for (const link of [
      '/tutorials/123-desktop-probe',
      '/concepts/desktop-probe',
      '/migrations/v1.62-to-v1.63',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/desktop package.json is v0.8.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/desktop/package.json');
    expect(pkg.name).toBe('@kiwa-test/desktop');
    expect(pkg.version).toBe('0.8.0');
  });

  it('v0.8 probe file 存在', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/src/adapters/probe.ts'))).toBe(true);
  });

  it('release script filter contains @kiwa-test/desktop (38th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    expect(pkg.scripts.release).toContain('-F @kiwa-test/desktop');
  });

  it('dogfood-desktop-probe-app has 4 pattern workflow runners', () => {
    const workflow = readText('examples/dogfood-desktop-probe-app/src/workflow.ts');
    for (const runner of [
      'probeAllCliCommands',
      'getSkipDecisionsForCurrentPlatform',
      'runProbeAwareFidelityCheck',
      'checkSkipForAxis',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v1.63.test.ts snippet exists (41 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/tests/docs-tutorial-v1.63.test.ts'))).toBe(true);
  });
});
