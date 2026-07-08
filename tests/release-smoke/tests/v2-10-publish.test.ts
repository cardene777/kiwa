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

describe('v2.10-4 publish', () => {
  it('plugin.json 2.10.0', () => {
    expect(readJson<{ version: string }>('.claude-plugin/plugin.json').version).toBe('2.10.0');
  });
  it('gh-discussions-announcement.md exists (v2.10)', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/announcements/v2.10/gh-discussions-announcement.md')),
    ).toBe(true);
  });
  it('@kiwa/cache v2.1.0', () => {
    expect(readJson<{ version: string }>('packages/cache/package.json').version).toBe('2.1.0');
  });
  it('cache-lifecycle-orchestrator source', () => {
    const src = readText('packages/cache/src/semantics/cache-lifecycle-orchestrator.ts');
    expect(src).toContain('export function startCache');
    expect(src).toContain("'filling'");
    expect(src).toContain("'evicted'");
  });
  it('release filter @kiwa/cache', () => {
    expect(readJson<{ scripts: { release: string } }>('package.json').scripts.release).toContain(
      '-F @kiwa/cache',
    );
  });
  it('dogfood 5 pattern', () => {
    const src = readText('examples/dogfood-cache-lifecycle-orchestrator-app/src/workflow.ts');
    for (const r of [
      'bootCache',
      'pipeCacheEvents',
      'renderCacheDashboard',
      'extractHitRatio',
      'traceEvictionPressure',
    ]) {
      expect(src).toContain(r);
    }
  });
  it('migration v2.9-to-v2.10 exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/migrations/v2.9-to-v2.10.md'))).toBe(true);
  });
  it('concept cache-lifecycle-orchestrator exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/concepts/cache-lifecycle-orchestrator.md'))).toBe(
      true,
    );
  });
});
