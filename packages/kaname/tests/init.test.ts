import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/config.js';
import { initTargets, planInit, renderConfig, runInit, templateFiles } from '../src/init.js';

/** The real templates directory. vitest runs with the package root as cwd. */
const TEMPLATES = resolve(process.cwd(), 'templates');

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'kaname-init-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function read(target: string): string {
  return readFileSync(resolve(root, target), 'utf-8');
}

function seed(target: string, body: string): void {
  const path = resolve(root, target);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body, 'utf-8');
}

describe('templateFiles', () => {
  it('T-INIT-001 every template exists on disk', () => {
    for (const file of templateFiles('docs/spec')) {
      expect(existsSync(join(TEMPLATES, file.source))).toBe(true);
    }
  });

  it('T-INIT-002 the spec readme follows the configured spec directory', () => {
    const files = templateFiles('spec');
    expect(files.map((f) => f.target)).toContain('spec/README.md');
  });

  it('T-INIT-003 rules and the spec skill land under .claude', () => {
    const targets = templateFiles('docs/spec').map((f) => f.target);
    expect(targets).toContain('.claude/rules/spec-layers.md');
    expect(targets).toContain('.claude/rules/verification.md');
    expect(targets).toContain('.claude/rules/dev-flow.md');
    expect(targets).toContain('.claude/skills/spec/SKILL.md');
  });

  it('T-INIT-004 nothing is written outside the project root', () => {
    for (const target of initTargets('docs/spec')) {
      expect(target.startsWith('/')).toBe(false);
      expect(target.split('/')).not.toContain('..');
    }
  });
});

describe('planInit', () => {
  it('T-INIT-010 an absent target is created', () => {
    expect(planInit(['a.md'], () => false)).toEqual([{ target: 'a.md', action: 'created' }]);
  });

  it('T-INIT-011 an existing target is skipped, not overwritten', () => {
    expect(planInit(['a.md'], () => true)).toEqual([{ target: 'a.md', action: 'skipped' }]);
  });

  it('T-INIT-012 force overwrites an existing target', () => {
    expect(planInit(['a.md'], () => true, true)).toEqual([
      { target: 'a.md', action: 'overwritten' },
    ]);
  });

  it('T-INIT-013 force does not turn a creation into an overwrite', () => {
    expect(planInit(['a.md'], () => false, true)).toEqual([{ target: 'a.md', action: 'created' }]);
  });

  it('T-INIT-014 each target is judged on its own', () => {
    const present = new Set(['b.md']);
    expect(planInit(['a.md', 'b.md'], (t) => present.has(t))).toEqual([
      { target: 'a.md', action: 'created' },
      { target: 'b.md', action: 'skipped' },
    ]);
  });
});

describe('renderConfig', () => {
  it('T-INIT-020 emits indented JSON with a trailing newline', () => {
    const body = renderConfig(DEFAULT_CONFIG);
    expect(body.endsWith('\n')).toBe(true);
    expect(JSON.parse(body)).toEqual(DEFAULT_CONFIG);
  });

  it('T-INIT-021 carries the chosen tracker into the file', () => {
    const body = renderConfig({ ...DEFAULT_CONFIG, tracker: 'github' });
    expect(JSON.parse(body).tracker).toBe('github');
  });
});

describe('runInit on a real directory', () => {
  it('T-INIT-030 writes every target', () => {
    const plan = runInit({ projectRoot: root, templatesRoot: TEMPLATES });
    expect(plan.every((e) => e.action === 'created')).toBe(true);
    for (const target of initTargets(DEFAULT_CONFIG.specDir)) {
      expect(existsSync(resolve(root, target))).toBe(true);
    }
  });

  it('T-INIT-031 the generated config parses and matches the defaults', () => {
    runInit({ projectRoot: root, templatesRoot: TEMPLATES });
    expect(JSON.parse(read('kaname.config.json'))).toEqual(DEFAULT_CONFIG);
  });

  it('T-INIT-032 a chosen tracker reaches the written config', () => {
    runInit({
      projectRoot: root,
      templatesRoot: TEMPLATES,
      config: { ...DEFAULT_CONFIG, tracker: 'linear' },
    });
    expect(JSON.parse(read('kaname.config.json')).tracker).toBe('linear');
  });

  it('T-INIT-033 a chosen spec directory receives the readme', () => {
    runInit({
      projectRoot: root,
      templatesRoot: TEMPLATES,
      config: { ...DEFAULT_CONFIG, specDir: 'spec' },
    });
    expect(existsSync(resolve(root, 'spec/README.md'))).toBe(true);
    expect(existsSync(resolve(root, 'docs/spec/README.md'))).toBe(false);
    expect(JSON.parse(read('kaname.config.json')).specDir).toBe('spec');
  });

  it('T-INIT-034 templates are copied byte for byte', () => {
    runInit({ projectRoot: root, templatesRoot: TEMPLATES });
    const expected = readFileSync(join(TEMPLATES, 'claude/rules/spec-layers.md'), 'utf-8');
    expect(read('.claude/rules/spec-layers.md')).toBe(expected);
  });

  it('T-INIT-035 an edited rule survives a second run', () => {
    runInit({ projectRoot: root, templatesRoot: TEMPLATES });
    seed('.claude/rules/dev-flow.md', 'my own flow');

    const plan = runInit({ projectRoot: root, templatesRoot: TEMPLATES });

    expect(read('.claude/rules/dev-flow.md')).toBe('my own flow');
    expect(plan.every((e) => e.action === 'skipped')).toBe(true);
  });

  it('T-INIT-036 an edited config survives a second run', () => {
    runInit({ projectRoot: root, templatesRoot: TEMPLATES });
    seed('kaname.config.json', '{"tracker":"github"}');

    runInit({ projectRoot: root, templatesRoot: TEMPLATES });

    expect(JSON.parse(read('kaname.config.json'))).toEqual({ tracker: 'github' });
  });

  it('T-INIT-037 force replaces an edited file', () => {
    runInit({ projectRoot: root, templatesRoot: TEMPLATES });
    seed('.claude/rules/dev-flow.md', 'my own flow');

    const plan = runInit({ projectRoot: root, templatesRoot: TEMPLATES, force: true });

    expect(read('.claude/rules/dev-flow.md')).not.toBe('my own flow');
    expect(plan.every((e) => e.action === 'overwritten')).toBe(true);
  });

  it('T-INIT-038 a partially initialized project is completed, not reset', () => {
    seed('.claude/rules/dev-flow.md', 'my own flow');

    const plan = runInit({ projectRoot: root, templatesRoot: TEMPLATES });
    const byTarget = new Map(plan.map((e) => [e.target, e.action]));

    expect(byTarget.get('.claude/rules/dev-flow.md')).toBe('skipped');
    expect(byTarget.get('.claude/rules/spec-layers.md')).toBe('created');
    expect(read('.claude/rules/dev-flow.md')).toBe('my own flow');
    expect(existsSync(resolve(root, '.claude/rules/spec-layers.md'))).toBe(true);
  });

  it('T-INIT-039 nested directories are created as needed', () => {
    runInit({
      projectRoot: root,
      templatesRoot: TEMPLATES,
      config: { ...DEFAULT_CONFIG, specDir: 'a/b/c' },
    });
    expect(existsSync(resolve(root, 'a/b/c/README.md'))).toBe(true);
    expect(existsSync(resolve(root, '.claude/skills/spec/SKILL.md'))).toBe(true);
  });
});
