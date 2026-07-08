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

describe('v2.11-4 publish', () => {
  it('plugin.json 2.11.0', () => {
    expect(readJson<{ version: string }>('.claude-plugin/plugin.json').version).toBe('2.11.0');
  });
  it('gh-discussions-announcement.md exists (v2.11)', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/announcements/v2.11/gh-discussions-announcement.md')),
    ).toBe(true);
  });
  it('@kiwa/queue v2.1.0', () => {
    expect(readJson<{ version: string }>('packages/queue/package.json').version).toBe('2.1.0');
  });
  it('job-lifecycle-orchestrator source', () => {
    const src = readText('packages/queue/src/semantics/job-lifecycle-orchestrator.ts');
    expect(src).toContain('export function startJob');
    expect(src).toContain("'queued'");
    expect(src).toContain("'dlq'");
  });
  it('release filter @kiwa/queue', () => {
    expect(readJson<{ scripts: { release: string } }>('package.json').scripts.release).toContain(
      '-F @kiwa/queue',
    );
  });
  it('dogfood 5 pattern', () => {
    const src = readText(
      'examples/dogfood-queue-job-lifecycle-orchestrator-app/src/workflow.ts',
    );
    for (const r of [
      'bootJob',
      'pipeJobEvents',
      'renderJobDashboard',
      'extractFailureRate',
      'traceRetryDepth',
    ]) {
      expect(src).toContain(r);
    }
  });
  it('migration v2.10-to-v2.11 exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/migrations/v2.10-to-v2.11.md'))).toBe(true);
  });
  it('concept queue-job-lifecycle-orchestrator exists', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/concepts/queue-job-lifecycle-orchestrator.md')),
    ).toBe(true);
  });
});
