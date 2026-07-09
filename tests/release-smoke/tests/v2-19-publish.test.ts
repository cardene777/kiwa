import { existsSync, readFileSync, readdirSync } from 'node:fs';
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

/**
 * The spec-kit -> kaname rename.
 *
 * `github/spec-kit` (118k stars) occupies the same problem space under the same
 * name, so the package was renamed before it acquired downstream users. These
 * assertions pin every surface that had to move, and prove no live reference to
 * the retired name survives outside the historical record.
 */
describe('v2.19 spec-kit -> kaname rename', () => {
  it('package is published as @kiwa-lab/kaname', () => {
    expect(readJson<{ name: string }>('packages/kaname/package.json').name).toBe(
      '@kiwa-lab/kaname',
    );
  });

  it('the old package directory is gone', () => {
    expect(existsSync(resolve(REPO_ROOT, 'packages/spec-kit'))).toBe(false);
  });

  it('repository.directory points at the new path', () => {
    expect(
      readJson<{ repository: { directory: string } }>('packages/kaname/package.json').repository
        .directory,
    ).toBe('packages/kaname');
  });

  it('release script filters on the new name', () => {
    const release = readJson<{ scripts: { release: string } }>('package.json').scripts.release;
    expect(release).toContain('-F @kiwa-lab/kaname');
    expect(release).toContain('--filter @kiwa-lab/kaname');
    expect(release).not.toContain('@kiwa-lab/spec-kit');
  });

  it('the skill is renamed to /kaname', () => {
    const skill = '.claude/skills/kaname/SKILL.md';
    expect(existsSync(resolve(REPO_ROOT, skill))).toBe(true);
    expect(existsSync(resolve(REPO_ROOT, '.claude/skills/spec-kit'))).toBe(false);
    expect(readText(skill)).toContain('name: kaname');
  });

  it('the helper script is renamed and points at the new dist', () => {
    const script = '.claude/skills/kaname/scripts/kaname-run.sh';
    expect(existsSync(resolve(REPO_ROOT, script))).toBe(true);
    expect(readText(script)).toContain('packages/kaname/dist/index.cjs');
  });

  it('concept docs are renamed', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/concepts/kaname-3-layer-model.md'))).toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'docs/concepts/kaname-skill.md'))).toBe(true);
    expect(existsSync(resolve(REPO_ROOT, 'docs/concepts/spec-kit-3-layer-model.md'))).toBe(false);
  });

  it('migration guide explains the rename', () => {
    const md = readText('docs/migrations/v2.18-to-v2.19.md');
    expect(md).toContain('@kiwa-lab/kaname');
    expect(md).toContain('github/spec-kit');
  });

  it('no shipped source still names the retired package', () => {
    // Only implementation code is scanned. Test files legitimately spell the old
    // name -- this spec asserts against it, and publish-guard.test.ts documents
    // which broken artifacts the old publish path produced.
    const offenders: string[] = [];
    const walk = (rel: string): void => {
      for (const entry of readdirSync(resolve(REPO_ROOT, rel), { withFileTypes: true })) {
        const child = `${rel}/${entry.name}`;
        if (entry.isDirectory()) {
          walk(child);
        } else if (entry.name.endsWith('.ts')) {
          if (readText(child).includes('@kiwa-lab/spec-kit')) offenders.push(child);
        }
      }
    };
    walk('packages/kaname/src');
    expect(offenders).toEqual([]);
  });

  it('the exported surface is unchanged by the rename', () => {
    const index = readText('packages/kaname/src/index.ts');
    for (const symbol of ['classify', 'splitSpec', 'SpecLayer', 'SpecItem', 'SpecDoc']) {
      expect(index).toContain(symbol);
    }
  });
});
