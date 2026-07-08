// Behavior test for v2.1-4 publish PR。
// v2.1 = quality-metrics 深化 IV (adaptive drift threshold learning、 statistical inference SSOT)
// systematic root cause pattern SSOT 44th application (statistical inference variant)。
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

describe('v2.1-4 publish artefacts', () => {
  it('plugin.json version bumped to 2.1.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('2.1.0');
  });

  it('all 4 announcement files exist under docs/announcements/v2.1/', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      const rel = `docs/announcements/v2.1/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v2.1');
    }
  });

  it('VitePress config.mts wires v2.1 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v2.1');
    for (const link of [
      '/tutorials/128-quality-metrics-adaptive-threshold',
      '/concepts/quality-metrics-adaptive-threshold',
      '/migrations/v2.0-to-v2.1',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa/quality-metrics package.json is v2.1.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/quality-metrics/package.json');
    expect(pkg.name).toBe('@kiwa/quality-metrics');
    expect(pkg.version).toBe('2.1.0');
  });

  it('v2.1 threshold-learning が threshold-learning.ts に 存在 (learnAdaptiveThreshold + pickThresholdForAxis)', () => {
    const src = readText('packages/quality-metrics/src/threshold-learning.ts');
    expect(src).toContain('export function learnAdaptiveThreshold');
    expect(src).toContain('export function pickThresholdForAxis');
    expect(src).toContain('AdaptiveThresholdReport');
  });

  it('release script filter contains @kiwa/quality-metrics (44th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    expect(pkg.scripts.release).toContain('-F @kiwa/quality-metrics');
  });

  it('dogfood-quality-metrics-adaptive-threshold-app has 4 pattern workflow runners', () => {
    const workflow = readText('examples/dogfood-quality-metrics-adaptive-threshold-app/src/workflow.ts');
    for (const runner of [
      'collectRolling',
      'learnFromHistory',
      'evaluateWithLearnedThreshold',
      'explainLearnedGate',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v2.1.test.ts snippet exists (47 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/quality-metrics/tests/docs-tutorial-v2.1.test.ts'))).toBe(true);
  });
});
