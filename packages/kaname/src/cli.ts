/**
 * The `kaname` command.
 *
 * Argument parsing is a pure function returning a description of what to do, so
 * it can be tested without spawning a process or capturing stdout. `main` is the
 * only part that reads argv, prints, and exits.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { ConfigError, DEFAULT_CONFIG, parseConfigFile, type KanameConfig } from './config.js';
import { runInit, settingsRunGates, SETTINGS_TARGET, type InitEntry } from './init.js';

export const USAGE = `kaname — spec-driven development

Usage
  kaname init [options]

Options
  --spec-dir <path>    where specifications live (default: ${DEFAULT_CONFIG.specDir})
  --tracker <kind>     none, github, or linear (default: ${DEFAULT_CONFIG.tracker})
  --force              replace files that already exist
  -h, --help           print this message

init writes kaname.config.json, rules, skills, hooks and settings under .claude,
a readme in the spec directory, and .kaname, where /verify records its result.

The hooks refuse a criterion that names no verification target, and refuse a
commit whose specification has not been verified.

Existing files are left alone unless --force is given, so it is safe to run again
after an upgrade.`;

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

/**
 * Render the outcome of an init run. Pure, so its wording is testable.
 *
 * `unwired` says the project has a settings file that runs neither gate. Whether
 * that is so cannot be read off the plan, which knows only that a file was left
 * alone, so the caller decides it and this function only says it.
 */
export function formatPlan(plan: readonly InitEntry[], unwired = false): string {
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

  // Every other file left alone is a file the user chose to keep. This one is
  // different: it is what runs the hooks, so a project holding its own settings
  // has the rules with nothing enforcing them, and nothing else would say so.
  const note = `${SETTINGS_TARGET} was already there, so nothing wired the hooks into it.
Add a "hooks" block running .claude/hooks/spec-gate.sh before Write and Edit, and
.claude/hooks/verify-gate.sh before Bash. Until then the rules are read and not enforced.`;

  const sections = [lines.join('\n'), summary];
  if (unwired) sections.push(note);
  sections.push(next);
  return sections.join('\n\n');
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

  const projectRoot = process.cwd();
  try {
    const plan = runInit({
      projectRoot,
      templatesRoot: templatesRoot(),
      config: command.config,
      force: command.force,
    });
    const keptSettings = plan.some(
      (e) => e.target === SETTINGS_TARGET && e.action === 'skipped',
    );
    process.stdout.write(`${formatPlan(plan, keptSettings && !gatesAreWired(projectRoot))}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`kaname: ${(error as Error).message}\n`);
    return 1;
  }
}

/** An unreadable settings file runs no gates, which is what the caller asked. */
function gatesAreWired(projectRoot: string): boolean {
  try {
    return settingsRunGates(readFileSync(resolve(projectRoot, SETTINGS_TARGET), 'utf-8'));
  } catch {
    return false;
  }
}
