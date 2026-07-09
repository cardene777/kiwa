/**
 * The `kaname` command.
 *
 * Argument parsing is a pure function returning a description of what to do, so
 * it can be tested without spawning a process or capturing stdout. `main` is the
 * only part that reads argv, prints, and exits.
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { ConfigError, DEFAULT_CONFIG, parseConfigFile, type KanameConfig } from './config.js';
import { runInit, type InitEntry } from './init.js';

export const USAGE = `kaname — spec-driven development

Usage
  kaname init [options]

Options
  --spec-dir <path>    where specifications live (default: ${DEFAULT_CONFIG.specDir})
  --tracker <kind>     none, github, or linear (default: ${DEFAULT_CONFIG.tracker})
  --force              replace files that already exist
  -h, --help           print this message

init writes kaname.config.json, three rules and one skill under .claude, and a
readme in the spec directory. Existing files are left alone unless --force is
given, so it is safe to run again after an upgrade.`;

export type Command = { kind: 'help' } | { kind: 'init'; config: KanameConfig; force: boolean };

/**
 * Interpret argv. Throws `ConfigError` on anything it cannot honor rather than
 * falling back to a default: a misspelled flag that silently does nothing is
 * worse than one that stops.
 */
export function parseArgs(argv: readonly string[]): Command {
  if (argv.length === 0) return { kind: 'help' };
  if (argv.includes('-h') || argv.includes('--help')) return { kind: 'help' };

  const [command, ...rest] = argv;
  if (command !== 'init') {
    throw new ConfigError(`unknown command "${command}"; the only command is "init"`);
  }

  let force = false;
  const overrides: Record<string, unknown> = {};

  for (let i = 0; i < rest.length; i += 1) {
    const flag = rest[i];
    if (flag === '--force') {
      force = true;
      continue;
    }
    if (flag !== '--spec-dir' && flag !== '--tracker') {
      throw new ConfigError(`unknown option "${flag}"`);
    }
    const value = rest[i + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new ConfigError(`${flag} needs a value`);
    }
    i += 1;
    if (flag === '--spec-dir') overrides.specDir = value;
    else overrides.tracker = value;
  }

  // Reuse the config validator so a flag and a config file reject the same values.
  const parsed = parseConfigFile(overrides, 'command line');
  return {
    kind: 'init',
    force,
    config: {
      tracker: parsed.tracker ?? DEFAULT_CONFIG.tracker,
      specDir: parsed.specDir ?? DEFAULT_CONFIG.specDir,
      lean: { verify: DEFAULT_CONFIG.lean.verify },
    },
  };
}

/** Render the outcome of an init run. Pure, so its wording is testable. */
export function formatPlan(plan: readonly InitEntry[]): string {
  const mark: Record<InitEntry['action'], string> = {
    created: '+',
    overwritten: '~',
    skipped: '.',
  };
  const lines = plan.map((e) => `  ${mark[e.action]} ${e.target}`);
  const count = (action: InitEntry['action']): number =>
    plan.filter((e) => e.action === action).length;

  // A zero is worth printing only when it is the whole story. "0 created,
  // 6 overwritten" says nothing that "6 overwritten" does not.
  const parts = ([['created', 'created'], ['overwritten', 'overwritten'], ['skipped', 'left alone']] as const)
    .filter(([action]) => count(action) > 0)
    .map(([action, word]) => `${count(action)} ${word}`);
  const summary = parts.length > 0 ? parts.join(', ') : 'nothing to write';

  const next =
    count('skipped') === plan.length
      ? 'Nothing to do. Pass --force to replace these files.'
      : 'Next: run /spec to write your first specification.';

  return `${lines.join('\n')}\n\n${summary}\n${next}`;
}

/** The templates ship beside the compiled output, one level up from `dist`. */
function templatesRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
}

export function main(argv: readonly string[] = process.argv.slice(2)): number {
  let command: Command;
  try {
    command = parseArgs(argv);
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    process.stderr.write(`kaname: ${error.message}\n\n${USAGE}\n`);
    return 1;
  }

  if (command.kind === 'help') {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }

  try {
    const plan = runInit({
      projectRoot: process.cwd(),
      templatesRoot: templatesRoot(),
      config: command.config,
      force: command.force,
    });
    process.stdout.write(`${formatPlan(plan)}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`kaname: ${(error as Error).message}\n`);
    return 1;
  }
}
