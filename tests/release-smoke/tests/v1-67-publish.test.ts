// Behavior test for v1.67-4 publish PR。
// v1.67 = @kiwa-test/desktop v1.0 invoke-cache layer (depth-6 pattern 2 例目確定 candidate)
// systematic root cause pattern SSOT 42nd application.
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

describe('v1.67-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.67.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.67.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.67/', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      const rel = `docs/announcements/v1.67/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.67');
    }
  });

  it('VitePress config.mts wires v1.67 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.67');
    for (const link of [
      '/tutorials/127-desktop-invoke-cache',
      '/concepts/desktop-invoke-cache',
      '/migrations/v1.66-to-v1.67',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/desktop package.json is v1.0.0 (major bump)', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/desktop/package.json');
    expect(pkg.name).toBe('@kiwa-test/desktop');
    expect(pkg.version).toBe('1.0.0');
  });

  it('v1.0 invoke-cache が invoke-cache.ts に 存在 (InvokeCache + withCache + buildCacheKey)', () => {
    const src = readText('packages/desktop/src/adapters/invoke-cache.ts');
    expect(src).toContain('export class InvokeCache');
    expect(src).toContain('export function buildCacheKey');
    expect(src).toContain('export async function withCache');
  });

  it('release script filter contains @kiwa-test/desktop (42nd application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    expect(pkg.scripts.release).toContain('-F @kiwa-test/desktop');
  });

  it('dogfood-desktop-invoke-cache-app has 4 pattern workflow runners', () => {
    const workflow = readText('examples/dogfood-desktop-invoke-cache-app/src/workflow.ts');
    for (const runner of [
      'warmupCacheWithMatrix',
      'probeAndInvokeCached',
      'trackCacheEffectiveness',
      'invalidateAndRefetch',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v1.67.test.ts snippet exists (45 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/desktop/tests/docs-tutorial-v1.67.test.ts'))).toBe(true);
  });
});
