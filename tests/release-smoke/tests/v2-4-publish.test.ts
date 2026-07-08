// Behavior test for v2.4-4 publish PR。
// v2.4 = Realtime pair depth-5 到達 (realtime v2.1 session-orchestrator)
// systematic root cause pattern SSOT 47th application (continuous state machine variant Realtime 転用)。
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

describe('v2.4-4 publish artefacts', () => {
  it('plugin.json version bumped to 2.4.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('2.4.0');
  });

  it('all 4 announcement files exist under docs/announcements/v2.4/', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      const rel = `docs/announcements/v2.4/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v2.4');
    }
  });

  it('VitePress config.mts wires v2.4 tutorial + migration + concept', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v2.4');
    for (const link of [
      '/tutorials/131-realtime-session-orchestrator',
      '/concepts/realtime-session-orchestrator',
      '/migrations/v2.3-to-v2.4',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa/realtime package.json is v2.1.0', () => {
    const pkg = readJson<{ name: string; version: string }>('packages/realtime/package.json');
    expect(pkg.name).toBe('@kiwa/realtime');
    expect(pkg.version).toBe('2.1.0');
  });

  it('v2.1 session-orchestrator が session-orchestrator.ts に 存在', () => {
    const src = readText('packages/realtime/src/semantics/session-orchestrator.ts');
    expect(src).toContain('export function startSession');
    expect(src).toContain('export function dispatchEvent');
    expect(src).toContain("'connecting'");
    expect(src).toContain("'degraded'");
  });

  it('release script filter contains @kiwa/realtime (47th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    expect(pkg.scripts.release).toContain('-F @kiwa/realtime');
  });

  it('dogfood-realtime-session-app has 4 pattern workflow runners', () => {
    const workflow = readText('examples/dogfood-realtime-session-app/src/workflow.ts');
    for (const runner of [
      'openWebSocketSession',
      'pumpEventStream',
      'renderSessionDashboard',
      'extractReconnectStats',
    ]) {
      expect(workflow, `missing runner: ${runner}`).toContain(runner);
    }
  });

  it('docs-tutorial-v2.4.test.ts snippet exists (50 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/realtime/tests/docs-tutorial-v2.4.test.ts'))).toBe(true);
  });
});
