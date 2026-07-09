/**
 * `kaname init` scaffolds a project.
 *
 * The planning half is pure: given the set of targets and a way to ask whether
 * one exists, it decides what would happen. The writing half is the only part
 * that touches disk. Splitting them means the interesting behavior — never
 * clobbering a file the user has edited — is testable without a temp directory.
 */

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { CONFIG_FILENAME, DEFAULT_CONFIG, type KanameConfig } from './config.js';

export type InitAction = 'created' | 'skipped' | 'overwritten';

export interface InitEntry {
  /** Path relative to the project root. */
  target: string;
  action: InitAction;
}

/** A file copied verbatim from the templates directory. */
interface TemplateFile {
  /** Path relative to the templates root. */
  source: string;
  /** Path relative to the project root. */
  target: string;
}

/**
 * The file that wires the hooks into the project. A rule is read and a hook is
 * run, so without this the rules persuade and nothing enforces them.
 */
export const SETTINGS_TARGET = '.claude/settings.json';

/**
 * Everything `init` places under `.claude`, and the ignore file beside it.
 *
 * The ignore file is `gitignore` in the templates directory and `.gitignore`
 * once placed. npm reads a `.gitignore` inside a package as a real ignore rule
 * while building the tarball, so a template under its true name deletes its own
 * directory from the published package.
 *
 * `.kaname` holds the record of the last verification, and its ignore file
 * excludes everything beside itself. The commit gate reads that record's
 * modification time; committed, it would reach another machine asserting a
 * verification that never ran there.
 */
const FIXED_FILES: readonly TemplateFile[] = [
  { source: 'claude/rules/spec-layers.md', target: '.claude/rules/spec-layers.md' },
  { source: 'claude/rules/verification.md', target: '.claude/rules/verification.md' },
  { source: 'claude/rules/dev-flow.md', target: '.claude/rules/dev-flow.md' },
  { source: 'claude/skills/spec/SKILL.md', target: '.claude/skills/spec/SKILL.md' },
  { source: 'claude/skills/verify/SKILL.md', target: '.claude/skills/verify/SKILL.md' },
  { source: 'claude/settings.json', target: SETTINGS_TARGET },
  { source: 'claude/hooks/spec-gate.sh', target: '.claude/hooks/spec-gate.sh' },
  { source: 'claude/hooks/verify-gate.sh', target: '.claude/hooks/verify-gate.sh' },
  { source: 'kaname/gitignore', target: '.kaname/.gitignore' },
];

/** The gate scripts, by the name a settings file would call them under. */
const GATE_SCRIPTS: readonly string[] = FIXED_FILES.filter((f) =>
  f.target.startsWith('.claude/hooks/'),
).map((f) => f.target.slice(f.target.lastIndexOf('/') + 1));

/**
 * Everything `init` places, given a spec directory.
 *
 * `kaname.config.json` is absent: it is generated from the resolved config
 * rather than copied, so that `--tracker github` is reflected in the file the
 * user ends up with instead of being silently dropped.
 */
export function templateFiles(specDir: string): TemplateFile[] {
  return [...FIXED_FILES, { source: 'spec/README.md', target: `${specDir}/README.md` }];
}

/**
 * Whether a settings file already runs both gates before a tool call.
 *
 * An existing settings file is left alone, and there are two reasons it might be
 * there: a previous `init` wrote it, or the project has its own. Only the first
 * has the gates in it, and telling the two apart takes reading it — the plan
 * knows a file was skipped, not what is inside it.
 */
export function settingsRunGates(body: string): boolean {
  interface Handler {
    command?: unknown;
  }
  interface Entry {
    hooks?: Handler[];
  }

  let entries: Entry[];
  try {
    const parsed = JSON.parse(body) as { hooks?: { PreToolUse?: Entry[] } };
    entries = parsed.hooks?.PreToolUse ?? [];
  } catch {
    return false;
  }
  if (!Array.isArray(entries)) return false;

  const commands = entries.flatMap((entry) =>
    Array.isArray(entry.hooks) ? entry.hooks.map((handler) => String(handler.command ?? '')) : [],
  );
  return GATE_SCRIPTS.every((script) => commands.some((command) => command.includes(script)));
}

/** Every path `init` would write, config file first. */
export function initTargets(specDir: string): string[] {
  return [CONFIG_FILENAME, ...templateFiles(specDir).map((f) => f.target)];
}

/**
 * Decide what would happen to each target, without touching disk.
 *
 * An existing file is skipped rather than overwritten. `init` is expected to be
 * run again on a project that already has some of these files — after an upgrade,
 * or when adopting the flow on a repository that already has a `.claude`
 * directory — and silently replacing an edited rule would lose work.
 */
export function planInit(
  targets: readonly string[],
  exists: (target: string) => boolean,
  force = false,
): InitEntry[] {
  return targets.map((target) => {
    if (!exists(target)) return { target, action: 'created' };
    return { target, action: force ? 'overwritten' : 'skipped' };
  });
}

/** Render the config file. Kept beside the plan so both agree on the shape. */
export function renderConfig(config: KanameConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

export interface InitOptions {
  projectRoot: string;
  /** Where the templates live. Injectable so tests need not build the package. */
  templatesRoot: string;
  config?: KanameConfig;
  force?: boolean;
}

/**
 * Scaffold a project. Returns what happened to each target, in the order the
 * targets were written, so a caller can print it.
 */
export function runInit(opts: InitOptions): InitEntry[] {
  const { projectRoot, templatesRoot, force = false } = opts;
  const config = opts.config ?? DEFAULT_CONFIG;

  const files = templateFiles(config.specDir);
  const targets = initTargets(config.specDir);
  const plan = planInit(targets, (t) => existsSync(resolve(projectRoot, t)), force);
  const decided = new Map(plan.map((e) => [e.target, e.action]));

  const write = (target: string, body: () => void): void => {
    if (decided.get(target) === 'skipped') return;
    const path = resolve(projectRoot, target);
    mkdirSync(dirname(path), { recursive: true });
    body();
  };

  write(CONFIG_FILENAME, () => {
    writeFileSync(resolve(projectRoot, CONFIG_FILENAME), renderConfig(config), 'utf-8');
  });

  for (const file of files) {
    write(file.target, () => {
      copyFileSync(join(templatesRoot, file.source), resolve(projectRoot, file.target));
    });
  }

  return plan;
}
