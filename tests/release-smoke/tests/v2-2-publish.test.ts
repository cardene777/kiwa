// Behavior test for v2.2-4 publish PR。
// v2.2 = Auth pair pioneer record 更新 (auth v0.7 continuous state machine)
// systematic root cause pattern SSOT 45th application (continuous state machine variant)。
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

describe('v2.2-4 publish artefacts', () => {
  it('plugin.json version bumped to 2.2.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('2.2.0');
  });

  it('all 4 announcement files exist under docs/announcements/v2.2/', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      const rel = `docs/announcements/v2.2/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v2.2');
    }
  });

  it('VitePress config.mts wires v2.2 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v2.2');
    for (const link of [
      '/tutorials/129-auth-continuous-state-machine',
      '/concepts/auth-continuous-state-machine',
      '/migrations/v2.1-to-v2.2',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa/auth package.json is v2.1.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/auth/package.json');
    expect(pkg.name).toBe('@kiwa/auth');
    expect(pkg.version).toBe('2.1.0');
  });

  it('v0.7 continuous-auth が continuous-auth.ts に 存在 (6 export + 5 state SSOT)', () => {
    const src = readText('packages/auth/src/semantics/continuous-auth.ts');
    expect(src).toContain('export function startContinuousAuth');
    expect(src).toContain('export function evaluateRisk');
    expect(src).toContain('export function completeStepUp');
    expect(src).toContain("'step-up-required'");
    expect(src).toContain("'session-frozen'");
  });

  it('release script filter contains @kiwa/auth (45th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    expect(pkg.scripts.release).toContain('-F @kiwa/auth');
  });

  it('dogfood-auth-continuous-app has 4 pattern workflow runners', () => {
    const workflow = readText('examples/dogfood-auth-continuous-app/src/workflow.ts');
    for (const runner of [
      'startWithBaselineRisk',
      'escalateOnRiskSignal',
      'completeStepUpAndDeescalate',
      'terminateOnHijack',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v2.2.test.ts snippet exists (48 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/auth/tests/docs-tutorial-v2.2.test.ts'))).toBe(true);
  });
});
