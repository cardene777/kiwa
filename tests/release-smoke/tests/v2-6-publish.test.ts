// Behavior test for v2.6-4 publish PR.
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

describe('v2.6-4 publish artefacts', () => {
  it('plugin.json 2.6.0', () => {
    expect(readJson<{ version: string }>('.claude-plugin/plugin.json').version).toBe('2.6.0');
  });

  it('4 announcement', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      const rel = `docs/announcements/v2.6/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
      expect(readText(rel)).toContain('v2.6');
    }
  });

  it('VitePress v2.6', () => {
    const config = readText('docs/.vitepress/config.mts');
    for (const link of ['/tutorials/133-search-query-orchestrator', '/concepts/search-query-orchestrator', '/migrations/v2.5-to-v2.6']) {
      expect(config).toContain(link);
    }
  });

  it('@kiwa/search v2.1.0', () => {
    expect(readJson<{ version: string }>('packages/search/package.json').version).toBe('2.1.0');
  });

  it('query-orchestrator source', () => {
    const src = readText('packages/search/src/semantics/query-orchestrator.ts');
    expect(src).toContain('export function startQuery');
    expect(src).toContain("'facet-aggregating'");
  });

  it('release filter @kiwa/search (49th)', () => {
    expect(readJson<{ scripts: { release: string } }>('package.json').scripts.release).toContain('-F @kiwa/search');
  });

  it('dogfood 4 pattern', () => {
    const src = readText('examples/dogfood-search-query-app/src/workflow.ts');
    for (const r of ['bootQuery', 'pipeQueryEvents', 'renderQueryDashboard', 'extractTimeoutStats']) {
      expect(src).toContain(r);
    }
  });

  it('docs-tutorial-v2.6.test.ts snippet (52 streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/search/tests/docs-tutorial-v2.6.test.ts'))).toBe(true);
  });
});
