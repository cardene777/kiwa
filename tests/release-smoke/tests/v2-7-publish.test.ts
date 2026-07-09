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

describe('v2.7-4 publish', () => {
  it('plugin.json >= 2.7.0', () => {
    const v = readJson<{ version: string }>('.claude-plugin/plugin.json').version;
    const parts = v.split('.').map(Number);
    const major = parts[0] ?? 0;
    const minor = parts[1] ?? 0;
    expect(major).toBeGreaterThanOrEqual(2);
    expect(major > 2 || (major === 2 && minor >= 7)).toBe(true);
  });
  it('4 announcement', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      expect(existsSync(resolve(REPO_ROOT, `docs/announcements/v2.7/${name}`))).toBe(true);
    }
  });
  it('VitePress v2.7', () => {
    const config = readText('docs/.vitepress/config.mts');
    for (const link of ['/tutorials/134-observability-incident-orchestrator', '/concepts/observability-incident-orchestrator', '/migrations/v2.6-to-v2.7']) {
      expect(config).toContain(link);
    }
  });
  it('@kiwa-lab/observability v2.1.0', () => {
    expect(readJson<{ version: string }>('packages/observability/package.json').version).toBe('2.1.0');
  });
  it('incident-orchestrator source', () => {
    const src = readText('packages/observability/src/semantics/incident-orchestrator.ts');
    expect(src).toContain('export function startIncident');
  });
  it('release filter @kiwa-lab/observability (50th)', () => {
    expect(readJson<{ scripts: { release: string } }>('package.json').scripts.release).toContain('-F @kiwa-lab/observability');
  });
  it('dogfood 4 pattern', () => {
    const src = readText('examples/dogfood-observability-incident-app/src/workflow.ts');
    for (const r of ['bootIncident', 'pipeIncidentEvents', 'renderIncidentDashboard', 'extractFalsePositiveRate']) {
      expect(src).toContain(r);
    }
  });
  it('docs-tutorial-v2.7.test.ts (53 streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/observability/tests/docs-tutorial-v2.7.test.ts'))).toBe(true);
  });
});
