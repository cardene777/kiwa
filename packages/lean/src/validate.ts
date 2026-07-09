/**
 * What a spec may say, checked before anything reads it.
 *
 * Every rule here exists because breaking it produced something worse than an
 * error: a Lean kernel message naming a constructor the caller never wrote, a
 * file path pointing outside the directory it was meant for, or two cells of the
 * table quietly becoming one.
 *
 * The generated Lean is text, and a spec is user input. Checking it at the door
 * is the difference between a library that says what is wrong and one that hands
 * its problems to a compiler three steps downstream.
 */

import { SpecError } from './errors.js';
import type { OrchestratorSpec } from './types.js';

/**
 * A state or event name. Kebab-case is the convention; underscores are allowed
 * because they appear in existing tables.
 *
 * The leading letter is not a style rule: a name becomes a Lean constructor, and
 * `1st` is not an identifier. The excluded characters are the ones that would
 * leave the name and become syntax — quotes and backslashes escape out of the
 * string that carries the name into Lean, and a colon collides with the separator
 * that keys the transition table.
 */
const NAME = /^[A-Za-z][A-Za-z0-9_-]*$/;

/** A Lean namespace: an identifier, since it is written as one. */
const NAMESPACE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * A module name becomes a file name. It may not climb out of the directory it is
 * written into, or name a file the caller did not intend, so it is a plain
 * basename and nothing else.
 */
const MODULE_NAME = /^[A-Za-z][A-Za-z0-9_]*$/;

const toPascalCase = (input: string): string =>
  input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('');

const toSnakeCase = (input: string): string =>
  input
    .split(/[-\s]+/)
    .filter(Boolean)
    .join('_')
    .toLowerCase();

/** Check a spec, or throw a `SpecError` saying which rule it broke and where. */
export function validateSpec(spec: OrchestratorSpec, origin: string): void {
  const { moduleName, namespace, states, events } = spec;

  if (!MODULE_NAME.test(moduleName)) {
    throw new SpecError(
      `${origin}: moduleName ${JSON.stringify(moduleName)} is not a plain module name; ` +
        'it becomes a file name and a Lean module, so it must start with a letter and hold ' +
        'only letters, digits and underscores',
    );
  }
  if (!NAMESPACE.test(namespace)) {
    throw new SpecError(
      `${origin}: namespace ${JSON.stringify(namespace)} is not a Lean identifier; ` +
        'it must start with a letter or underscore and hold only letters, digits and underscores',
    );
  }

  if (states.length === 0) throw new SpecError(`${origin}: at least one state is required`);
  if (events.length === 0) throw new SpecError(`${origin}: at least one event is required`);

  checkNames(states, 'state', origin);
  checkNames(events, 'event', origin);

  // A state and an event may share a name: they become constructors of different
  // types. Two states may not, in any of the three spellings they end up in.
  checkNoDuplicates(states, 'state', origin);
  checkNoDuplicates(events, 'event', origin);
  checkNoConstructorCollision(states, 'state', origin);
  checkNoConstructorCollision(events, 'event', origin);
  checkNoTheoremCollision(states, origin);

  if (spec.initial !== undefined && !states.includes(spec.initial)) {
    throw new SpecError(`${origin}: unknown state in initial: ${spec.initial}`);
  }
  if (spec.terminal !== undefined) {
    const unknown = spec.terminal.filter((state) => !states.includes(state));
    if (unknown.length > 0) {
      throw new SpecError(`${origin}: unknown state in terminal: ${unknown.join(', ')}`);
    }
  }
}

function checkNames(names: readonly string[], kind: string, origin: string): void {
  for (const name of names) {
    if (typeof name !== 'string' || !NAME.test(name)) {
      throw new SpecError(
        `${origin}: ${kind} name ${JSON.stringify(name)} is not usable; ` +
          'it must start with a letter and hold only letters, digits, hyphens and underscores',
      );
    }
  }
}

function checkNoDuplicates(names: readonly string[], kind: string, origin: string): void {
  const seen = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) throw new SpecError(`${origin}: ${kind} ${name} is listed twice`);
    seen.add(name);
  }
}

/**
 * `a-b` and `aB` both become the constructor `AB`. Lean rejects the second one
 * with `duplicate constructor name`, naming an identifier the caller never wrote.
 */
function checkNoConstructorCollision(
  names: readonly string[],
  kind: string,
  origin: string,
): void {
  const byConstructor = new Map<string, string>();
  for (const name of names) {
    const constructor = toPascalCase(name);
    const previous = byConstructor.get(constructor);
    if (previous !== undefined) {
      throw new SpecError(
        `${origin}: ${kind}s ${previous} and ${name} both become the Lean constructor ` +
          `${constructor}; rename one of them`,
      );
    }
    byConstructor.set(constructor, name);
  }
}

/** `a-b` and `a_b` both name the theorem `a_b_absorbing`. */
function checkNoTheoremCollision(states: readonly string[], origin: string): void {
  const bySnake = new Map<string, string>();
  for (const state of states) {
    const snake = toSnakeCase(state);
    const previous = bySnake.get(snake);
    if (previous !== undefined) {
      throw new SpecError(
        `${origin}: states ${previous} and ${state} both name the theorems ` +
          `${snake}_absorbing and ${snake}_can_leave; rename one of them`,
      );
    }
    bySnake.set(snake, state);
  }
}
