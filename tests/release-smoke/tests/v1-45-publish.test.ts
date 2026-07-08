// Behavior test for v1.45-6 publish PR.
// v1.45 = @kiwa-test/realtime v0.2.0 → v0.3.0 minor bump. Pair 第 2 pair 3 段拡張達成
// (v1.13 → v1.28 → v1.45)。 3 例目 pair 深度 3 段記録。
// systematic root cause pattern SSOT 20th application.
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

describe('v1.45-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.45.0', () => {
    const plugin = readJson<{ version: string }>('.claude-plugin/plugin.json');
    expect(plugin.version).toBe('1.45.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.45/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.45/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.45');
    }
  });

  it('VitePress config.mts wires the Realtime III (v1.45) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.45');
    for (const link of [
      '/tutorials/100-moq-webcodecs',
      '/tutorials/101-voice-streaming',
      '/tutorials/102-svc-adaptive',
      '/concepts/realtime-advanced-III-testing',
      '/migrations/v1.44-to-v1.45',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/realtime package.json is v0.3.0', () => {
    const rt = readJson<{ name: string; version: string }>('packages/realtime/package.json');
    expect(rt.name).toBe('@kiwa-test/realtime');
    expect(rt.version).toBe('0.3.0');
    expect(existsSync(resolve(REPO_ROOT, 'packages/realtime/src/semantics')), 'missing semantics/').toBe(true);
  });

  it('release script filter contains @kiwa-test/realtime in both build + publish halves (20th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release).toContain('-F @kiwa-test/realtime');
    expect(release).toContain('--filter @kiwa-test/realtime');
  });

  it('3 dogfood apps for v1.45 exist', () => {
    for (const app of [
      'examples/dogfood-realtime-moq-webcodecs-app',
      'examples/dogfood-realtime-voice-streaming-app',
      'examples/dogfood-realtime-svc-adaptive-app',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, app)), `missing: ${app}`).toBe(true);
      expect(existsSync(resolve(REPO_ROOT, `${app}/src/adapters/interface.ts`))).toBe(true);
    }
  });

  it('docs-tutorial-v1.45.test.ts snippet validation exists (23 milestone streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/realtime/tests/docs-tutorial-v1.45.test.ts'))).toBe(true);
  });
});
