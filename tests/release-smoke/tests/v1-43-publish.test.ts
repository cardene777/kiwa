// Behavior test for v1.43-6 publish PR. Asserts that the publish
// artefacts land in the exact shape the previous v1.17-v1.42 publish PRs
// established, so accidental drift (wrong plugin.json version,
// missing announcement file, wrong package.json version, dropped release
// script filter entry) fails the release gate loudly.
//
// The 7 axes checked here are pure data-file invariants — the Edge /
// Serverless deepening behaviour (cold-start + middleware-chain +
// kv-eventual-consistency + r2-multipart + d1-read-replica +
// do-state-migration + websocket-hibernation + global-routing) is covered
// by `@kiwa-test/edge` v1.2 own suite (advanced 8 axis semantics already
// landed in v1.43-1).
// v1.43 keeps the v1.13+ "single primary publish surface" shape — it
// lands a single publish surface (`@kiwa-test/edge` v1.2.0, minor bump)
// because the Edge / Serverless deepening spans a single adapter package.
// The axes verify edge holds the expected version + remains in the
// release script filter halves (v1.14 payment-omission-avoidance pattern
// SSOT applied per-package, 18th application).
// v1.43 introduces the 12th 縦深化 pair — Edge / Serverless base at
// v1.43, the first new pair base since v1.37 Security (5 milestones ago),
// matching the 5-milestone new-base cadence established after the 3
// depth-4 records (v1.40 AI/LLM + v1.41 Payment + v1.42 Observability).
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

describe('v1.43-6 publish artefacts', () => {
  it('plugin.json version bumped to 1.43.0', () => {
    const plugin = readJson<{ version: string; description: string; keywords: string[] }>(
      '.claude-plugin/plugin.json',
    );
    expect(plugin.version).toBe('1.43.0');
  });

  it('all 4 announcement files exist under docs/announcements/v1.43/', () => {
    for (const name of [
      'gh-discussions-announcement.md',
      'x-thread-en.md',
      'x-thread-ja.md',
      'zenn-article.md',
    ]) {
      const rel = `docs/announcements/v1.43/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel)), `missing announcement: ${rel}`).toBe(true);
      expect(readText(rel)).toContain('v1.43');
    }
  });

  it('VitePress config.mts wires the Edge / Serverless deepening (v1.43) sidebar section', () => {
    const config = readText('docs/.vitepress/config.mts');
    expect(config).toContain('v1.43');
    for (const link of [
      '/tutorials/94-serverless-cold-start',
      '/tutorials/95-durable-object-migration',
      '/tutorials/96-global-routing',
      '/concepts/edge-serverless-advanced-testing',
      '/migrations/v1.42-to-v1.43',
    ]) {
      expect(config, `missing sidebar link: ${link}`).toContain(link);
    }
  });

  it('@kiwa-test/edge package.json is v1.2.0 (v1.43 single publish surface, minor bump)', () => {
    const edge = readJson<{ name: string; version: string }>(
      'packages/edge/package.json',
    );
    expect(edge.name).toBe('@kiwa-test/edge');
    expect(edge.version).toBe('1.2.0');
    expect(
      existsSync(resolve(REPO_ROOT, 'packages/edge/src')),
      'missing edge src/',
    ).toBe(true);
    expect(
      existsSync(resolve(REPO_ROOT, 'packages/edge/tests')),
      'missing edge tests/',
    ).toBe(true);
  });

  it('release script filter contains @kiwa-test/edge in both -F build and --filter publish halves (v1.14 payment omission avoidance, 18th application)', () => {
    const pkg = readJson<{ scripts: { release: string } }>('package.json');
    const release = pkg.scripts.release;
    expect(release, 'release script missing build filter for @kiwa-test/edge').toContain(
      '-F @kiwa-test/edge',
    );
    expect(release, 'release script missing publish filter for @kiwa-test/edge').toContain(
      '--filter @kiwa-test/edge',
    );
  });

  it('3 dogfood apps for v1.43 exist', () => {
    for (const app of [
      'examples/dogfood-edge-serverless-cold-start-app',
      'examples/dogfood-edge-durable-object-migration-app',
      'examples/dogfood-edge-global-routing-app',
    ]) {
      expect(existsSync(resolve(REPO_ROOT, app)), `missing dogfood: ${app}`).toBe(true);
      expect(existsSync(resolve(REPO_ROOT, `${app}/package.json`)), `missing package.json in: ${app}`).toBe(true);
      expect(existsSync(resolve(REPO_ROOT, `${app}/src/adapters/interface.ts`)), `missing interface.ts in: ${app}`).toBe(true);
    }
  });

  it('docs-tutorial-v1.43.test.ts snippet validation exists (21 milestone streak)', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'packages/edge/tests/docs-tutorial-v1.43.test.ts')),
      'missing docs-tutorial-v1.43.test.ts',
    ).toBe(true);
  });
});
