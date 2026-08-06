import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
function readText(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}
function readJson<T = unknown>(rel: string): T {
  return JSON.parse(readText(rel)) as T;
}

describe('v2.8-4 publish', () => {
  it('plugin.json >= 2.8.0', () => {
    const v = readJson<{ version: string }>('.claude-plugin/plugin.json').version;
    const parts = v.split('.').map(Number);
    const major = parts[0] ?? 0;
    const minor = parts[1] ?? 0;
    expect(major).toBeGreaterThanOrEqual(2);
    expect(major > 2 || (major === 2 && minor >= 8)).toBe(true);
  });
  it('gh-discussions-announcement.md exists (v2.8)', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/announcements/v2.8/gh-discussions-announcement.md')),
    ).toBe(true);
  });
  it('@kiwa-lab/orm v2.1.0', () => {
    expect(readJson<{ version: string }>('packages/orm/package.json').version).toBe('2.1.0');
  });
  it('transaction-orchestrator source', () => {
    const src = readText('packages/orm/src/semantics/transaction-orchestrator.ts');
    expect(src).toContain('export function startTransaction');
    expect(src).toContain("'beginning'");
    expect(src).toContain("'savepoint-nested'");
  });
  it('release filter @kiwa-lab/orm', () => {
    expect(readJson<{ scripts: { release: string } }>('package.json').scripts.release).toContain(
      '-F @kiwa-lab/orm',
    );
  });
  it('dogfood 5 pattern (backend systems layer 特化 = traceSavepointDepth 追加)', () => {
    const src = readText('examples/dogfood-orm-transaction-orchestrator-app/src/workflow.ts');
    for (const r of [
      'bootTransaction',
      'pipeTransactionEvents',
      'renderTransactionDashboard',
      'extractRollbackRate',
      'traceSavepointDepth',
    ]) {
      expect(src).toContain(r);
    }
  });
  it('migration v2.7-to-v2.8 exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/migrations/v2.7-to-v2.8.md'))).toBe(true);
  });
  it('concept orm-transaction-orchestrator exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/concepts/orm-transaction-orchestrator.md'))).toBe(
      true,
    );
  });
});
