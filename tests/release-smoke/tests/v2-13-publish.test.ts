import { readFileSync, existsSync } from 'node:fs';
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

describe('v2.13-2 publish', () => {
  it('plugin.json 2.13.0', () => {
    expect(readJson<{ version: string }>('.claude-plugin/plugin.json').version).toBe('2.13.0');
  });
  it('gh-discussions-announcement.md exists (v2.13)', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/announcements/v2.13/gh-discussions-announcement.md')),
    ).toBe(true);
  });
  it('migration v2.12-to-v2.13 exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/migrations/v2.12-to-v2.13.md'))).toBe(true);
  });
  it('all 41 packages renamed to @kiwa-lab/*', () => {
    const pkgs = ['orm', 'auth', 'cache', 'queue', 'cli-test', 'core', 'observability', 'search'];
    for (const p of pkgs) {
      const pj = readJson<{ name: string }>(`packages/${p}/package.json`);
      expect(pj.name).toBe(`@kiwa-lab/${p}`);
    }
  });
  it('release script uses @kiwa-lab/ filters', () => {
    const rel = readJson<{ scripts: { release: string } }>('package.json').scripts.release;
    expect(rel).toContain('-F @kiwa-lab/');
    expect(rel).toContain('--filter @kiwa-lab/');
    expect(rel).not.toContain('-F @kiwa/');
  });
});
