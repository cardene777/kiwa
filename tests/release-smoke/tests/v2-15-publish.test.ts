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

describe('v2.15-4 publish', () => {
  it('plugin.json >= 2.15.0', () => {
    const v = readJson<{ version: string }>('.claude-plugin/plugin.json').version;
    const parts = v.split('.').map(Number);
    const major = parts[0] ?? 0;
    const minor = parts[1] ?? 0;
    expect(major).toBeGreaterThanOrEqual(2);
    expect(major > 2 || (major === 2 && minor >= 15)).toBe(true);
  });
  it('gh-discussions-announcement.md exists (v2.15)', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/announcements/v2.15/gh-discussions-announcement.md')),
    ).toBe(true);
  });
  it('@kiwa-lab/lean v0.2.0', () => {
    expect(readJson<{ version: string }>('packages/lean/package.json').version).toBe('0.2.0');
  });
  it('lean verify source', () => {
    const src = readText('packages/lean/src/verify.ts');
    expect(src).toContain('export function verifyLeanSpec');
    expect(src).toContain("'lean-not-installed'");
    expect(src).toContain("'skipped-by-env'");
    expect(src).toContain("KIWA_LEAN_SKIP_VERIFY");
  });
  it('dogfood-lean-verify workflow exports', () => {
    const src = readText('examples/dogfood-lean-verify-integration-app/src/workflow.ts');
    for (const r of ['specToVerify', 'batchVerify', 'isSkippedOrNotInstalled']) {
      expect(src).toContain(r);
    }
  });
  it('migration v2.14-to-v2.15 exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/migrations/v2.14-to-v2.15.md'))).toBe(true);
  });
  it('concept lean-verify-integration exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/concepts/lean-verify-integration.md'))).toBe(true);
  });
});
