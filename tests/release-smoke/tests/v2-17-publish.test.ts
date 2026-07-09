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

describe('v2.17 publish', () => {
  it('plugin.json 2.17.0', () => {
    expect(readJson<{ version: string }>('.claude-plugin/plugin.json').version).toBe('2.17.0');
  });
  it('/spec-kit skill SKILL.md exists', () => {
    expect(existsSync(resolve(REPO_ROOT, '.claude/skills/spec-kit/SKILL.md'))).toBe(true);
  });
  it('SKILL.md declares user_invocable + 5 段階 dialog flow', () => {
    const src = readText('.claude/skills/spec-kit/SKILL.md');
    expect(src).toContain('user_invocable: true');
    expect(src).toContain('5 段階 dialog flow SSOT');
    expect(src).toContain('3 layer specification model');
  });
  it('spec-kit-run.sh helper script exists + executable', () => {
    const script = '.claude/skills/spec-kit/scripts/spec-kit-run.sh';
    expect(existsSync(resolve(REPO_ROOT, script))).toBe(true);
    const src = readText(script);
    expect(src).toContain('classify');
    expect(src).toContain('splitSpec');
    expect(src).toContain('packages/spec-kit/dist/index.cjs');
  });
  it('announcement v2.17 exists', () => {
    expect(
      existsSync(resolve(REPO_ROOT, 'docs/announcements/v2.17/gh-discussions-announcement.md')),
    ).toBe(true);
  });
  it('migration v2.16-to-v2.17 exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/migrations/v2.16-to-v2.17.md'))).toBe(true);
  });
  it('concept spec-kit-skill exists', () => {
    expect(existsSync(resolve(REPO_ROOT, 'docs/concepts/spec-kit-skill.md'))).toBe(true);
  });
});
