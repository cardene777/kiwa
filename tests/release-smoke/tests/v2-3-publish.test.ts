// Behavior test for v2.3-4 publish PR。
// v2.3 = Payment pair depth-5 到達 (payment v2.1 lifecycle-orchestrator)
// systematic root cause pattern SSOT 46th application (continuous state machine variant Payment 転用)。
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

describe('v2.3-4 publish artefacts', () => {
  it('plugin.json version bumped to 2.3.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('2.3.0');
  });

  it('all 4 announcement files exist under docs/announcements/v2.3/', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      const rel = `docs/announcements/v2.3/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v2.3');
    }
  });

  it('VitePress config.mts wires v2.3 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v2.3');
    for (const link of [
      '/tutorials/130-payment-lifecycle-orchestrator',
      '/concepts/payment-lifecycle-orchestrator',
      '/migrations/v2.2-to-v2.3',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa/payment package.json is v2.1.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/payment/package.json');
    expect(pkg.name).toBe('@kiwa/payment');
    expect(pkg.version).toBe('2.1.0');
  });

  it('v2.1 lifecycle-orchestrator が lifecycle-orchestrator.ts に 存在', () => {
    const src = readText('packages/payment/src/semantics/lifecycle-orchestrator.ts');
    expect(src).toContain('export function startLifecycle');
    expect(src).toContain('export function handleEvent');
    expect(src).toContain("'active-billing'");
    expect(src).toContain("'chargeback-dispute'");
  });

  it('release script filter contains @kiwa/payment (46th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    expect(pkg.scripts.release).toContain('-F @kiwa/payment');
  });

  it('dogfood-payment-lifecycle-app has 4 pattern workflow runners', () => {
    const workflow = readText('examples/dogfood-payment-lifecycle-app/src/workflow.ts');
    for (const runner of [
      'bootstrapSubscription',
      'processEventBatch',
      'reportDashboard',
      'extractDunningPath',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v2.3.test.ts snippet exists (49 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/payment/tests/docs-tutorial-v2.3.test.ts'))).toBe(true);
  });
});
