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

describe('v2.9-4 publish', () => {
  it('plugin.json 2.9.0', () => {
    expect(readJson<{ version: string }>('.claude-plugin/plugin.json').version).toBe('2.9.0');
  });
  it('gh-discussions-announcement.md exists (v2.9)', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/announcements/v2.9/gh-discussions-announcement.md')),
    ).toBe(true);
  });
  it('@kiwa/auth v2.2.0', () => {
    expect(readJson<{ version: string }>('packages/auth/package.json').version).toBe('2.2.0');
  });
  it('session-lifecycle-orchestrator source', () => {
    const src = readText('packages/auth/src/semantics/session-lifecycle-orchestrator.ts');
    expect(src).toContain('export function startSession');
    expect(src).toContain("'init'");
    expect(src).toContain("'refreshing'");
  });
  it('release filter @kiwa/auth', () => {
    expect(readJson<{ scripts: { release: string } }>('package.json').scripts.release).toContain(
      '-F @kiwa/auth',
    );
  });
  it('dogfood 5 pattern', () => {
    const src = readText(
      'examples/dogfood-auth-session-lifecycle-orchestrator-app/src/workflow.ts',
    );
    for (const r of [
      'bootSession',
      'pipeSessionEvents',
      'renderSessionDashboard',
      'extractAuthFailureRate',
      'traceRefreshLoop',
    ]) {
      expect(src).toContain(r);
    }
  });
  it('migration v2.8-to-v2.9 exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/migrations/v2.8-to-v2.9.md'))).toBe(true);
  });
  it('concept auth-session-lifecycle-orchestrator exists', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/concepts/auth-session-lifecycle-orchestrator.md')),
    ).toBe(true);
  });
});
