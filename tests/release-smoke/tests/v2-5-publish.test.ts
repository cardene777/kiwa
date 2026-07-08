// Behavior test for v2.5-4 publish PR。
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

describe('v2.5-4 publish artefacts', () => {
  it('plugin.json 2.5.0', () => {
    expect(readJson<{ version: string }>('.claude-plugin/plugin.json').version).toBe('2.5.0');
  });

  it('4 announcement files', () => {
    for (const name of ['gh-discussions-announcement.md', 'x-thread-en.md', 'x-thread-ja.md', 'zenn-article.md']) {
      const rel = `docs/announcements/v2.5/${name}`;
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
      expect(readText(rel)).toContain('v2.5');
    }
  });

  it('VitePress v2.5 sidebar', () => {
    const config = readText('docs/.vitepress/config.mts');
    for (const link of [
      '/tutorials/132-streaming-pipeline-orchestrator',
      '/concepts/streaming-pipeline-orchestrator',
      '/migrations/v2.4-to-v2.5',
    ]) {
      expect(config).toContain(link);
    }
  });

  it('@kiwa/streaming v2.1.0', () => {
    expect(readJson<{ version: string }>('packages/streaming/package.json').version).toBe('2.1.0');
  });

  it('pipeline-orchestrator source', () => {
    const src = readText('packages/streaming/src/semantics/pipeline-orchestrator.ts');
    expect(src).toContain('export function startPipeline');
    expect(src).toContain("'dlq-active'");
  });

  it('release filter @kiwa/streaming (48th)', () => {
    expect(readJson<{ scripts: { release: string } }>('package.json').scripts.release).toContain('-F @kiwa/streaming');
  });

  it('dogfood 4 pattern', () => {
    const src = readText('examples/dogfood-streaming-pipeline-app/src/workflow.ts');
    for (const r of ['bootPipeline', 'runEventStream', 'renderPipelineDashboard', 'extractDlqStats']) {
      expect(src).toContain(r);
    }
  });

  it('docs-tutorial-v2.5.test.ts snippet (51 streak)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/streaming/tests/docs-tutorial-v2.5.test.ts'))).toBe(true);
  });
});
