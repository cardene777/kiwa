import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/config.js';
import {
  SETTINGS_TARGET,
  initTargets,
  planInit,
  renderConfig,
  runInit,
  settingsRunGates,
  templateFiles,
} from '../src/init.js';

interface HookHandler {
  type: string;
  command: string;
}
interface HookEntry {
  matcher: string;
  hooks: HookHandler[];
}
interface Settings {
  hooks: { PreToolUse: HookEntry[] };
}

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

  it('T-INIT-003 rules, skills, hooks and settings land under .claude', () => {
    const targets = templateFiles('docs/spec').map((f) => f.target);
    expect(targets).toContain('.claude/rules/spec-layers.md');
    expect(targets).toContain('.claude/rules/verification.md');
    expect(targets).toContain('.claude/rules/dev-flow.md');
    expect(targets).toContain('.claude/skills/spec/SKILL.md');
    expect(targets).toContain('.claude/skills/verify/SKILL.md');
    expect(targets).toContain('.claude/hooks/spec-gate.sh');
    expect(targets).toContain('.claude/hooks/verify-gate.sh');
    expect(targets).toContain(SETTINGS_TARGET);
  });

  it('T-INIT-004 nothing is written outside the project root', () => {
    for (const target of initTargets('docs/spec')) {
      expect(target.startsWith('/')).toBe(false);
      expect(target.split('/')).not.toContain('..');
    }
  });

  it('T-INIT-005 no template is named .gitignore, which npm reads as a real ignore rule', () => {
    // A template under its true name empties its own directory from the
    // published tarball. It is carried without the dot and renamed on the way in.
    expect(existsSync(join(TEMPLATES, 'kaname/.gitignore'))).toBe(false);
    expect(existsSync(join(TEMPLATES, 'kaname/gitignore'))).toBe(true);
    expect(templateFiles('docs/spec').map((f) => f.target)).toContain('.kaname/.gitignore');
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

describe('the settings file wires the hooks that init places', () => {
  function settings(): Settings {
    runInit({ projectRoot: root, templatesRoot: TEMPLATES });
    return JSON.parse(read(SETTINGS_TARGET)) as Settings;
  }

  function commands(): string[] {
    return settings().hooks.PreToolUse.flatMap((entry) => entry.hooks.map((h) => h.command));
  }

  it('T-INIT-040 every command it names is a hook that was written to disk', () => {
    for (const command of commands()) {
      const script = /\.claude\/hooks\/[a-z-]+\.sh/.exec(command)?.[0];
      expect(script).toBeDefined();
      expect(existsSync(resolve(root, script as string))).toBe(true);
    }
  });

  it('T-INIT-041 the gates run before the tools they guard', () => {
    const entries = settings().hooks.PreToolUse;
    const byMatcher = new Map(entries.map((e) => [e.matcher, e.hooks[0]?.command ?? '']));
    expect(byMatcher.get('Write|Edit')).toContain('spec-gate.sh');
    expect(byMatcher.get('Bash')).toContain('verify-gate.sh');
  });

  it('T-INIT-042 the hooks are invoked through bash, so a lost executable bit cannot silence them', () => {
    // npm does not promise to carry a file's mode into the published tarball. A
    // hook Claude Code cannot execute is a gate that never refuses anything.
    for (const command of commands()) expect(command.startsWith('bash ')).toBe(true);
  });

  it('T-INIT-043 the hook paths resolve against the project, not the working directory', () => {
    for (const command of commands()) expect(command).toContain('$CLAUDE_PROJECT_DIR');
  });

  it('T-INIT-044 the verification record is kept out of the repository', () => {
    runInit({ projectRoot: root, templatesRoot: TEMPLATES });
    const ignore = read('.kaname/.gitignore');
    expect(ignore).toContain('*');
    expect(ignore).toContain('!.gitignore');
  });
});

describe('settingsRunGates tells a wired settings file from an unwired one', () => {
  it('T-INIT-045 the settings init writes are recognized as wired', () => {
    // Without this, a second init reports its own work as unenforced.
    runInit({ projectRoot: root, templatesRoot: TEMPLATES });
    expect(settingsRunGates(read(SETTINGS_TARGET))).toBe(true);
  });

  it('T-INIT-046 a settings file the project already had is not wired', () => {
    expect(settingsRunGates('{"permissions":{"allow":["Bash(ls:*)"]}}')).toBe(false);
  });

  it('T-INIT-047 a settings file with other PreToolUse hooks is still not wired', () => {
    const body = '{"hooks":{"PreToolUse":[{"matcher":"Bash","hooks":[{"command":"./mine.sh"}]}]}}';
    expect(settingsRunGates(body)).toBe(false);
  });

  it('T-INIT-048 one gate is not both gates', () => {
    const body =
      '{"hooks":{"PreToolUse":[{"matcher":"Write","hooks":[{"command":"bash .claude/hooks/spec-gate.sh"}]}]}}';
    expect(settingsRunGates(body)).toBe(false);
  });

  it.each([
    ['an empty file', ''],
    ['a file that is not JSON', 'hooks: PreToolUse'],
    ['a file with no hooks', '{}'],
    ['a file whose PreToolUse is empty', '{"hooks":{"PreToolUse":[]}}'],
    ['a file whose PreToolUse is not a list', '{"hooks":{"PreToolUse":"spec-gate.sh"}}'],
  ])('T-INIT-049 %s runs no gates', (_name, body) => {
    expect(settingsRunGates(body)).toBe(false);
  });
});
