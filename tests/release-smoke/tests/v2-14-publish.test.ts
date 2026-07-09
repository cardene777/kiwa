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

describe('v2.14-4 publish', () => {
  it('plugin.json >= 2.14.0', () => {
    const v = readJson<{ version: string }>('.claude-plugin/plugin.json').version;
    const parts = v.split('.').map(Number);
    const major = parts[0] ?? 0;
    const minor = parts[1] ?? 0;
    expect(major).toBeGreaterThanOrEqual(2);
    expect(major > 2 || (major === 2 && minor >= 14)).toBe(true);
  });
  it('gh-discussions-announcement.md exists (v2.14)', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/announcements/v2.14/gh-discussions-announcement.md')),
    ).toBe(true);
  });
  it('@kiwa-lab/lean version >= 0.1.0', () => {
    const v = readJson<{ version: string }>('packages/lean/package.json').version;
    const parts = v.split('.').map(Number);
    const major = parts[0] ?? 0;
    const minor = parts[1] ?? 0;
    expect(major > 0 || (major === 0 && minor >= 1)).toBe(true);
  });
  it('lean generator source', () => {
    const src = readText('packages/lean/src/generator.ts');
    expect(src).toContain('export function generateLeanSpec');
    expect(src).toContain('theorem dispatch_total');
  });
  it('lean lake source', () => {
    const src = readText('packages/lean/src/lake.ts');
    expect(src).toContain('export function generateLakeProject');
    expect(src).toContain('lakefile.lean');
  });
  it('release filter @kiwa-lab/lean', () => {
    expect(readJson<{ scripts: { release: string } }>('package.json').scripts.release).toContain(
      '-F @kiwa-lab/lean',
    );
    expect(readJson<{ scripts: { release: string } }>('package.json').scripts.release).toContain(
      '--filter @kiwa-lab/lean',
    );
  });
  it('dogfood spec exports', () => {
    const src = readText(
      'examples/dogfood-lean-orchestrator-specs-app/src/orchestrator-specs.ts',
    );
    for (const s of ['TRANSACTION_SPEC', 'SESSION_SPEC', 'CACHE_SPEC', 'JOB_SPEC', 'CLI_SPEC']) {
      expect(src).toContain(s);
    }
  });
  it('migration v2.13-to-v2.14 exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/migrations/v2.13-to-v2.14.md'))).toBe(true);
  });
  it('concept lean-spec-generator exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/concepts/lean-spec-generator.md'))).toBe(true);
  });
});
