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
 * Everything `init` places, given a spec directory.
 *
 * `kaname.config.json` is absent: it is generated from the resolved config
 * rather than copied, so that `--tracker github` is reflected in the file the
 * user ends up with instead of being silently dropped.
 */
export function templateFiles(specDir: string): TemplateFile[] {
  return [
    { source: 'claude/rules/spec-layers.md', target: '.claude/rules/spec-layers.md' },
    { source: 'claude/rules/verification.md', target: '.claude/rules/verification.md' },
    { source: 'claude/rules/dev-flow.md', target: '.claude/rules/dev-flow.md' },
    { source: 'claude/skills/spec/SKILL.md', target: '.claude/skills/spec/SKILL.md' },
    { source: 'spec/README.md', target: `${specDir}/README.md` },
  ];
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
