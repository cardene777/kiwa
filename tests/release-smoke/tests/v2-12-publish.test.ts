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

describe('v2.12-4 publish', () => {
  it('plugin.json >= 2.12.0', () => {
    const v = readJson<{ version: string }>('.claude-plugin/plugin.json').version;
    const parts = v.split('.').map(Number);
    const major = parts[0] ?? 0;
    const minor = parts[1] ?? 0;
    expect(major).toBeGreaterThanOrEqual(2);
    expect(major > 2 || (major === 2 && minor >= 12)).toBe(true);
  });
  it('gh-discussions-announcement.md exists (v2.12)', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/announcements/v2.12/gh-discussions-announcement.md')),
    ).toBe(true);
  });
  it('@kiwa-lab/cli-test v2.1.0', () => {
    expect(readJson<{ version: string }>('packages/cli-test/package.json').version).toBe('2.1.0');
  });
  it('cli-lifecycle-orchestrator source', () => {
    const src = readText('packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts');
    expect(src).toContain('export function startCli');
    expect(src).toContain("'spawning'");
    expect(src).toContain("'cleaned'");
  });
  it('release filter @kiwa-lab/cli-test', () => {
    expect(readJson<{ scripts: { release: string } }>('package.json').scripts.release).toContain(
      '-F @kiwa-lab/cli-test',
    );
  });
  it('dogfood 5 pattern', () => {
    const src = readText(
      'examples/dogfood-cli-test-lifecycle-orchestrator-app/src/workflow.ts',
    );
    for (const r of [
      'bootCli',
      'pipeCliEvents',
      'renderCliDashboard',
      'extractStderrShare',
      'traceZombieCount',
    ]) {
      expect(src).toContain(r);
    }
  });
  it('migration v2.11-to-v2.12 exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/migrations/v2.11-to-v2.12.md'))).toBe(true);
  });
  it('concept cli-test-lifecycle-orchestrator exists', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/concepts/cli-test-lifecycle-orchestrator.md')),
    ).toBe(true);
  });
});
