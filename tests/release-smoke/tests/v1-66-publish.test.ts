// Behavior test for v1.66-4 publish PR。
// v1.66 = @kiwa-test/quality-metrics v0.6 evaluateReleaseGate に drift check opt-in 統合 (depth-5 pattern 3 例目確定 実運用継続)
// systematic root cause pattern SSOT 41st application.
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

describe('v1.66-4 publish artefacts', () => {
  it('plugin.json version bumped to 1.66.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.66.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.66/', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      const rel = `docs/announcements/v1.66/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.66');
    }
  });

  it('VitePress config.mts wires v1.66 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.66');
    for (const link of [
      '/tutorials/126-quality-metrics-drift-gate',
      '/concepts/quality-metrics-drift-gate',
      '/migrations/v1.65-to-v1.66',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/quality-metrics package.json is v0.6.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/quality-metrics/package.json');
    expect(pkg.name).toBe('@kiwa-test/quality-metrics');
    expect(pkg.version).toBe('0.6.0');
  });

  it('v0.6 drift 統合 が gate.ts に 存在 (evaluateReleaseGate 内 driftEnabled + driftBaseline check)', () => {
    const gate = readText('packages/quality-metrics/src/gate.ts');
    expect(gate).toContain('context.driftEnabled === true');
    expect(gate).toContain('context.driftBaseline !== undefined');
    expect(gate).toContain('drift.${regression.axis}');
  });

  it('release script filter contains @kiwa-test/quality-metrics (41st application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    expect(pkg.scripts.release).toContain('-F @kiwa-test/quality-metrics');
  });

  it('dogfood-quality-metrics-drift-gate-app has 4 pattern workflow runners', () => {
    const workflow = readText('examples/dogfood-quality-metrics-drift-gate-app/src/workflow.ts');
    for (const runner of [
      'evaluateWithDriftGate',
      'verifyReleaseWithDrift',
      'explainDriftBlockers',
      'tryReleaseWithoutDrift',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v1.66.test.ts snippet exists (44 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/quality-metrics/tests/docs-tutorial-v1.66.test.ts'))).toBe(true);
  });
});
