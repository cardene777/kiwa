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

describe('v2.16-3 publish', () => {
  it('plugin.json 2.16.0', () => {
    expect(readJson<{ version: string }>('.claude-plugin/plugin.json').version).toBe('2.16.0');
  });
  it('MANIFESTO.md exists (kiwa 思想 SSOT)', () => {
    expect(existsSync(resolve(REPO_ROOT, 'MANIFESTO.md'))).toBe(true);
  });
  it('MANIFESTO.md contains core message', () => {
    const src = readText('MANIFESTO.md');
    expect(src).toContain('際を制するものが');
    expect(src).toContain('3 軸融合');
  });
  it('README contains MANIFESTO link + core message', () => {
    const src = readText('README.md');
    expect(src).toContain('MANIFESTO');
    expect(src).toContain('spec-driven development platform');
  });
  it('gh-discussions-announcement.md exists (v2.16)', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/announcements/v2.16/gh-discussions-announcement.md')),
    ).toBe(true);
  });
  it('@kiwa-lab/spec-kit v0.1.0', () => {
    expect(readJson<{ version: string }>('packages/spec-kit/package.json').version).toBe('0.1.0');
  });
  it('spec-kit classify source', () => {
    const src = readText('packages/spec-kit/src/classify.ts');
    expect(src).toContain('export function classify');
    expect(src).toContain('both-layers-touch-same-artifact');
  });
  it('spec-kit split source', () => {
    const src = readText('packages/spec-kit/src/split.ts');
    expect(src).toContain('export function splitSpec');
    expect(src).toContain('specFormal');
    expect(src).toContain('specRuntime');
  });
  it('release filter @kiwa-lab/spec-kit', () => {
    expect(readJson<{ scripts: { release: string } }>('package.json').scripts.release).toContain(
      '-F @kiwa-lab/spec-kit',
    );
  });
  it('migration v2.15-to-v2.16 exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/migrations/v2.15-to-v2.16.md'))).toBe(true);
  });
  it('concept spec-kit-3-layer-model exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/concepts/spec-kit-3-layer-model.md'))).toBe(true);
  });
});
